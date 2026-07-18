import { z } from "zod";

export const GlucoseSourceEnum = z.enum(["cgm", "manual"]);
export type GlucoseSource = z.infer<typeof GlucoseSourceEnum>;

export const GlucoseReadingSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  value: z.number().int().min(20).max(600),
  timestamp: z.string().datetime(),
  source: GlucoseSourceEnum,
});

export type GlucoseReading = z.infer<typeof GlucoseReadingSchema>;

export const GlucoseReadingCreateSchema = z.object({
  value: z.number().int().min(20).max(600),
  timestamp: z.string().datetime(),
  source: GlucoseSourceEnum.default("cgm"),
});

export type GlucoseReadingCreate = z.infer<typeof GlucoseReadingCreateSchema>;
