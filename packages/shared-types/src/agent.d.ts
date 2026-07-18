import { z } from "zod";
export declare const DataStewardOutputSchema: z.ZodObject<{
    cleanedReadings: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        value: z.ZodNumber;
        timestamp: z.ZodString;
        source: z.ZodString;
        isAnomaly: z.ZodBoolean;
        anomalyReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        value: number;
        timestamp: string;
        source: string;
        isAnomaly: boolean;
        anomalyReason?: string | undefined;
    }, {
        id: string;
        value: number;
        timestamp: string;
        source: string;
        isAnomaly: boolean;
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
}, "strip", z.ZodTypeAny, {
    cleanedReadings: {
        id: string;
        value: number;
        timestamp: string;
        source: string;
        isAnomaly: boolean;
        anomalyReason?: string | undefined;
    }[];
    gapsDetected: {
        start: string;
        end: string;
        reason: string;
    }[];
    dataQualityScore: number;
}, {
    cleanedReadings: {
        id: string;
        value: number;
        timestamp: string;
        source: string;
        isAnomaly: boolean;
        anomalyReason?: string | undefined;
    }[];
    gapsDetected: {
        start: string;
        end: string;
        reason: string;
    }[];
    dataQualityScore: number;
}>;
export type DataStewardOutput = z.infer<typeof DataStewardOutputSchema>;
export declare const PatternAgentOutputSchema: z.ZodObject<{
    patterns: z.ZodArray<z.ZodObject<{
        summary: z.ZodString;
        triggerEventType: z.ZodString;
        confidence: z.ZodNumber;
        supportingDataPoints: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        confidence: number;
        triggerEventType: string;
        supportingDataPoints: string[];
    }, {
        summary: string;
        confidence: number;
        triggerEventType: string;
        supportingDataPoints: string[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    patterns: {
        summary: string;
        confidence: number;
        triggerEventType: string;
        supportingDataPoints: string[];
    }[];
}, {
    patterns: {
        summary: string;
        confidence: number;
        triggerEventType: string;
        supportingDataPoints: string[];
    }[];
}>;
export type PatternAgentOutput = z.infer<typeof PatternAgentOutputSchema>;
export declare const CoachMessageSchema: z.ZodObject<{
    message: z.ZodString;
    tone: z.ZodEnum<["supportive", "informative", "gentle_reminder"]>;
    suggestedAction: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    tone: "supportive" | "informative" | "gentle_reminder";
    suggestedAction: string | null;
}, {
    message: string;
    tone: "supportive" | "informative" | "gentle_reminder";
    suggestedAction: string | null;
}>;
export type CoachMessage = z.infer<typeof CoachMessageSchema>;
export declare const BriefAgentOutputSchema: z.ZodObject<{
    headline: z.ZodString;
    keyPatterns: z.ZodArray<z.ZodObject<{
        summary: z.ZodString;
        confidence: z.ZodNumber;
        triggerEventType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        confidence: number;
        triggerEventType: string;
    }, {
        summary: string;
        confidence: number;
        triggerEventType: string;
    }>, "many">;
    statsSnapshot: z.ZodObject<{
        timeInRange: z.ZodNumber;
        avgGlucose: z.ZodNumber;
        hypoEvents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
    }, {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
    }>;
    suggestedDiscussionPoints: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    headline: string;
    keyPatterns: {
        summary: string;
        confidence: number;
        triggerEventType: string;
    }[];
    statsSnapshot: {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
    };
    suggestedDiscussionPoints: string[];
}, {
    headline: string;
    keyPatterns: {
        summary: string;
        confidence: number;
        triggerEventType: string;
    }[];
    statsSnapshot: {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
    };
    suggestedDiscussionPoints: string[];
}>;
export type BriefAgentOutput = z.infer<typeof BriefAgentOutputSchema>;
export type AgentName = "data_steward" | "pattern_agent" | "coach" | "care_coordinator";
export interface AgentRunResult<T = unknown> {
    agent: AgentName;
    success: boolean;
    data: T | null;
    error?: string;
    latencyMs: number;
}
