import { IsEnum, IsOptional, IsString } from "class-validator";
import { MessageChannel } from "@prisma/client";

export class ActivateChannelDto {
  @IsEnum(MessageChannel)
  channel!: MessageChannel;

  @IsString()
  externalId!: string;
}
