import { z } from "zod";

export const PatternStatusEnum = z.enum([
  "new",
  "acknowledged",
  "shared_with_clinician",
]);
export type PatternStatus = z.infer<typeof PatternStatusEnum>;

export const PatternSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  triggerEventType: z.string(),
  detectedAt: z.string().datetime(),
  status: PatternStatusEnum,
  supportingDataPoints: z.array(z.string()).optional(),
});

export type Pattern = z.infer<typeof PatternSchema>;

export const PatternCreateSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  triggerEventType: z.string(),
  supportingDataPoints: z.array(z.string()).default([]),
});

export type PatternCreate = z.infer<typeof PatternCreateSchema>;
