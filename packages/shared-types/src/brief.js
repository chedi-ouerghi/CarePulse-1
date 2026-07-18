"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BriefSchema = exports.BriefContentSchema = exports.BriefStatsSchema = void 0;
const zod_1 = require("zod");
exports.BriefStatsSchema = zod_1.z.object({
    timeInRange: zod_1.z.number().min(0).max(1),
    avgGlucose: zod_1.z.number(),
    hypoEvents: zod_1.z.number().int(),
    hyperEvents: zod_1.z.number().int(),
});
exports.BriefContentSchema = zod_1.z.object({
    headline: zod_1.z.string(),
    keyPatterns: zod_1.z.array(zod_1.z.object({
        summary: zod_1.z.string(),
        confidence: zod_1.z.number(),
        triggerEventType: zod_1.z.string(),
    })),
    statsSnapshot: exports.BriefStatsSchema,
    suggestedDiscussionPoints: zod_1.z.array(zod_1.z.string()),
});
exports.BriefSchema = zod_1.z.object({
    id: zod_1.z.string(),
    patientId: zod_1.z.string(),
    clinicianId: zod_1.z.string(),
    content: exports.BriefContentSchema,
    periodStart: zod_1.z.string().datetime(),
    periodEnd: zod_1.z.string().datetime(),
    generatedAt: zod_1.z.string().datetime(),
});
//# sourceMappingURL=brief.js.map