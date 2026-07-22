import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { DiabetesType } from "@prisma/client";

export class RegisterPatientDto {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(DiabetesType)
  diabetesType: DiabetesType;
}
