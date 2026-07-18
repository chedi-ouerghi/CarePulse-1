"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternCreateSchema = exports.PatternSchema = exports.PatternStatusEnum = void 0;
const zod_1 = require("zod");
exports.PatternStatusEnum = zod_1.z.enum([
    "new",
    "acknowledged",
    "shared_with_clinician",
]);
exports.PatternSchema = zod_1.z.object({
    id: zod_1.z.string(),
    patientId: zod_1.z.string(),
    summary: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
    triggerEventType: zod_1.z.string(),
    detectedAt: zod_1.z.string().datetime(),
    status: exports.PatternStatusEnum,
    supportingDataPoints: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.PatternCreateSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
    triggerEventType: zod_1.z.string(),
    supportingDataPoints: zod_1.z.array(zod_1.z.string()).default([]),
});
//# sourceMappingURL=pattern.js.map