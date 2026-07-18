import { z } from "zod";
export declare const PatientSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    diabetesType: z.ZodEnum<["type1", "type2"]>;
    clinicianId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    email: string;
    diabetesType: "type1" | "type2";
    createdAt: string;
    clinicianId?: string | null | undefined;
}, {
    id: string;
    name: string;
    email: string;
    diabetesType: "type1" | "type2";
    createdAt: string;
    clinicianId?: string | null | undefined;
}>;
export type Patient = z.infer<typeof PatientSchema>;
export declare const PatientCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    diabetesType: z.ZodEnum<["type1", "type2"]>;
    clinicianId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    diabetesType: "type1" | "type2";
    clinicianId?: string | undefined;
}, {
    name: string;
    email: string;
    diabetesType: "type1" | "type2";
    clinicianId?: string | undefined;
}>;
export type PatientCreate = z.infer<typeof PatientCreateSchema>;
