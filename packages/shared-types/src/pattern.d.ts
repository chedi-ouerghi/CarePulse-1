import { z } from "zod";
export declare const PatternStatusEnum: z.ZodEnum<["new", "acknowledged", "shared_with_clinician"]>;
export type PatternStatus = z.infer<typeof PatternStatusEnum>;
export declare const PatternSchema: z.ZodObject<{
    id: z.ZodString;
    patientId: z.ZodString;
    summary: z.ZodString;
    confidence: z.ZodNumber;
    triggerEventType: z.ZodString;
    detectedAt: z.ZodString;
    status: z.ZodEnum<["new", "acknowledged", "shared_with_clinician"]>;
    supportingDataPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "new" | "acknowledged" | "shared_with_clinician";
    patientId: string;
    summary: string;
    confidence: number;
    triggerEventType: string;
    detectedAt: string;
    supportingDataPoints?: string[] | undefined;
}, {
    id: string;
    status: "new" | "acknowledged" | "shared_with_clinician";
    patientId: string;
    summary: string;
    confidence: number;
    triggerEventType: string;
    detectedAt: string;
    supportingDataPoints?: string[] | undefined;
}>;
export type Pattern = z.infer<typeof PatternSchema>;
export declare const PatternCreateSchema: z.ZodObject<{
    summary: z.ZodString;
    confidence: z.ZodNumber;
    triggerEventType: z.ZodString;
    supportingDataPoints: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    summary: string;
    confidence: number;
    triggerEventType: string;
    supportingDataPoints: string[];
}, {
    summary: string;
    confidence: number;
    triggerEventType: string;
    supportingDataPoints?: string[] | undefined;
}>;
export type PatternCreate = z.infer<typeof PatternCreateSchema>;
