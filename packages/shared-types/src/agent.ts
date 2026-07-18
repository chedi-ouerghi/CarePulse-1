import { z } from "zod";

export const DataStewardOutputSchema = z.object({
  cleanedReadings: z.array(
    z.object({
      id: z.string(),
      value: z.number(),
      timestamp: z.string(),
      source: z.string(),
      isAnomaly: z.boolean(),
      anomalyReason: z.string().optional(),
    })
  ),
  gapsDetected: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      reason: z.string(),
    })
  ),
  dataQualityScore: z.number().min(0).max(1),
});

export type DataStewardOutput = z.infer<typeof DataStewardOutputSchema>;

export const PatternAgentOutputSchema = z.object({
  patterns: z.array(
    z.object({
      summary: z.string(),
      triggerEventType: z.string(),
      confidence: z.number().min(0).max(1),
      supportingDataPoints: z.array(z.string()),
    })
  ),
});

export type PatternAgentOutput = z.infer<typeof PatternAgentOutputSchema>;

export const CoachMessageSchema = z.object({
  message: z.string(),
  tone: z.enum(["supportive", "informative", "gentle_reminder"]),
  suggestedAction: z.string().nullable(),
});

export type CoachMessage = z.infer<typeof CoachMessageSchema>;

export const BriefAgentOutputSchema = z.object({
  headline: z.string(),
  keyPatterns: z.array(
    z.object({
      summary: z.string(),
      confidence: z.number(),
      triggerEventType: z.string(),
    })
  ),
  statsSnapshot: z.object({
    timeInRange: z.number(),
    avgGlucose: z.number(),
    hypoEvents: z.number(),
  }),
  suggestedDiscussionPoints: z.array(z.string()),
});

export type BriefAgentOutput = z.infer<typeof BriefAgentOutputSchema>;

export type AgentName =
  | "data_steward"
  | "pattern_agent"
  | "coach"
  | "care_coordinator";

export interface AgentRunResult<T = unknown> {
  agent: AgentName;
  success: boolean;
  data: T | null;
  error?: string;
  latencyMs: number;
}
