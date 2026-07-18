import { z } from "zod";

export const BriefStatsSchema = z.object({
  timeInRange: z.number().min(0).max(1),
  avgGlucose: z.number(),
  hypoEvents: z.number().int(),
  hyperEvents: z.number().int(),
});

export type BriefStats = z.infer<typeof BriefStatsSchema>;

export const BriefContentSchema = z.object({
  headline: z.string(),
  keyPatterns: z.array(
    z.object({
      summary: z.string(),
      confidence: z.number(),
      triggerEventType: z.string(),
    })
  ),
  statsSnapshot: BriefStatsSchema,
  suggestedDiscussionPoints: z.array(z.string()),
});

export type BriefContent = z.infer<typeof BriefContentSchema>;

export const BriefSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  clinicianId: z.string(),
  content: BriefContentSchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  generatedAt: z.string().datetime(),
});

export type Brief = z.infer<typeof BriefSchema>;
