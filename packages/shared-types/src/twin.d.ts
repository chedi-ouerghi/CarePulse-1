import { z } from "zod";
export declare const DataGapSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    start: string;
    end: string;
    reason: string;
}, {
    start: string;
    end: string;
    reason: string;
}>;
export type DataGap = z.infer<typeof DataGapSchema>;
export declare const CleanedReadingSchema: z.ZodObject<{
    id: z.ZodString;
    patientId: z.ZodString;
    value: z.ZodNumber;
    timestamp: z.ZodString;
    source: z.ZodEnum<["cgm", "manual"]>;
} & {
    isAnomaly: z.ZodOptional<z.ZodBoolean>;
    anomalyReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    value: number;
    patientId: string;
    timestamp: string;
    source: "cgm" | "manual";
    isAnomaly?: boolean | undefined;
    anomalyReason?: string | undefined;
}, {
    id: string;
    value: number;
    patientId: string;
    timestamp: string;
    source: "cgm" | "manual";
    isAnomaly?: boolean | undefined;
    anomalyReason?: string | undefined;
}>;
export type CleanedReading = z.infer<typeof CleanedReadingSchema>;
export declare const TwinStateSchema: z.ZodObject<{
    patientId: z.ZodString;
    cleanedReadings: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        patientId: z.ZodString;
        value: z.ZodNumber;
        timestamp: z.ZodString;
        source: z.ZodEnum<["cgm", "manual"]>;
    } & {
        isAnomaly: z.ZodOptional<z.ZodBoolean>;
        anomalyReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        value: number;
        patientId: string;
        timestamp: string;
        source: "cgm" | "manual";
        isAnomaly?: boolean | undefined;
        anomalyReason?: string | undefined;
    }, {
        id: string;
        value: number;
        patientId: string;
        timestamp: string;
        source: "cgm" | "manual";
        isAnomaly?: boolean | undefined;
        anomalyReason?: string | undefined;
    }>, "many">;
    gapsDetected: z.ZodArray<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
        reason: string;
    }, {
        start: string;
        end: string;
        reason: string;
    }>, "many">;
    dataQualityScore: z.ZodNumber;
    stats: z.ZodObject<{
        avgGlucose: z.ZodNumber;
        timeInRange: z.ZodNumber;
        hypoEvents: z.ZodNumber;
        hyperEvents: z.ZodNumber;
        totalReadings: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
        hyperEvents: number;
        totalReadings: number;
    }, {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
        hyperEvents: number;
        totalReadings: number;
    }>;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    cleanedReadings: {
        id: string;
        value: number;
        patientId: string;
        timestamp: string;
        source: "cgm" | "manual";
        isAnomaly?: boolean | undefined;
        anomalyReason?: string | undefined;
    }[];
    gapsDetected: {
        start: string;
        end: string;
        reason: string;
    }[];
    dataQualityScore: number;
    stats: {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
        hyperEvents: number;
        totalReadings: number;
    };
    lastUpdated: string;
}, {
    patientId: string;
    cleanedReadings: {
        id: string;
        value: number;
        patientId: string;
        timestamp: string;
        source: "cgm" | "manual";
        isAnomaly?: boolean | undefined;
        anomalyReason?: string | undefined;
    }[];
    gapsDetected: {
        start: string;
        end: string;
        reason: string;
    }[];
    dataQualityScore: number;
    stats: {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
        hyperEvents: number;
        totalReadings: number;
    };
    lastUpdated: string;
}>;
export type TwinState = z.infer<typeof TwinStateSchema>;
