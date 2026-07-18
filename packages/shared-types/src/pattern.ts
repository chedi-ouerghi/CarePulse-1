import { z } from "zod";

export const AnalysisStatusEnum = z.enum(["pending", "completed", "failed"]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusEnum>;

export const ClinicalAnalysisSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  status: AnalysisStatusEnum,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  patterns: z.array(z.any()),
  risks: z.array(z.any()),
  recommendations: z.array(z.any()),
  observations: z.array(z.any()),
  stats: z.any(),
  modelVersion: z.string().nullable().optional(),
  generatedAt: z.string().datetime(),
});

export type ClinicalAnalysis = z.infer<typeof ClinicalAnalysisSchema>;

export const ClinicalAnalysisCreateSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  patterns: z.array(z.any()),
  risks: z.array(z.any()),
  recommendations: z.array(z.any()),
  observations: z.array(z.any()),
  stats: z.any(),
  modelVersion: z.string().optional(),
});

export type ClinicalAnalysisCreate = z.infer<typeof ClinicalAnalysisCreateSchema>;
