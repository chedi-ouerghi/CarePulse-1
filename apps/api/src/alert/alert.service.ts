import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AlertGateway } from "./alert.gateway";

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertGateway: AlertGateway
  ) {}

  async create(
    patientId: string,
    data: {
      title: string;
      message: string;
      severity: "low" | "medium" | "high" | "critical";
      sourceType: string;
      sourceId?: string;
    }
  ) {
    this.logger.log(`Creating alert for patient ${patientId}`);
    return this.prisma.alert.create({
      data: {
        patientId,
        title: data.title,
        message: data.message,
        severity: data.severity,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
      },
    });
  }

  async findActive() {
    return this.prisma.alert.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.alert.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }

  async acknowledge(id: string) {
    this.logger.log(`Acknowledging alert ${id}`);
    return this.prisma.alert.update({
      where: { id },
      data: { status: "acknowledged" },
    });
  }

  async resolve(id: string) {
    this.logger.log(`Resolving alert ${id}`);
    return this.prisma.alert.update({
      where: { id },
      data: { status: "resolved", resolvedAt: new Date() },
    });
  }

  notifyPatternDetected(
    patientId: string,
    pattern: {
      id: string;
      summary: string;
      confidence: number;
      triggerEventType: string;
    }
  ) {
    this.alertGateway.notifyPatient(patientId, "pattern_detected", {
      pattern,
      timestamp: new Date().toISOString(),
    });
  }

  notifyCoachMessage(
    patientId: string,
    message: {
      message: string;
      tone: string;
      suggestedAction: string | null;
    }
  ) {
    this.alertGateway.notifyPatient(patientId, "coach_message", {
      ...message,
      timestamp: new Date().toISOString(),
    });
  }

  notifyBriefGenerated(
    patientId: string,
    clinicianId: string,
    briefId: string
  ) {
    this.alertGateway.notifyPatient(patientId, "brief_generated", {
      briefId,
      clinicianId,
      timestamp: new Date().toISOString(),
    });
  }
}
