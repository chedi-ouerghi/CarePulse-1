"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwinStateSchema = exports.CleanedReadingSchema = exports.DataGapSchema = void 0;
const zod_1 = require("zod");
const glucose_1 = require("./glucose");
exports.DataGapSchema = zod_1.z.object({
    start: zod_1.z.string().datetime(),
    end: zod_1.z.string().datetime(),
    reason: zod_1.z.string(),
});
exports.CleanedReadingSchema = glucose_1.GlucoseReadingSchema.extend({
    isAnomaly: zod_1.z.boolean().optional(),
    anomalyReason: zod_1.z.string().optional(),
});
exports.TwinStateSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    cleanedReadings: zod_1.z.array(exports.CleanedReadingSchema),
    gapsDetected: zod_1.z.array(exports.DataGapSchema),
    dataQualityScore: zod_1.z.number().min(0).max(1),
    stats: zod_1.z.object({
        avgGlucose: zod_1.z.number(),
        timeInRange: zod_1.z.number().min(0).max(1),
        hypoEvents: zod_1.z.number().int(),
        hyperEvents: zod_1.z.number().int(),
        totalReadings: zod_1.z.number().int(),
    }),
    lastUpdated: zod_1.z.string().datetime(),
});
//# sourceMappingURL=twin.js.map