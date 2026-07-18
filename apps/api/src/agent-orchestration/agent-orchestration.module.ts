import { Module } from "@nestjs/common";
import { AgentOrchestrationService } from "./agent-orchestration.service";
import { AgentOrchestrationController } from "./agent-orchestration.controller";
import { AnthropicModule } from "./anthropic/anthropic.module";
import { PromptModule } from "./prompts/prompt.module";
import { TwinModule } from "../twin/twin.module";
import { PatternModule } from "../pattern/pattern.module";

@Module({
  imports: [AnthropicModule, PromptModule, TwinModule, PatternModule],
  providers: [AgentOrchestrationService],
  controllers: [AgentOrchestrationController],
  exports: [AgentOrchestrationService],
})
export class AgentOrchestrationModule {}
