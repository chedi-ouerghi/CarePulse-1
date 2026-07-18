import { z } from "zod";
export declare const LifeEventTypeEnum: z.ZodEnum<["meal", "activity", "stress", "medication", "sleep"]>;
export type LifeEventType = z.infer<typeof LifeEventTypeEnum>;
export declare const LifeEventSchema: z.ZodObject<{
    id: z.ZodString;
    patientId: z.ZodString;
    type: z.ZodEnum<["meal", "activity", "stress", "medication", "sleep"]>;
    timestamp: z.ZodString;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "meal" | "activity" | "stress" | "medication" | "sleep";
    patientId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
}, {
    id: string;
    type: "meal" | "activity" | "stress" | "medication" | "sleep";
    patientId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
}>;
export type LifeEvent = z.infer<typeof LifeEventSchema>;
export declare const LifeEventCreateSchema: z.ZodObject<{
    type: z.ZodEnum<["meal", "activity", "stress", "medication", "sleep"]>;
    timestamp: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "meal" | "activity" | "stress" | "medication" | "sleep";
    timestamp: string;
    metadata: Record<string, unknown>;
}, {
    type: "meal" | "activity" | "stress" | "medication" | "sleep";
    timestamp: string;
    metadata?: Record<string, unknown> | undefined;
}>;
export type LifeEventCreate = z.infer<typeof LifeEventCreateSchema>;
