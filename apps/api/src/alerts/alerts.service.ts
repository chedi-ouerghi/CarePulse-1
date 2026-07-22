import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  AlertCategory,
  AlertSeverity,
  ConsentType,
  MessageChannel,
  Prisma,
  Role,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../ingestion/ingestion.service";
import { NotificationProvider } from "./notification-provider";
import { ConsentService } from "../consent/consent.service";
import { AlertsGateway } from "./alerts.gateway";

/** Map external channels to required consent types. */
const CHANNEL_CONSENT_MAP: Partial<Record<MessageChannel, ConsentType>> = {
  WHATSAPP: "WHATSAPP_MESSAGING",
  SMS: "SMS_MESSAGING",
  VOICE: "VOICE_MESSAGING",
};

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject("NotificationProvider")
    private notificationProvider: NotificationProvider,
    private consentService: ConsentService,
    private gateway: AlertsGateway,
  ) { }

  // ====================================================================
  // Auto-evaluate a ClinicalRiskAssessment → Alert + Notifications
  // ====================================================================

  async evaluateAndNotify(assessmentId: string): Promise<void> {
    const assessment = await this.prisma.clinicalRiskAssessment.findUnique({
      where: { id: assessmentId },
      include: { patient: { select: { id: true, clinicianId: true } } },
    });
    if (!assessment) {
      this.logger.warn(
        `evaluateAndNotify: assessment ${assessmentId} not found`,
      );
      return;
    }

    if (assessment.overall === "LOW") return;

    const severity = this.mapSeverity(assessment.overall);
    const category: AlertCategory =
      assessment.overall === "HIGH" ? "CLINICAL" : "OPERATIONAL";

    const title = `Risk Level: ${assessment.overall}`;
    const message =
      `Clinical risk assessment detected ${assessment.overall.toLowerCase()} risk. ` +
      `Avg glucose: ${assessment.avgGlucose} mg/dL, ` +
      `time in range: ${(assessment.timeInRange * 100).toFixed(0)}%, ` +
      `hyper events: ${assessment.hyperEvents}, ` +
      `hypo events: ${assessment.hypoEvents}.`;

    const alert = await this.prisma.alert.create({
      data: {
        patientId: assessment.patientId,
        sourceClinicalRiskId: assessmentId,
        category,
        title,
        message,
        severity,
      },
    });

    this.logger.log(
      `Alert created: ${alert.id} [${severity}] for patient ${assessment.patientId}`,
    );

    // Emit WebSocket event to connected clients
    const alertPayload = {
      ...alert,
      patientId: assessment.patientId,
    };

    // Emit to the patient
    this.gateway.emitAlertToPatient(assessment.patientId, alertPayload);

    // Emit to the assigned clinician if one exists
    if (assessment.patient.clinicianId) {
      this.gateway.emitAlertToClinician(
        assessment.patient.clinicianId,
        alertPayload,
      );
    }

    // Notify on all channels the patient has opted into
    const channels = await this.prisma.messagingChannelAccount.findMany({
      where: {
        patientId: assessment.patientId,
        optedIn: true,
      },
      include: { patient: { select: { userId: true } } },
    });

    // Always notify the assigned clinician via APP if one exists
    if (assessment.patient.clinicianId) {
      const clinicianUser = await this.prisma.clinician.findUnique({
        where: { id: assessment.patient.clinicianId },
        select: { userId: true },
      });
      if (clinicianUser) {
        await this.createNotification(
          alert.id,
          MessageChannel.APP,
          clinicianUser.userId,
          title,
          message,
        );
      }
    }

    // Notify on patient's opted-in channels (with consent check)
    for (const ch of channels) {
      // Check consent for external channels
      const requiredConsent = CHANNEL_CONSENT_MAP[ch.channel];
      if (requiredConsent) {
        const hasConsent = await this.consentService.hasActiveConsent(
          assessment.patientId,
          requiredConsent,
        );
        if (!hasConsent) {
          this.logger.warn(
            `Notification blocked: no active ${requiredConsent} consent for patient ${assessment.patientId} on ${ch.channel}`,
          );
          continue;
        }
      }

      await this.createNotification(
        alert.id,
        ch.channel,
        ch.patient.userId,
        title,
        message,
      );
    }
  }

  private mapSeverity(overall: string): AlertSeverity {
    switch (overall) {
      case "HIGH":
        return "HIGH";
      case "MEDIUM":
        return "MEDIUM";
      default:
        return "LOW";
    }
  }

  private async createNotification(
    alertId: string,
    channel: MessageChannel,
    recipientUserId: string,
    title: string,
    message: string,
  ): Promise<void> {
    // Create the notification record first
    const notification = await this.prisma.alertNotification.create({
      data: {
        alertId,
        channel,
        recipientUserId,
        status: "PENDING",
      },
    });

    // Send via provider
    try {
      const result = await this.notificationProvider.send({
        alertId,
        channel,
        recipientUserId,
        title,
        message,
      });

      await this.prisma.alertNotification.update({
        where: { id: notification.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          providerMessageId: result.providerMessageId ?? undefined,
          sentAt: result.success ? new Date() : undefined,
          failReason: result.failReason ?? undefined,
        },
      });
    } catch (err) {
      this.logger.error(
        `Notification failed for ${channel}:${recipientUserId}`,
        (err as Error).message,
      );
      await this.prisma.alertNotification.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          failReason: (err as Error).message,
        },
      });
    }
  }

  // ====================================================================
  // Query (clinician: all, patient: own)
  // ====================================================================

  async findAll(
    user: AuthUser,
    filters?: {
      severity?: AlertSeverity;
      category?: AlertCategory;
      status?: string;
    },
  ) {
    const where: Prisma.AlertWhereInput = {};

    if (user.role === Role.PATIENT) {
      where.patientId = user.profileId;
    }
    // Clinicians see all alerts (no patient filter)

    if (filters?.severity) where.severity = filters.severity;
    if (filters?.category) where.category = filters.category;

    return this.prisma.alert.findMany({
      where,
      orderBy: { triggeredAt: "desc" },
      include: { notifications: true },
    });
  }

  async findByPatient(user: AuthUser, patientId: string) {
    return this.prisma.alert.findMany({
      where: { patientId },
      orderBy: { triggeredAt: "desc" },
      include: { notifications: true },
    });
  }

  async acknowledge(user: AuthUser, alertId: string) {
    if (user.role !== Role.CLINICIAN)
      throw new ForbiddenException("Only clinicians can acknowledge alerts");

    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException("Alert not found");

    return this.prisma.alert.update({
      where: { id: alertId },
      data: {
        acknowledgedByClinicianId: user.profileId,
        acknowledgedAt: new Date(),
      },
    });
  }

  async resolve(user: AuthUser, alertId: string) {
    if (user.role !== Role.CLINICIAN)
      throw new ForbiddenException("Only clinicians can resolve alerts");

    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException("Alert not found");

    return this.prisma.alert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() },
    });
  }
}
