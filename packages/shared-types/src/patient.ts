import { z } from "zod";

export const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  diabetesType: z.enum(["type1", "type2"]),
  clinicianId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type Patient = z.infer<typeof PatientSchema>;

export const PatientCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  diabetesType: z.enum(["type1", "type2"]),
  clinicianId: z.string().optional(),
});

export type PatientCreate = z.infer<typeof PatientCreateSchema>;
