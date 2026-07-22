import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { DiabetesType } from "@prisma/client";

export class CreatePatientDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(DiabetesType)
  diabetesType: DiabetesType;
}
