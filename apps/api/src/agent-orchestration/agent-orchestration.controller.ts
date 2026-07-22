import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AgentOrchestrationService } from "./agent-orchestration.service";
import { TasksService } from "../tasks/tasks.service";
import { QueueService, QUEUES } from "../queue/queue.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../ingestion/ingestion.service";
import { AuditLog } from "../audit/audit.decorator";
import { Role } from "@prisma/client";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentOrchestrationController {
  constructor(
    private agentService: AgentOrchestrationService,
    private tasksService: TasksService,
    private queueService: QueueService,
  ) {}

  // ── Agent 1: trigger clinical intelligence (async) ────────────────

  @Post("agents/analysis/:patientId")
  @Roles(Role.PATIENT, Role.CLINICIAN)
  @AuditLog({ action: "ANALYSIS_TRIGGERED", entityType: "ClinicalAnalysis" })
  async runAnalysis(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    const task = await this.tasksService.create("clinical-analysis", {
      patientId,
      triggeredBy: user.userId,
    });

    await this.queueService.enqueue(QUEUES.CLINICAL_ANALYSIS, task.id, {
      patientId,
    });

    return { taskId: task.id, status: task.status };
  }

  // ── Risk refresh before analysis (async) ──────────────────────────

  @Post("agents/risk/:patientId")
  @Roles(Role.PATIENT, Role.CLINICIAN)
  @AuditLog({ action: "RISK_REFRESH_TRIGGERED", entityType: "ClinicalRiskAssessment" })
  async refreshRiskAndAnalyze(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    // Enqueue risk scoring first
    const riskTask = await this.tasksService.create("risk-scoring", {
      patientId,
      triggeredBy: user.userId,
    });
    await this.queueService.enqueue(QUEUES.RISK_SCORING, riskTask.id, {
      patientId,
    });

    // Then enqueue clinical analysis
    const analysisTask = await this.tasksService.create("clinical-analysis", {
      patientId,
      triggeredBy: user.userId,
      dependsOn: riskTask.id,
    });
    await this.queueService.enqueue(QUEUES.CLINICAL_ANALYSIS, analysisTask.id, {
      patientId,
    });

    return {
      riskTaskId: riskTask.id,
      analysisTaskId: analysisTask.id,
    };
  }

  // ── Agent 2: generate clinical report (async) ─────────────────────

  @Post("agents/report/:clinicalAnalysisId")
  @Roles(Role.CLINICIAN)
  @AuditLog({ action: "REPORT_GENERATION_TRIGGERED", entityType: "ClinicalReport" })
  async generateReport(
    @CurrentUser() user: AuthUser,
    @Param("clinicalAnalysisId") clinicalAnalysisId: string,
  ) {
    const task = await this.tasksService.create("report-generation", {
      clinicalAnalysisId,
      triggeredBy: user.userId,
    });

    await this.queueService.enqueue(QUEUES.REPORT_GENERATION, task.id, {
      clinicalAnalysisId,
      patientId: "", // resolved in worker
    });

    return { taskId: task.id, status: task.status };
  }

  // ── Brief: analysis + report in one call ──────────────────────────

  @Post("agents/brief/:patientId")
  @Roles(Role.PATIENT, Role.CLINICIAN)
  @AuditLog({ action: "BRIEF_TRIGGERED", entityType: "ClinicalReport" })
  async generateBrief(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    await this.agentService.assertCanRead(user, patientId);

    const analysisTask = await this.tasksService.create("clinical-analysis", {
      patientId,
      triggeredBy: user.userId,
    });
    await this.queueService.enqueue(QUEUES.CLINICAL_ANALYSIS, analysisTask.id, {
      patientId,
    });

    const reportTask = await this.tasksService.create("report-generation", {
      patientId,
      triggeredBy: user.userId,
      dependsOn: analysisTask.id,
    });
    await this.queueService.enqueue(QUEUES.REPORT_GENERATION, reportTask.id, {
      clinicalAnalysisId: "",
      patientId,
    });

    return { analysisTaskId: analysisTask.id, reportTaskId: reportTask.id };
  }

  // ── History: ClinicalAnalysis ─────────────────────────────────────

  @Get("analyses/patient/:patientId")
  getAnalyses(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(50), ParseIntPipe)
    pageSize: number,
  ) {
    return this.agentService.getAnalyses(user, patientId, page, pageSize);
  }

  // ── History: ClinicalReport ───────────────────────────────────────

  @Get("reports/patient/:patientId")
  getReports(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(50), ParseIntPipe)
    pageSize: number,
  ) {
    return this.agentService.getReports(user, patientId, page, pageSize);
  }

  // ── Mark report as reviewed ───────────────────────────────────────

  @Patch("reports/:id/review")
  @Roles(Role.CLINICIAN)
  @AuditLog({ action: "REPORT_REVIEWED", entityType: "ClinicalReport" })
  markReviewed(
    @CurrentUser() user: AuthUser,
    @Param("id") reportId: string,
  ) {
    return this.agentService.markReportReviewed(user, reportId);
  }
}
