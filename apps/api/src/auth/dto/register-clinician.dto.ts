import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterClinicianDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  specialty?: string;
}
