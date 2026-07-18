import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DiabetesType } from "@prisma/client";

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; email: string; diabetesType: DiabetesType; clinicianId?: string }) {
    return this.prisma.patient.create({ data });
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

  async update(id: string, data: { name?: string; email?: string; diabetesType?: DiabetesType }) {
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

  async getState(patientId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const [patient, readings, events, analyses, risks, alerts, medications] = await Promise.all([
      this.findById(patientId),
      this.prisma.glucoseReading.findMany({
        where: { patientId, timestamp: { gte: since } },
        orderBy: { timestamp: "desc" },
        take: 500,
      }),
      this.prisma.lifeEvent.findMany({
        where: { patientId, timestamp: { gte: since } },
        orderBy: { timestamp: "desc" },
        take: 100,
      }),
      this.prisma.clinicalAnalysis.findMany({
        where: { patientId },
        orderBy: { generatedAt: "desc" },
        take: 5,
      }),
      this.prisma.riskAssessment.findMany({
        where: { patientId },
        orderBy: { assessedAt: "desc" },
        take: 3,
      }),
      this.prisma.alert.findMany({
        where: { patientId, status: "active" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.medication.findMany({
        where: { patientId, active: true },
      }),
    ]);

    const values = readings.map((r) => r.value);
    const avgGlucose = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const timeInRange = values.length > 0 ? values.filter((v) => v >= 70 && v <= 180).length / values.length : 0;
    const hypoEvents = values.filter((v) => v < 70).length;
    const hyperEvents = values.filter((v) => v > 180).length;

    return {
      patient,
      stats: { avgGlucose, timeInRange, hypoEvents, hyperEvents, totalReadings: values.length },
      recentReadings: readings.slice(0, 100),
      recentEvents: events.slice(0, 50),
      latestAnalysis: analyses[0] || null,
      latestRisk: risks[0] || null,
      activeAlerts: alerts,
      activeMedications: medications,
    };
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.patient.delete({ where: { id } });
  }
}
