import { IsOptional, IsString } from "class-validator";

export class SendMessageDto {
  @IsString()
  content!: string;

  @IsString()
  @IsOptional()
  audioUrl?: string;
}
