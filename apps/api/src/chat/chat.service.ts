import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ConversationAgent,
  MessageChannel,
  MessageDirection,
  MessageSenderType,
  Prisma,
  Role,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../ingestion/ingestion.service";
import { ActivateChannelDto } from "./dto/activate-channel.dto";
import { SendMessageDto } from "./dto/send-message.dto";

interface PyChatResponse {
  reply: string;
  model: string;
  source: "mistral" | "fallback";
}

interface SessionCloseInfo {
  isClosed: boolean;
  cleanReply: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly riskModelUrl: string;
  private readonly mistralModel: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.riskModelUrl = this.config.get<string>(
      "RISK_MODEL_URL",
      "http://localhost:8000",
    );
    this.mistralModel = this.config.get<string>(
      "MISTRAL_MODEL",
      "mistral-small-latest",
    );
  }

  // ====================================================================
  // Authorization
  // ====================================================================

  private async assertCanRead(
    user: AuthUser,
    patientId: string,
  ): Promise<void> {
    if (user.role === Role.PATIENT) {
      if (user.profileId !== patientId)
        throw new ForbiddenException("Cannot access another patient's data");
      return;
    }
    if (user.role === Role.CLINICIAN) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: { clinicianId: true },
      });
      if (!patient) throw new NotFoundException("Patient not found");
      if (patient.clinicianId !== user.profileId)
        throw new ForbiddenException(
          "Cannot access data of a patient not assigned to you",
        );
      return;
    }
    throw new ForbiddenException("Insufficient permissions");
  }

  private async assertCanReadConversation(
    user: AuthUser,
    conversationId: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { patientId: true, channel: true },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    await this.assertCanRead(user, conv.patientId);
    return conv;
  }

  // ====================================================================
  // MessagingChannelAccount
  // ====================================================================

  async activateChannel(
    user: AuthUser,
    patientId: string,
    dto: ActivateChannelDto,
  ) {
    if (user.role !== Role.PATIENT || user.profileId !== patientId)
      throw new ForbiddenException("Only the patient can activate a channel");

    return this.prisma.messagingChannelAccount.upsert({
      where: {
        patientId_channel: {
          patientId,
          channel: dto.channel,
        },
      },
      create: {
        patientId,
        channel: dto.channel,
        externalId: dto.externalId,
        optedIn: true,
      },
      update: {
        externalId: dto.externalId,
        optedIn: true,
      },
    });
  }

  // ====================================================================
  // Conversation
  // ====================================================================

  async getOrCreateConversation(
    patientId: string,
    channel: MessageChannel,
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        patientId,
        channel,
        isActive: true,
        agent: ConversationAgent.CARE_ASSISTANT,
      },
      orderBy: { startedAt: "desc" },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        patientId,
        channel,
        agent: ConversationAgent.CARE_ASSISTANT,
        isActive: true,
      },
    });
  }

  async createConversationForPatient(user: AuthUser, patientId: string) {
    await this.assertCanRead(user, patientId);
    return this.getOrCreateConversation(patientId, MessageChannel.APP);
  }

  async getConversations(user: AuthUser, patientId: string) {
    await this.assertCanRead(user, patientId);
    return this.prisma.conversation.findMany({
      where: { patientId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  /** Clinician read-only access to patient's conversation history */
  async getPatientConversationsForClinician(user: AuthUser, patientId: string) {
    await this.assertCanRead(user, patientId);
    return this.prisma.conversation.findMany({
      where: { patientId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  // ====================================================================
  // Messages — send + agent response
  // ====================================================================

  async sendMessage(
    user: AuthUser,
    conversationId: string,
    dto: SendMessageDto,
  ) {
    const conv = await this.assertCanReadConversation(user, conversationId);

    // 1. Persist inbound message
    const inbound = await this.prisma.message.create({
      data: {
        conversationId,
        direction: "INBOUND",
        sender: "PATIENT",
        channel: conv.channel,
        contentText: dto.content,
        audioUrl: dto.audioUrl,
        status: "DELIVERED",
        sentAt: new Date(),
      },
    });

    // 2. Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // 3. Build context and call Care Assistant Agent
    const rawAgentReply = await this.callCareAssistant(
      conv.patientId,
      conversationId,
      dto.content,
    );

    // 4. Check for session closure marker and extract clean reply
    const { isClosed, cleanReply } = this.detectSessionClosure(rawAgentReply);

    // 5. Persist outbound message FIRST (mandatory for clinician history)
    const outbound = await this.prisma.message.create({
      data: {
        conversationId,
        direction: "OUTBOUND",
        sender: "AI_AGENT",
        channel: conv.channel,
        contentText: cleanReply,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    // 6. Update conversation timestamp & set isActive: false if session closed
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        isActive: isClosed ? false : true,
      },
    });

    return { inbound, outbound, sessionEnded: isClosed };
  }

  /**
   * Detects [SESSION_CLOSED] marker in agent reply.
   * Returns clean reply (without marker) and boolean flag.
   */
  private detectSessionClosure(reply: string): SessionCloseInfo {
    const marker = "[SESSION_CLOSED]";
    const idx = reply.indexOf(marker);
    if (idx >= 0) {
      return {
        isClosed: true,
        cleanReply: reply.slice(0, idx).trim(),
      };
    }
    return { isClosed: false, cleanReply: reply };
  }

  async getMessages(user: AuthUser, conversationId: string) {
    await this.assertCanReadConversation(user, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  // ====================================================================
  // Care Assistant Agent call
  // ====================================================================

  private async callCareAssistant(
    patientId: string,
    conversationId: string,
    userMessage: string,
  ): Promise<string> {
    // Gather clinical context
    const [latestAnalysis, latestReport, recentMessages] = await Promise.all([
      this.prisma.clinicalAnalysis.findFirst({
        where: { patientId },
        orderBy: { generatedAt: "desc" },
      }),
      this.prisma.clinicalReport.findFirst({
        where: { patientId },
        orderBy: { generatedAt: "desc" },
      }),
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    // Check for safety override (dosage, severe pain, new symptoms)
    const lowerMessage = userMessage.toLowerCase();
    const isDosageOrSafetyQuery =
      lowerMessage.includes("dose") ||
      lowerMessage.includes("dosage") ||
      lowerMessage.includes("posologie") ||
      lowerMessage.includes("douleur") ||
      lowerMessage.includes("pain") ||
      lowerMessage.includes("symptôm") ||
      lowerMessage.includes("symptom") ||
      lowerMessage.includes("augmenter") ||
      lowerMessage.includes("diminuer") ||
      lowerMessage.includes("double");

    if (isDosageOrSafetyQuery) {
      return (
        "Je comprends votre préoccupation, mais en tant qu'assistant de soins, je ne peux pas ajuster vos dosages de médicaments ni diagnostiquer de nouveaux symptômes ou douleurs. " +
        "Veuillez contacter immédiatement votre clinicien traitant ou votre équipe soignante pour cette question de traitement. " +
        "Prenez bien soin de vous ! [SESSION_CLOSED]"
      );
    }

    // Build conversation history for the LLM
    const history = recentMessages
      .reverse()
      .map((m) => ({
        role: (m.sender === "PATIENT" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.contentText ?? "",
      }))
      .filter((m) => m.content.length > 0);

    // System prompt — Care Assistant Agent persona & strict rules
    const systemParts: string[] = [];
    systemParts.push(
      "You are the Care Assistant Agent for CarePulse, a diabetes care platform.",
    );
    systemParts.push(
      "You speak directly to the patient in a warm, empathetic, clear, and highly encouraging tone.",
    );
    systemParts.push(
      "Your goal is to motivate the patient, maintain hope, and encourage discipline in their diabetes treatment.",
    );
    systemParts.push(
      "STRICT RULE: You NEVER invent new clinical analyses or medical facts. You ONLY rely on information from the validated clinical report and clinical analysis provided below.",
    );
    systemParts.push(
      "STRICT MEDICAL SAFETY RULE: Never give advice on changing medication dosages or diagnosing new pain/symptoms. Immediately urge the patient to contact their clinician.",
    );
    systemParts.push(
      "SESSION CLOSURE RULE: If you have answered the patient's question, reassured and motivated them, OR redirected them to their clinician, you MUST end the exchange cleanly. Include '[SESSION_CLOSED]' at the end of your response along with a brief summary of the advice given and a final word of encouragement.",
    );
    systemParts.push(
      "Keep responses concise (2-4 sentences plus final encouragement).",
    );

    if (latestAnalysis) {
      systemParts.push(
        `\nLatest validated clinical analysis (Agent 1 reference):\n` +
          `Patterns: ${JSON.stringify(latestAnalysis.patterns)}\n` +
          `Explanations: ${latestAnalysis.explanations}\n` +
          `Recommendations: ${JSON.stringify(latestAnalysis.recommendations)}`,
      );
    }

    if (latestReport) {
      systemParts.push(
        `\nLatest validated clinical report summary:\n${latestReport.summary}\n` +
          `Priorities: ${JSON.stringify(latestReport.priorities)}\n` +
          `Points to watch: ${JSON.stringify(latestReport.pointsToWatch)}`,
      );
    }

    // Call Python microservice POST /chat
    try {
      const url = `${this.riskModelUrl}/chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.length > 0 ? history : [{ role: "user", content: userMessage }],
          system_prompt: systemParts.join("\n"),
          model: this.mistralModel,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        this.logger.warn(`POST /chat returned ${res.status}: ${text}`);
        return this.fallbackReply(userMessage);
      }

      const data = (await res.json()) as PyChatResponse;
      if (data.source === "fallback" || !data.reply) {
        return this.fallbackReply(userMessage);
      }

      // Check if conversation seems naturally completed in reply
      let replyText = data.reply;
      if (
        !replyText.includes("[SESSION_CLOSED]") &&
        (history.length >= 4 || lowerMessage.includes("merci") || lowerMessage.includes("thanks"))
      ) {
        replyText += " [SESSION_CLOSED]";
      }

      return replyText;
    } catch (err) {
      this.logger.error("Care Assistant chat failed", (err as Error).message);
      return this.fallbackReply(userMessage);
    }
  }

  private fallbackReply(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    if (lower.includes("dose") || lower.includes("dosage") || lower.includes("douleur") || lower.includes("symptom")) {
      return "Je ne peux pas modifier vos traitements ni évaluer de nouveaux symptômes. Veuillez consulter immédiatement votre clinicien traitant. [SESSION_CLOSED]";
    }
    if (lower.includes("glucose") || lower.includes("sucre")) {
      return "Le suivi régulier de votre glycémie est essentiel. Continuez vos efforts au quotidien ! En cas d'écart persistant, parlez-en à votre équipe médicale. [SESSION_CLOSED]";
    }
    return "Merci pour votre message. Je suis là pour vous soutenir dans votre suivi du diabète. Pour toute question médicale spécifique, votre équipe soignante reste votre meilleur interlocuteur. [SESSION_CLOSED]";
  }
}
}
