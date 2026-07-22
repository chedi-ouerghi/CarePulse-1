import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IngestionService } from "./ingestion.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "./ingestion.service";
import { CreateGlucoseReadingDto } from "./dto/create-glucose-reading.dto";
import { CreateLifeEventDto } from "./dto/create-life-event.dto";
import { CreateMedicationDto } from "./dto/create-medication.dto";
import { CreateLabResultDto } from "./dto/create-lab-result.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { Role } from "@prisma/client";

@Controller("ingestion")
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngestionController {
  constructor(
    private ingestionService: IngestionService,
    private prisma: PrismaService,
  ) {}

  // ── CSV Upload ────────────────────────────────────────────────────

  @Post("upload/:patientId")
  @UseInterceptors(FileInterceptor("file"))
  async uploadCSV(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query("type") type: string,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");

    if (user.role === Role.PATIENT && user.profileId !== patientId)
      throw new BadRequestException("Cannot upload to another patient's data");

    if (user.role === Role.CLINICIAN) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: { clinicianId: true },
      });
      if (!patient || patient.clinicianId !== user.profileId)
        throw new BadRequestException("Patient not assigned to you");
    }

    const text = file.buffer.toString("utf-8");
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2)
      throw new BadRequestException("CSV must have a header row and at least one data row");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }

    const results: any[] = [];
    const now = new Date();

    for (const row of rows) {
      if (type === "glucose" || (!type && (row["value"] || row["glucose"]))) {
        results.push(
          await this.prisma.glucoseReading.create({
            data: {
              patientId,
              value: parseFloat(row["value"] || row["glucose"] || "0"),
              source: "MANUAL",
              takenAt: row["taken_at"] || row["date"]
                ? new Date(row["taken_at"] || row["date"])
                : now,
            },
          }),
        );
      } else if (type === "life-events" || (!type && row["type"])) {
        const eventType = (row["type"] || "OBSERVATION").toUpperCase();
        const payload: Record<string, unknown> = {};
        if (row["label"]) payload.label = row["label"];
        if (row["details"]) payload.details = row["details"];
        results.push(
          await this.prisma.lifeEvent.create({
            data: {
              patientId,
              type: eventType as any,
              occurredAt: row["occurred_at"] || row["date"]
                ? new Date(row["occurred_at"] || row["date"])
                : now,
              payload: Object.keys(payload).length ? (payload as any) : undefined,
            },
          }),
        );
      } else if (type === "medications" || (!type && row["name"])) {
        results.push(
          await this.prisma.medication.create({
            data: {
              patientId,
              name: row["name"],
              dosage: row["dosage"] || "",
              frequency: row["frequency"] || undefined,
              startDate: row["start_date"]
                ? new Date(row["start_date"])
                : undefined,
            },
          }),
        );
      } else if (type === "lab-results" || (!type && row["test_name"])) {
        results.push(
          await this.prisma.labResult.create({
            data: {
              patientId,
              name: row["test_name"],
              value: parseFloat(row["value"] || "0"),
              unit: row["unit"] || "",
              takenAt: row["taken_at"] || row["date"]
                ? new Date(row["taken_at"] || row["date"])
                : now,
            },
          }),
        );
      }
    }

    return { imported: results.length, type: type || "auto" };
  }

  // ── Glucose ────────────────────────────────────────────────────────

  @Post("glucose")
  createGlucoseReading(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateGlucoseReadingDto,
  ) {
    return this.ingestionService.createGlucoseReading(user, dto);
  }

  @Get("glucose")
  findGlucoseReadings(
    @CurrentUser() user: AuthUser,
    @Query("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ingestionService.findGlucoseReadings(user, patientId, query);
  }

  // ── Life Events ────────────────────────────────────────────────────

  @Post("life-events")
  createLifeEvent(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLifeEventDto,
  ) {
    return this.ingestionService.createLifeEvent(user, dto);
  }

  @Get("life-events")
  findLifeEvents(
    @CurrentUser() user: AuthUser,
    @Query("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ingestionService.findLifeEvents(user, patientId, query);
  }

  // ── Medications ────────────────────────────────────────────────────

  @Post("medications")
  createMedication(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMedicationDto,
  ) {
    return this.ingestionService.createMedication(user, dto);
  }

  @Get("medications")
  findMedications(
    @CurrentUser() user: AuthUser,
    @Query("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ingestionService.findMedications(user, patientId, query);
  }

  // ── Lab Results ────────────────────────────────────────────────────

  @Post("lab-results")
  createLabResult(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLabResultDto,
  ) {
    return this.ingestionService.createLabResult(user, dto);
  }

  @Get("lab-results")
  findLabResults(
    @CurrentUser() user: AuthUser,
    @Query("patientId") patientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ingestionService.findLabResults(user, patientId, query);
  }
}
