import { MessageChannel } from "@prisma/client";

export interface NotificationPayload {
  alertId: string;
  channel: MessageChannel;
  recipientUserId: string;
  title: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  providerMessageId?: string;
  failReason?: string;
}

export interface NotificationProvider {
  readonly name: string;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}
