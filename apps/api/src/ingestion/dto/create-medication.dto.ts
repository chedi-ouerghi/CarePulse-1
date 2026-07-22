import { IsBoolean, IsDateString, IsOptional, IsString } from "class-validator";

export class CreateMedicationDto {
  @IsString()
  name: string;

  @IsString()
  dosage: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  prescribedBy?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
