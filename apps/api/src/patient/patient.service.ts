import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; email: string; diabetesType: string; clinicianId?: string }) {
    return this.prisma.patient.create({ data: data as any });
  }

  async findAll() {
    return this.prisma.patient.findMany({
      include: { clinician: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: { clinician: true },
    });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  async findByEmail(email: string) {
    return this.prisma.patient.findUnique({ where: { email } });
  }

  async update(id: string, data: { name?: string; email?: string; diabetesType?: string }) {
    await this.findById(id);
    return this.prisma.patient.update({ where: { id }, data });
  }

  async assignClinician(patientId: string, clinicianId: string) {
    await this.findById(patientId);
    return this.prisma.patient.update({
      where: { id: patientId },
      data: { clinicianId },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.patient.delete({ where: { id } });
  }
}
