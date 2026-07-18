import { z } from "zod";

export const LifeEventTypeEnum = z.enum([
  "meal",
  "activity",
  "stress",
  "medication",
  "sleep",
]);
export type LifeEventType = z.infer<typeof LifeEventTypeEnum>;

export const LifeEventSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  type: LifeEventTypeEnum,
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()),
});

export type LifeEvent = z.infer<typeof LifeEventSchema>;

export const LifeEventCreateSchema = z.object({
  type: LifeEventTypeEnum,
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).default({}),
});

export type LifeEventCreate = z.infer<typeof LifeEventCreateSchema>;
