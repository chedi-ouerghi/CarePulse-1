import { z } from "zod";
import { GlucoseReadingSchema } from "./glucose";

export const DataGapSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  reason: z.string(),
});

export type DataGap = z.infer<typeof DataGapSchema>;

export const CleanedReadingSchema = GlucoseReadingSchema.extend({
  isAnomaly: z.boolean().optional(),
  anomalyReason: z.string().optional(),
});

export type CleanedReading = z.infer<typeof CleanedReadingSchema>;

export const TwinStateSchema = z.object({
  patientId: z.string(),
  cleanedReadings: z.array(CleanedReadingSchema),
  gapsDetected: z.array(DataGapSchema),
  dataQualityScore: z.number().min(0).max(1),
  stats: z.object({
    avgGlucose: z.number(),
    timeInRange: z.number().min(0).max(1),
    hypoEvents: z.number().int(),
    hyperEvents: z.number().int(),
    totalReadings: z.number().int(),
  }),
  lastUpdated: z.string().datetime(),
});

export type TwinState = z.infer<typeof TwinStateSchema>;
