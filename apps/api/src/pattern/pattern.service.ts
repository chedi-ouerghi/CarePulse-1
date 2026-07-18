import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PatternCreate, PatternStatus } from "@carepulse/shared-types";

@Injectable()
export class PatternService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: string, data: PatternCreate) {
    return this.prisma.pattern.create({
      data: {
        patientId,
        summary: data.summary,
        confidence: data.confidence,
        triggerEventType: data.triggerEventType,
        status: "new",
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.pattern.findMany({
      where: { patientId },
      orderBy: { detectedAt: "desc" },
    });
  }

  async findById(id: string) {
    const pattern = await this.prisma.pattern.findUnique({ where: { id } });
    if (!pattern) throw new NotFoundException(`Pattern ${id} not found`);
    return pattern;
  }

  async updateStatus(id: string, status: PatternStatus) {
    await this.findById(id);
    return this.prisma.pattern.update({
      where: { id },
      data: { status },
    });
  }

  async findByPatientAndStatus(patientId: string, status: PatternStatus) {
    return this.prisma.pattern.findMany({
      where: { patientId, status },
      orderBy: { detectedAt: "desc" },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.pattern.delete({ where: { id } });
  }
}
