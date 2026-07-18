import { z } from "zod";
export declare const ClinicianSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    email: string;
    createdAt?: string | undefined;
}, {
    id: string;
    name: string;
    email: string;
    createdAt?: string | undefined;
}>;
export type Clinician = z.infer<typeof ClinicianSchema>;
export declare const ClinicianCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
}, {
    name: string;
    email: string;
}>;
export type ClinicianCreate = z.infer<typeof ClinicianCreateSchema>;
