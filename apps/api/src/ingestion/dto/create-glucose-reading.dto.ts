import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, Min } from "class-validator";
import { ReadingSource } from "@prisma/client";

export class CreateGlucoseReadingDto {
  @IsNumber()
  @Min(0)
  value: number;

  @IsEnum(ReadingSource)
  source: ReadingSource;

  @IsDateString()
  takenAt: string;
}
