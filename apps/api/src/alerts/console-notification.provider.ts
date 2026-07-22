import { Injectable, Logger } from "@nestjs/common";
import {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from "./notification-provider";

/**
 * Default notification provider that logs to console.
 * Replace with real Twilio/WhatsApp Business API integration later.
 */
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  readonly name = "console";
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    this.logger.log(
      `[${payload.channel}] → ${payload.recipientUserId} | ` +
        `${payload.title}: ${payload.message}`,
    );
    return {
      success: true,
      providerMessageId: `console-${Date.now()}`,
    };
  }
}
