import { z } from "zod";

export const DiabetesTypeEnum = z.enum(["type1", "type2"]);
export type DiabetesType = z.infer<typeof DiabetesTypeEnum>;

export const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  diabetesType: DiabetesTypeEnum,
  clinicianId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type Patient = z.infer<typeof PatientSchema>;

export const PatientCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  diabetesType: DiabetesTypeEnum,
  clinicianId: z.string().optional(),
});

export type PatientCreate = z.infer<typeof PatientCreateSchema>;

export const PatientLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type PatientLogin = z.infer<typeof PatientLoginSchema>;
