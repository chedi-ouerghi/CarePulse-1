"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlucoseReadingCreateSchema = exports.GlucoseReadingSchema = exports.GlucoseSourceEnum = void 0;
const zod_1 = require("zod");
exports.GlucoseSourceEnum = zod_1.z.enum(["cgm", "manual"]);
exports.GlucoseReadingSchema = zod_1.z.object({
    id: zod_1.z.string(),
    patientId: zod_1.z.string(),
    value: zod_1.z.number().int().min(20).max(600),
    timestamp: zod_1.z.string().datetime(),
    source: exports.GlucoseSourceEnum,
});
exports.GlucoseReadingCreateSchema = zod_1.z.object({
    value: zod_1.z.number().int().min(20).max(600),
    timestamp: zod_1.z.string().datetime(),
    source: exports.GlucoseSourceEnum.default("cgm"),
});
//# sourceMappingURL=glucose.js.map