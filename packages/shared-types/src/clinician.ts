import { z } from "zod";

export const ClinicianSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  specialty: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

export type Clinician = z.infer<typeof ClinicianSchema>;

export const ClinicianCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  specialty: z.string().optional(),
});

export type ClinicianCreate = z.infer<typeof ClinicianCreateSchema>;

export const ClinicianLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type ClinicianLogin = z.infer<typeof ClinicianLoginSchema>;
