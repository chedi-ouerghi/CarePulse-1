import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClinicianService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const clinician = await this.prisma.clinician.findUnique({
      where: { userId },
      include: { patients: true },
    });
    if (!clinician) throw new NotFoundException("Clinician not found");
    return clinician;
  }

  async findById(id: string) {
    const clinician = await this.prisma.clinician.findUnique({
      where: { id },
      include: { patients: true },
    });
    if (!clinician) throw new NotFoundException("Clinician not found");
    return clinician;
  }

  async findAll() {
    return this.prisma.clinician.findMany({
      include: { patients: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.findById(id);
    return this.prisma.clinician.update({ where: { id }, data });
  }
}
