import { z } from "zod";

export const UserRoleEnum = z.enum(["patient", "clinician"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleEnum,
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  user: AuthUserSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterPatientRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  diabetesType: z.enum(["type1", "type2"]),
});

export type RegisterPatientRequest = z.infer<typeof RegisterPatientRequestSchema>;

export const RegisterClinicianRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  specialty: z.string().optional(),
});

export type RegisterClinicianRequest = z.infer<typeof RegisterClinicianRequestSchema>;
