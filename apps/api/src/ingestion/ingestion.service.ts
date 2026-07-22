import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGlucoseReadingDto } from "./dto/create-glucose-reading.dto";
import { CreateLifeEventDto } from "./dto/create-life-event.dto";
import { CreateMedicationDto } from "./dto/create-medication.dto";
import { CreateLabResultDto } from "./dto/create-lab-result.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";

export interface AuthUser {
  userId: string;
  role: Role;
  profileId: string;
}

@Injectable()
export class IngestionService {
  constructor(private prisma: PrismaService) {}

  // ── Glucose ────────────────────────────────────────────────────────

  async createGlucoseReading(user: AuthUser, dto: CreateGlucoseReadingDto) {
    const patientId = await this.resolvePatientId(user);
    return this.prisma.glucoseReading.create({
      data: {
        patientId,
        value: dto.value,
        source: dto.source,
        takenAt: new Date(dto.takenAt),
      },
    });
  }

  async findGlucoseReadings(user: AuthUser, patientId: string, query: PaginationQueryDto) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50, from, to } = query;
    const where: Record<string, unknown> = { patientId };
    if (from || to) {
      where.takenAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.glucoseReading.findMany({
        where,
        orderBy: { takenAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.glucoseReading.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  // ── Life Events ────────────────────────────────────────────────────

  async createLifeEvent(user: AuthUser, dto: CreateLifeEventDto) {
    const patientId = await this.resolvePatientId(user);
    return this.prisma.lifeEvent.create({
      data: {
        patientId,
        type: dto.type,
        occurredAt: new Date(dto.occurredAt),
        payload: (dto.payload as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async findLifeEvents(user: AuthUser, patientId: string, query: PaginationQueryDto) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50, from, to } = query;
    const where: Record<string, unknown> = { patientId };
    if (from || to) {
      where.occurredAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.lifeEvent.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lifeEvent.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  // ── Medications ────────────────────────────────────────────────────

  async createMedication(user: AuthUser, dto: CreateMedicationDto) {
    const patientId = await this.resolvePatientId(user);
    return this.prisma.medication.create({
      data: {
        patientId,
        name: dto.name,
        dosage: dto.dosage,
        frequency: dto.frequency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        prescribedBy: dto.prescribedBy,
        active: dto.active ?? true,
      },
    });
  }

  async findMedications(user: AuthUser, patientId: string, query: PaginationQueryDto) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50 } = query;
    const where = { patientId };
    const [data, total] = await Promise.all([
      this.prisma.medication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.medication.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  // ── Lab Results ────────────────────────────────────────────────────

  async createLabResult(user: AuthUser, dto: CreateLabResultDto) {
    const patientId = await this.resolvePatientId(user);
    return this.prisma.labResult.create({
      data: {
        patientId,
        name: dto.name,
        value: dto.value,
        unit: dto.unit,
        takenAt: new Date(dto.takenAt),
      },
    });
  }

  async findLabResults(user: AuthUser, patientId: string, query: PaginationQueryDto) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50, from, to } = query;
    const where: Record<string, unknown> = { patientId };
    if (from || to) {
      where.takenAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.labResult.findMany({
        where,
        orderBy: { takenAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.labResult.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  // ── Authorization helpers ──────────────────────────────────────────

  private async resolvePatientId(user: AuthUser): Promise<string> {
    if (user.role === Role.PATIENT) {
      return user.profileId;
    }
    throw new ForbiddenException("Only patients can create ingestion data");
  }

  private async assertCanRead(user: AuthUser, patientId: string): Promise<void> {
    if (user.role === Role.PATIENT) {
      if (user.profileId !== patientId) {
        throw new ForbiddenException("Cannot read another patient's data");
      }
      return;
    }

    if (user.role === Role.CLINICIAN) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: { clinicianId: true },
      });
      if (!patient) throw new NotFoundException("Patient not found");
      if (patient.clinicianId !== user.profileId) {
        throw new ForbiddenException(
          "Cannot read data of a patient not assigned to you",
        );
      }
      return;
    }

    throw new ForbiddenException("Insufficient permissions");
  }
}
