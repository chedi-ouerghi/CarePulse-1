import { z } from "zod";

export const ClinicalAnalysisOutputSchema = z.object({
  patterns: z.array(
    z.object({
      summary: z.string(),
      triggerEventType: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
  risks: z.array(
    z.object({
      type: z.string(),
      level: z.string(),
      description: z.string(),
    })
  ),
  recommendations: z.array(z.string()),
  observations: z.array(z.string()),
});

export type ClinicalAnalysisOutput = z.infer<typeof ClinicalAnalysisOutputSchema>;

export const ChatResponseSchema = z.object({
  message: z.string(),
  tone: z.enum(["supportive", "informative", "gentle_reminder"]),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export type AgentName =
  | "clinical_analysis"
  | "care_coordinator"
  | "risk_assessment"
  | "chat";

export interface AgentRunResult<T = unknown> {
  agent: AgentName;
  success: boolean;
  data: T | null;
  error?: string;
  latencyMs: number;
}
