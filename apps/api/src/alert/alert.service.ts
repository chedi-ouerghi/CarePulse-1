import { Injectable } from "@nestjs/common";
import { AlertGateway } from "./alert.gateway";

@Injectable()
export class AlertService {
  constructor(private alertGateway: AlertGateway) {}

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
