import { Module } from "@nestjs/common";
import { AgentOrchestrationService } from "./agent-orchestration.service";
import { AgentOrchestrationController } from "./agent-orchestration.controller";
import { TwinModule } from "../twin/twin.module";
import { TasksModule } from "../tasks/tasks.module";

@Module({
  imports: [TwinModule, TasksModule],
  controllers: [AgentOrchestrationController],
  providers: [AgentOrchestrationService],
})
export class AgentOrchestrationModule {}
