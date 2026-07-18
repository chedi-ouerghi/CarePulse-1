import { z } from "zod";
export declare const BriefStatsSchema: z.ZodObject<{
    timeInRange: z.ZodNumber;
    avgGlucose: z.ZodNumber;
    hypoEvents: z.ZodNumber;
    hyperEvents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timeInRange: number;
    avgGlucose: number;
    hypoEvents: number;
    hyperEvents: number;
}, {
    timeInRange: number;
    avgGlucose: number;
    hypoEvents: number;
    hyperEvents: number;
}>;
export type BriefStats = z.infer<typeof BriefStatsSchema>;
export declare const BriefContentSchema: z.ZodObject<{
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
        hyperEvents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
        hyperEvents: number;
    }, {
        timeInRange: number;
        avgGlucose: number;
        hypoEvents: number;
        hyperEvents: number;
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
        hyperEvents: number;
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
        hyperEvents: number;
    };
    suggestedDiscussionPoints: string[];
}>;
export type BriefContent = z.infer<typeof BriefContentSchema>;
export declare const BriefSchema: z.ZodObject<{
    id: z.ZodString;
    patientId: z.ZodString;
    clinicianId: z.ZodString;
    content: z.ZodObject<{
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
            hyperEvents: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            timeInRange: number;
            avgGlucose: number;
            hypoEvents: number;
            hyperEvents: number;
        }, {
            timeInRange: number;
            avgGlucose: number;
            hypoEvents: number;
            hyperEvents: number;
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
            hyperEvents: number;
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
            hyperEvents: number;
        };
        suggestedDiscussionPoints: string[];
    }>;
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    generatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    clinicianId: string;
    patientId: string;
    content: {
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
            hyperEvents: number;
        };
        suggestedDiscussionPoints: string[];
    };
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
}, {
    id: string;
    clinicianId: string;
    patientId: string;
    content: {
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
            hyperEvents: number;
        };
        suggestedDiscussionPoints: string[];
    };
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
}>;
export type Brief = z.infer<typeof BriefSchema>;
