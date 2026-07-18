import { Controller, Post, Param, Query, Body, Get, UseGuards } from "@nestjs/common";
import { AgentOrchestrationService } from "./agent-orchestration.service";
import { RiskService } from "./risk/risk.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("agents")
export class AgentOrchestrationController {
  constructor(
    private readonly agentOrchestration: AgentOrchestrationService,
    private readonly riskService: RiskService,
  ) { }

  @Post("analysis/:patientId")
  runClinicalAnalysis(
    @Param("patientId") patientId: string,
    @Query("periodDays") periodDays?: string
  ) {
    const days = periodDays ? parseInt(periodDays, 10) : 14;
    return this.agentOrchestration.runClinicalAnalysis(patientId, days);
  }

  @Post("brief/:patientId")
  runCareCoordinator(
    @Param("patientId") patientId: string,
    @Body("clinicianId") clinicianId: string,
    @Query("periodDays") periodDays?: string
  ) {
    const days = periodDays ? parseInt(periodDays, 10) : 90;
    return this.agentOrchestration.runCareCoordinator(patientId, clinicianId, days);
  }

  @Post("risk/:patientId")
  generateRiskAssessment(@Param("patientId") patientId: string) {
    return this.agentOrchestration.generateRiskAssessment(patientId);
  }

  @Post("risk/predict")
  async predictRisk(
    @Body()
    body: {
      pregnancies: number;
      glucose: number;
      bloodPressure: number;
      skinThickness: number;
      insulin: number;
      bmi: number;
      diabetesPedigreeFunction: number;
      age: number;
    }
  ) {
    return this.riskService.predict(body);
  }

  @Post("risk/batch")
  async batchPredictRisk(
    @Body()
    body: {
      patients: Array<{
        pregnancies: number;
        glucose: number;
        bloodPressure: number;
        skinThickness: number;
        insulin: number;
        bmi: number;
        diabetesPedigreeFunction: number;
        age: number;
      }>;
    }
  ) {
    return this.riskService.batchPredict(body.patients);
  }

  @Get("risk/health")
  async riskHealth() {
    const healthy = await this.riskService.healthCheck();
    return {
      status: healthy ? "ok" : "unavailable",
      model: healthy ? "loaded" : "not_loaded",
    };
  }

  @Post("doctor/readmission/predict")
  async predictDoctorReadmission(@Body() body: Record<string, unknown>) {
    return this.riskService.predictReadmission(body);
  }

  @Post("doctor/readmission/batch")
  async batchPredictDoctorReadmission(@Body() body: { patients: Record<string, unknown>[] }) {
    return this.riskService.batchPredictReadmission(body.patients);
  }
}
