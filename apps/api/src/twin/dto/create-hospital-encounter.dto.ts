import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateHospitalEncounterDto {
  @IsInt()
  @IsOptional()
  admissionTypeId?: number;

  @IsInt()
  @IsOptional()
  dischargeDispositionId?: number;

  @IsInt()
  @IsOptional()
  admissionSourceId?: number;

  @IsInt()
  @IsOptional()
  timeInHospital?: number;

  @IsInt()
  @IsOptional()
  numLabProcedures?: number;

  @IsInt()
  @IsOptional()
  numProcedures?: number;

  @IsInt()
  @IsOptional()
  numMedications?: number;

  @IsInt()
  @IsOptional()
  numberOutpatient?: number;

  @IsInt()
  @IsOptional()
  numberEmergency?: number;

  @IsInt()
  @IsOptional()
  numberInpatient?: number;

  @IsString()
  @IsOptional()
  diag1?: string;

  @IsString()
  @IsOptional()
  diag2?: string;

  @IsString()
  @IsOptional()
  diag3?: string;

  @IsInt()
  @IsOptional()
  numberDiagnoses?: number;

  @IsString()
  @IsOptional()
  maxGluSerum?: string;

  @IsString()
  @IsOptional()
  a1cResult?: string;

  @IsString()
  @IsOptional()
  changeMade?: string;

  @IsBoolean()
  @IsOptional()
  diabetesMed?: boolean;

  @IsString()
  @IsOptional()
  readmitted?: string;

  @IsOptional()
  medicationStatus?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  admittedAt?: string;

  @IsString()
  @IsOptional()
  dischargedAt?: string;
}
