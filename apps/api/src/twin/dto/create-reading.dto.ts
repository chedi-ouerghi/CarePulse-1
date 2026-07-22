import { IsNumber, IsOptional, IsString, IsArray, Min } from "class-validator";

export class CreateReadingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsString()
  mealType?: string;

  @IsOptional()
  @IsString()
  mealDescription?: string;

  @IsOptional()
  @IsString()
  activityType?: string;

  @IsOptional()
  @IsNumber()
  activityDuration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsString()
  medications?: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
