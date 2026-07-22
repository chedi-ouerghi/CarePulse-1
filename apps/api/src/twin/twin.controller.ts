import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { TwinService } from "./twin.service";
import { TasksService } from "../tasks/tasks.service";
import { QueueService, QUEUES } from "../queue/queue.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../ingestion/ingestion.service";
import { CreateHospitalEncounterDto } from "./dto/create-hospital-encounter.dto";
import { CreateReadingDto } from "./dto/create-reading.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { Role } from "@prisma/client";

@Controller("twin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TwinController {
  constructor(
    private twinService: TwinService,
    private tasksService: TasksService,
    private queueService: QueueService,
  ) {}

  // ── Twin snapshot ────────────────────────────────────────────────

  @Get("me")
  getMySnapshot(@CurrentUser() user: AuthUser) {
    return this.twinService.getLatestSnapshot(user);
  }

  // ── Record a reading (glucose + lifestyle) ───────────────────────

  @Post("reading/:patientId")
  recordReading(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Body() dto: CreateReadingDto,
  ) {
    return this.twinService.recordReading(user, patientId, dto);
  }

  @Get(":patientId")
  @Roles(Role.PATIENT, Role.CLINICIAN)
  getPatientSnapshot(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    return this.twinService.getLatestSnapshot(user, patientId);
  }

  // ── Full refresh (async via queue) ────────────────────────────────

  @Post(":patientId/refresh")
  async refreshPatient(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    const task = await this.tasksService.create("risk-scoring", {
      patientId,
      triggeredBy: user.userId,
    });

    await this.queueService.enqueue(QUEUES.RISK_SCORING, task.id, {
      patientId,
    });

    return { taskId: task.id, status: task.status };
  }

  // ── Clinical risk assessments ────────────────────────────────────

  @Get("clinical-risk-assessments/:patientId")
  getClinicalRiskAssessments(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.twinService.getClinicalRiskAssessments(
      user,
      patientId,
      query,
    );
  }

  // ── Diabetes risk scores ─────────────────────────────────────────

  @Get("diabetes-risk-scores/:patientId")
  getDiabetesRiskScores(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.twinService.getDiabetesRiskScores(user, patientId, query);
  }

  // ── Hospital encounters ──────────────────────────────────────────

  @Post("hospital-encounters/:patientId")
  createHospitalEncounter(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Body() dto: CreateHospitalEncounterDto,
  ) {
    return this.twinService.createHospitalEncounter(user, patientId, dto);
  }

  @Get("hospital-encounters/:patientId")
  getHospitalEncounters(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.twinService.getHospitalEncounters(user, patientId, query);
  }

  // ── Readmission risk scores ──────────────────────────────────────

  @Post("readmission-score/:encounterId")
  scoreReadmission(
    @CurrentUser() user: AuthUser,
    @Param("encounterId") encounterId: string,
  ) {
    return this.twinService.callReadmissionScoring(encounterId);
  }

  @Get("readmission-risk-scores/:patientId")
  getReadmissionRiskScores(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.twinService.getReadmissionRiskScores(user, patientId, query);
  }
}
