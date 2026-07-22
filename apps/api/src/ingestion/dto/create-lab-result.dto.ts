import { IsDateString, IsNumber, IsString, Min } from "class-validator";

export class CreateLabResultDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsString()
  unit: string;

  @IsDateString()
  takenAt: string;
}
