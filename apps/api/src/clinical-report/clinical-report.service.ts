import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClinicalReportService {
  private readonly logger = new Logger(ClinicalReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(patientId: string, data: {
    clinicianId: string;
    summary: any;
    periodStart: Date;
    periodEnd: Date;
    signedByAi?: boolean;
  }) {
    this.logger.log(`Creating report for patient ${patientId}`);
    return this.prisma.clinicalReport.create({
      data: {
        patientId,
        clinicianId: data.clinicianId,
        summary: data.summary,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        signedByAi: data.signedByAi ?? false,
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.clinicalReport.findMany({
      where: { patientId },
      orderBy: { generatedAt: "desc" },
    });
  }

  async findByClinician(clinicianId: string) {
    return this.prisma.clinicalReport.findMany({
      where: { clinicianId },
      orderBy: { generatedAt: "desc" },
    });
  }

  async findById(id: string) {
    const report = await this.prisma.clinicalReport.findUnique({
      where: { id },
    });
    if (!report) {
      throw new NotFoundException(`ClinicalReport ${id} not found`);
    }
    return report;
  }

  async findLatestForPatient(patientId: string) {
    return this.prisma.clinicalReport.findFirst({
      where: { patientId },
      orderBy: { generatedAt: "desc" },
    });
  }
}
