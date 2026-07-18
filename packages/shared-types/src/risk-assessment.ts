import { z } from "zod";

export const RiskAssessmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  hyperglycemiaRisk: z.number().min(0).max(1),
  hypoglycemiaRisk: z.number().min(0).max(1),
  adherenceScore: z.number().min(0).max(1),
  lifestyleScore: z.number().min(0).max(1),
  overallRisk: z.string(),
  details: z.any().nullable().optional(),
  assessedAt: z.string().datetime(),
});

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const AlertSeverityEnum = z.enum(["low", "medium", "high", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

export const AlertStatusEnum = z.enum(["active", "acknowledged", "resolved"]);
export type AlertStatus = z.infer<typeof AlertStatusEnum>;

export const AlertSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  title: z.string(),
  message: z.string(),
  severity: AlertSeverityEnum,
  status: AlertStatusEnum,
  sourceType: z.string(),
  sourceId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable().optional(),
});

export type Alert = z.infer<typeof AlertSchema>;
