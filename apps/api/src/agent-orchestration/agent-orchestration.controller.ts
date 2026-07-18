import { Controller, Post, Param, Query } from "@nestjs/common";
import { AgentOrchestrationService } from "./agent-orchestration.service";

@Controller("agents")
export class AgentOrchestrationController {
  constructor(
    private readonly agentOrchestration: AgentOrchestrationService
  ) {}

  @Post("data-steward/:patientId")
  runDataSteward(@Param("patientId") patientId: string) {
    return this.agentOrchestration.runDataSteward(patientId);
  }

  @Post("pattern/:patientId")
  runPatternAgent(@Param("patientId") patientId: string) {
    return this.agentOrchestration.runPatternAgent(patientId);
  }

  @Post("coach/:patientId")
  runCoachAgent(
    @Param("patientId") patientId: string,
    @Query("patternId") patternId?: string
  ) {
    return this.agentOrchestration.runCoachAgent(patientId, patternId);
  }

  @Post("brief/:patientId")
  runCareCoordinator(
    @Param("patientId") patientId: string,
    @Query("periodDays") periodDays?: string
  ) {
    const days = periodDays ? parseInt(periodDays, 10) : 90;
    return this.agentOrchestration.runCareCoordinatorAgent(patientId, days);
  }
}
