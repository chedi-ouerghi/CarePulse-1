import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role, DiabetesType } from "@prisma/client";

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: { clinician: true },
    });
    if (!patient) throw new NotFoundException("Patient not found");
    return patient;
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: { clinician: { include: { user: true } } },
    });
    if (!patient) throw new NotFoundException("Patient not found");
    return patient;
  }

  async findAll() {
    return this.prisma.patient.findMany({
      include: { clinician: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByClinicianId(clinicianId: string) {
    return this.prisma.patient.findMany({
      where: { clinicianId },
      include: { clinician: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    name: string;
    email: string;
    diabetesType: DiabetesType;
    clinicianId?: string;
  }) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    // Create user with patient profile
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: "", // No password - patient will need to register separately
        role: Role.PATIENT,
        patient: {
          create: {
            fullName: data.name,
            diabetesType: data.diabetesType,
            clinicianId: data.clinicianId,
          },
        },
      },
      include: { patient: true },
    });

    return user.patient;
  }

  async update(id: string, data: Record<string, unknown>) {
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
}
