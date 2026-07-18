import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClinicianService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; email: string }) {
    return this.prisma.clinician.create({ data });
  }

  async findAll() {
    return this.prisma.clinician.findMany({
      include: { patients: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const clinician = await this.prisma.clinician.findUnique({
      where: { id },
      include: { patients: true },
    });
    if (!clinician) throw new NotFoundException(`Clinician ${id} not found`);
    return clinician;
  }

  async findByEmail(email: string) {
    return this.prisma.clinician.findUnique({ where: { email } });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.clinician.delete({ where: { id } });
  }
}
