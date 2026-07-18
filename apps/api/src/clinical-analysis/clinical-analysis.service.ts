import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClinicalAnalysisService {
  private readonly logger = new Logger(ClinicalAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(patientId: string, data: {
    periodStart: Date;
    periodEnd: Date;
    patterns: any;
    risks: any;
    recommendations: any;
    observations: any;
    stats: any;
    modelVersion?: string;
  }) {
    this.logger.log(`Creating analysis for patient ${patientId}`);
    return this.prisma.clinicalAnalysis.create({
      data: {
        patientId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        patterns: data.patterns,
        risks: data.risks,
        recommendations: data.recommendations,
        observations: data.observations,
        stats: data.stats,
        modelVersion: data.modelVersion,
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.clinicalAnalysis.findMany({
      where: { patientId },
      orderBy: { generatedAt: "desc" },
    });
  }

  async findLatest(patientId: string) {
    return this.prisma.clinicalAnalysis.findFirst({
      where: { patientId },
      orderBy: { generatedAt: "desc" },
    });
  }

  async findById(id: string) {
    const analysis = await this.prisma.clinicalAnalysis.findUnique({
      where: { id },
    });
    if (!analysis) {
      throw new NotFoundException(`ClinicalAnalysis ${id} not found`);
    }
    return analysis;
  }
}
