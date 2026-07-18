"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketEventSchema = exports.PaginatedResponseSchema = exports.ApiResponseSchema = void 0;
const zod_1 = require("zod");
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: dataSchema.optional(),
    error: zod_1.z.string().optional(),
});
exports.ApiResponseSchema = ApiResponseSchema;
const PaginatedResponseSchema = (itemSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.array(itemSchema),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
});
exports.PaginatedResponseSchema = PaginatedResponseSchema;
exports.WebSocketEventSchema = zod_1.z.object({
    event: zod_1.z.string(),
    payload: zod_1.z.record(zod_1.z.unknown()),
});
//# sourceMappingURL=api.js.map