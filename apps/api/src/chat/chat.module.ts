import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { MistralAiModule } from "../agent-orchestration/mistral-ai/mistral-ai.module";
import { PromptModule } from "../agent-orchestration/prompts/prompt.module";
import { TwinModule } from "../twin/twin.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, MistralAiModule, PromptModule, TwinModule, AuthModule],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
