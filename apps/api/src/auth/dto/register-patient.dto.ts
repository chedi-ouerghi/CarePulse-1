import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class RegisterPatientDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['type1', 'type2'])
  diabetesType: string;
}
