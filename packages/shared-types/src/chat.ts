import { z } from "zod";

export const MessageRoleEnum = z.enum(["user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleEnum>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: MessageRoleEnum,
  content: z.string(),
  metadata: z.any().optional(),
  createdAt: z.string().datetime(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  title: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1).max(4000),
});

export type SendMessage = z.infer<typeof SendMessageSchema>;
