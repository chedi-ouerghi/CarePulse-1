import { Module } from "@nestjs/common";
import { AgentOrchestrationService } from "./agent-orchestration.service";
import { AgentOrchestrationController } from "./agent-orchestration.controller";
import { MistralAiModule } from "./mistral-ai/mistral-ai.module";
import { PromptModule } from "./prompts/prompt.module";
import { TwinModule } from "../twin/twin.module";
import { ClinicalAnalysisModule } from "../clinical-analysis/clinical-analysis.module";
import { ClinicalReportModule } from "../clinical-report/clinical-report.module";
import { RiskModule } from "./risk/risk.module";
import { TaskTrackerModule } from "../task-tracker/task-tracker.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, MistralAiModule, PromptModule, TwinModule, ClinicalAnalysisModule, ClinicalReportModule, RiskModule, TaskTrackerModule],
  providers: [AgentOrchestrationService],
  controllers: [AgentOrchestrationController],
  exports: [AgentOrchestrationService],
})
export class AgentOrchestrationModule {}
