import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GlucoseService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: string, data: { value: number; timestamp?: string; source?: string }) {
    return this.prisma.glucoseReading.create({
      data: {
        patientId,
        value: data.value,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        source: (data.source as any) || 'manual',
      },
    });
  }

  async createMany(patientId: string, readings: Array<{ value: number; timestamp: string; source?: string }>) {
    return this.prisma.glucoseReading.createMany({
      data: readings.map(r => ({
        patientId,
        value: r.value,
        timestamp: new Date(r.timestamp),
        source: (r.source as any) || 'cgm',
      })),
    });
  }
}
