import { z } from "zod";

export const ClinicianSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime().optional(),
});

export type Clinician = z.infer<typeof ClinicianSchema>;

export const ClinicianCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type ClinicianCreate = z.infer<typeof ClinicianCreateSchema>;
