import { IsEnum, IsDateString, IsOptional, IsObject } from "class-validator";
import { LifeEventType } from "@prisma/client";

export class CreateLifeEventDto {
  @IsEnum(LifeEventType)
  type: LifeEventType;

  @IsDateString()
  occurredAt: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
