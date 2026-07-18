import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BriefContent } from "@carepulse/shared-types";

@Injectable()
export class BriefService {
  constructor(private prisma: PrismaService) {}

  async create(
    patientId: string,
    clinicianId: string,
    content: BriefContent,
    periodStart: Date,
    periodEnd: Date
  ) {
    return this.prisma.brief.create({
      data: {
        patientId,
        clinicianId,
        content: content as any,
        periodStart,
        periodEnd,
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.brief.findMany({
      where: { patientId },
      orderBy: { generatedAt: "desc" },
    });
  }

  async findById(id: string) {
    const brief = await this.prisma.brief.findUnique({ where: { id } });
    if (!brief) throw new NotFoundException(`Brief ${id} not found`);
    return brief;
  }

  async findLatestForPatient(patientId: string) {
    const brief = await this.prisma.brief.findFirst({
      where: { patientId },
      orderBy: { generatedAt: "desc" },
    });
    return brief;
  }
}
