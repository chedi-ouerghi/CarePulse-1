"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeEventCreateSchema = exports.LifeEventSchema = exports.LifeEventTypeEnum = void 0;
const zod_1 = require("zod");
exports.LifeEventTypeEnum = zod_1.z.enum([
    "meal",
    "activity",
    "stress",
    "medication",
    "sleep",
]);
exports.LifeEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    patientId: zod_1.z.string(),
    type: exports.LifeEventTypeEnum,
    timestamp: zod_1.z.string().datetime(),
    metadata: zod_1.z.record(zod_1.z.unknown()),
});
exports.LifeEventCreateSchema = zod_1.z.object({
    type: exports.LifeEventTypeEnum,
    timestamp: zod_1.z.string().datetime(),
    metadata: zod_1.z.record(zod_1.z.unknown()).default({}),
});
//# sourceMappingURL=life-event.js.map