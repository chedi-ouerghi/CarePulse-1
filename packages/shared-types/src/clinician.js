"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicianCreateSchema = exports.ClinicianSchema = void 0;
const zod_1 = require("zod");
exports.ClinicianSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    createdAt: zod_1.z.string().datetime().optional(),
});
exports.ClinicianCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
});
//# sourceMappingURL=clinician.js.map