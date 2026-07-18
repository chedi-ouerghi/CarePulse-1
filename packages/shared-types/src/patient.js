"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientCreateSchema = exports.PatientSchema = void 0;
const zod_1 = require("zod");
exports.PatientSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    diabetesType: zod_1.z.enum(["type1", "type2"]),
    clinicianId: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().datetime(),
});
exports.PatientCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    diabetesType: zod_1.z.enum(["type1", "type2"]),
    clinicianId: zod_1.z.string().optional(),
});
//# sourceMappingURL=patient.js.map