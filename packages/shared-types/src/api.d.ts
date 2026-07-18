import { z } from "zod";
export declare const ApiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};
export declare const PaginatedResponseSchema: <T extends z.ZodType>(itemSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodArray<T, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: T["_output"][];
    total: number;
    page: number;
    pageSize: number;
}, {
    success: boolean;
    data: T["_input"][];
    total: number;
    page: number;
    pageSize: number;
}>;
export type PaginatedResponse<T> = {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    pageSize: number;
};
export declare const WebSocketEventSchema: z.ZodObject<{
    event: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    event: string;
    payload: Record<string, unknown>;
}, {
    event: string;
    payload: Record<string, unknown>;
}>;
export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;
