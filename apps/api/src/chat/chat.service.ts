import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MistralAiService } from "../agent-orchestration/mistral-ai/mistral-ai.service";
import { TwinService } from "../twin/twin.service";
import { CHAT_SYSTEM_PROMPT } from "./chat.prompt";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private mistralAi: MistralAiService,
    private twinService: TwinService
  ) {}

  async getConversations(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);

    return this.prisma.conversation.findMany({
      where: { patientId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
    });
  }

  async getMessages(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation)
      throw new NotFoundException(`Conversation ${conversationId} not found`);

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async getOrCreateConversation(patientId: string, conversationId?: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);

    if (conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, patientId },
      });
      if (conversation) return conversation;
    }

    return this.prisma.conversation.create({
      data: { patientId },
    });
  }

  async sendMessage(
    patientId: string,
    conversationId: string | undefined,
    content: string
  ) {
    const conversation = await this.getOrCreateConversation(
      patientId,
      conversationId
    );

    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content,
      },
    });

    let assistantContent: string;
    try {
      const clinicalContext = await this.buildClinicalContext(patientId);
      const userContext = await this.buildUserContext(conversation.id);

      assistantContent = await this.mistralAi.createMessage(
        CHAT_SYSTEM_PROMPT,
        clinicalContext + "\n\n" + userContext + "\n\nPatient: " + content,
        1024
      );
    } catch (error) {
      this.logger.error(`LLM call failed: ${error}`);
      throw new InternalServerErrorException("Failed to generate AI response");
    }

    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: assistantContent,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
    };
  }

  async buildClinicalContext(patientId: string): Promise<string> {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    const [readings, events, analyses, riskAssessments, alerts, medications, labResults] =
      await Promise.all([
        this.prisma.glucoseReading.findMany({
          where: { patientId, timestamp: { gte: since } },
          orderBy: { timestamp: "desc" },
          take: 200,
        }),
        this.prisma.lifeEvent.findMany({
          where: { patientId, timestamp: { gte: since } },
          orderBy: { timestamp: "desc" },
          take: 50,
        }),
        this.prisma.clinicalAnalysis.findMany({
          where: { patientId },
          orderBy: { generatedAt: "desc" },
          take: 3,
        }),
        this.prisma.riskAssessment.findMany({
          where: { patientId },
          orderBy: { assessedAt: "desc" },
          take: 3,
        }),
        this.prisma.alert.findMany({
          where: { patientId, status: "active" },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        this.prisma.medication.findMany({
          where: { patientId },
          orderBy: { startDate: "desc" },
          take: 20,
        }),
        this.prisma.labResult.findMany({
          where: { patientId, date: { gte: since } },
          orderBy: { date: "desc" },
          take: 20,
        }),
      ]);

    const parts: string[] = [];

    parts.push(`Patient Profile: ${patient?.diabetesType || "unknown"} diabetes`);

    if (readings.length > 0) {
      const values = readings.map((r) => r.value);
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const recent = readings.slice(0, 20).map(
        (r) =>
          `  ${r.timestamp.toISOString()} - ${r.value} mg/dL (${r.source})`
      );
      parts.push(
        `Recent Glucose Readings (${readings.length} in last 14 days):\n  Average: ${avg} mg/dL\n  Recent:\n${recent.join("\n")}`
      );
    } else {
      parts.push("No glucose readings available in the last 14 days");
    }

    if (events.length > 0) {
      const formatted = events.slice(0, 20).map(
        (e) =>
          `  ${e.timestamp.toISOString()} - ${e.type}: ${JSON.stringify(e.metadata)}`
      );
      parts.push(
        `Recent Life Events (${events.length} total):\n${formatted.join("\n")}`
      );
    }

    if (analyses.length > 0) {
      const formatted = analyses.map((a) => {
        const patterns = a.patterns as any[];
        const risks = a.risks as any[];
        return `  ${a.generatedAt.toISOString()} - Patterns: ${JSON.stringify(patterns)}, Risks: ${JSON.stringify(risks)}`;
      });
      parts.push(`Recent Clinical Analyses:\n${formatted.join("\n")}`);
    }

    if (riskAssessments.length > 0) {
      const latest = riskAssessments[0];
      parts.push(
        `Latest Risk Assessment (${latest.assessedAt.toISOString()}):\n  Overall: ${latest.overallRisk}\n  Hyperglycemia: ${(latest.hyperglycemiaRisk * 100).toFixed(0)}%\n  Hypoglycemia: ${(latest.hypoglycemiaRisk * 100).toFixed(0)}%`
      );
    }

    if (alerts.length > 0) {
      const formatted = alerts.map(
        (a) => `  [${a.severity}] ${a.title}: ${a.message}`
      );
      parts.push(`Active Alerts:\n${formatted.join("\n")}`);
    }

    if (medications.length > 0) {
      const formatted = medications.map(
        (m) => `  ${m.name} ${m.dosage || ""} (${m.frequency || "unknown"}) - ${m.active ? "active" : "inactive"}`
      );
      parts.push(`Current Medications:\n${formatted.join("\n")}`);
    }

    if (labResults.length > 0) {
      const formatted = labResults.map(
        (l) => `  ${l.date.toISOString().slice(0, 10)} - ${l.name}: ${l.value} ${l.unit || ""}`
      );
      parts.push(`Recent Lab Results:\n${formatted.join("\n")}`);
    }

    return parts.join("\n\n");
  }

  private async buildUserContext(conversationId: string): Promise<string> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    if (messages.length === 0) return "This is the start of the conversation.";

    const formatted = messages.map(
      (m) => `${m.role === "user" ? "Patient" : "Assistant"}: ${m.content}`
    );
    return `Previous messages in this conversation:\n${formatted.join("\n")}`;
  }
}
