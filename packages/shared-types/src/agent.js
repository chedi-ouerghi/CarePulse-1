"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BriefAgentOutputSchema = exports.CoachMessageSchema = exports.PatternAgentOutputSchema = exports.DataStewardOutputSchema = void 0;
const zod_1 = require("zod");
exports.DataStewardOutputSchema = zod_1.z.object({
    cleanedReadings: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        value: zod_1.z.number(),
        timestamp: zod_1.z.string(),
        source: zod_1.z.string(),
        isAnomaly: zod_1.z.boolean(),
        anomalyReason: zod_1.z.string().optional(),
    })),
    gapsDetected: zod_1.z.array(zod_1.z.object({
        start: zod_1.z.string(),
        end: zod_1.z.string(),
        reason: zod_1.z.string(),
    })),
    dataQualityScore: zod_1.z.number().min(0).max(1),
});
exports.PatternAgentOutputSchema = zod_1.z.object({
    patterns: zod_1.z.array(zod_1.z.object({
        summary: zod_1.z.string(),
        triggerEventType: zod_1.z.string(),
        confidence: zod_1.z.number().min(0).max(1),
        supportingDataPoints: zod_1.z.array(zod_1.z.string()),
    })),
});
exports.CoachMessageSchema = zod_1.z.object({
    message: zod_1.z.string(),
    tone: zod_1.z.enum(["supportive", "informative", "gentle_reminder"]),
    suggestedAction: zod_1.z.string().nullable(),
});
exports.BriefAgentOutputSchema = zod_1.z.object({
    headline: zod_1.z.string(),
    keyPatterns: zod_1.z.array(zod_1.z.object({
        summary: zod_1.z.string(),
        confidence: zod_1.z.number(),
        triggerEventType: zod_1.z.string(),
    })),
    statsSnapshot: zod_1.z.object({
        timeInRange: zod_1.z.number(),
        avgGlucose: zod_1.z.number(),
        hypoEvents: zod_1.z.number(),
    }),
    suggestedDiscussionPoints: zod_1.z.array(zod_1.z.string()),
});
//# sourceMappingURL=agent.js.map