import { z } from "zod";
export declare const GlucoseSourceEnum: z.ZodEnum<["cgm", "manual"]>;
export type GlucoseSource = z.infer<typeof GlucoseSourceEnum>;
export declare const GlucoseReadingSchema: z.ZodObject<{
    id: z.ZodString;
    patientId: z.ZodString;
    value: z.ZodNumber;
    timestamp: z.ZodString;
    source: z.ZodEnum<["cgm", "manual"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    value: number;
    patientId: string;
    timestamp: string;
    source: "cgm" | "manual";
}, {
    id: string;
    value: number;
    patientId: string;
    timestamp: string;
    source: "cgm" | "manual";
}>;
export type GlucoseReading = z.infer<typeof GlucoseReadingSchema>;
export declare const GlucoseReadingCreateSchema: z.ZodObject<{
    value: z.ZodNumber;
    timestamp: z.ZodString;
    source: z.ZodDefault<z.ZodEnum<["cgm", "manual"]>>;
}, "strip", z.ZodTypeAny, {
    value: number;
    timestamp: string;
    source: "cgm" | "manual";
}, {
    value: number;
    timestamp: string;
    source?: "cgm" | "manual" | undefined;
}>;
export type GlucoseReadingCreate = z.infer<typeof GlucoseReadingCreateSchema>;
