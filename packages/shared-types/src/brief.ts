import { z } from "zod";

export const ReportStatusEnum = z.enum(["draft", "final", "archived"]);
export type ReportStatus = z.infer<typeof ReportStatusEnum>;

export const ReportSummarySchema = z.object({
  headline: z.string(),
  keyFindings: z.array(z.object({
    category: z.string(),
    finding: z.string(),
    severity: z.string().optional(),
  })),
  statsSnapshot: z.object({
    timeInRange: z.number().min(0).max(1),
    avgGlucose: z.number(),
    hypoEvents: z.number().int(),
    hyperEvents: z.number().int(),
  }),
  riskScores: z.object({
    hyperglycemia: z.number(),
    hypoglycemia: z.number(),
    adherence: z.number(),
    lifestyle: z.number(),
  }),
  recommendations: z.array(z.string()),
  clinicalNotes: z.string().optional(),
});

export type ReportSummary = z.infer<typeof ReportSummarySchema>;

export const ClinicalReportSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  clinicianId: z.string(),
  status: ReportStatusEnum,
  summary: ReportSummarySchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  version: z.number().int(),
  signedByAi: z.boolean(),
  generatedAt: z.string().datetime(),
});

export type ClinicalReport = z.infer<typeof ClinicalReportSchema>;

export const ClinicalReportCreateSchema = z.object({
  clinicianId: z.string(),
  summary: ReportSummarySchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export type ClinicalReportCreate = z.infer<typeof ClinicalReportCreateSchema>;
