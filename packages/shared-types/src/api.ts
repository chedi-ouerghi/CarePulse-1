import { z } from "zod";

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const PaginatedResponseSchema = <T extends z.ZodType>(
  itemSchema: T
) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const WebSocketEventSchema = z.object({
  event: z.string(),
  payload: z.record(z.unknown()),
});

export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;
