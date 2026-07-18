import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  patientId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
