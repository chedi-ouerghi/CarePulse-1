import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskTrackerService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: string, type: string, input?: any) {
    return this.prisma.taskTracker.create({
      data: { patientId, type, input: input || undefined },
    });
  }

  async updateStatus(id: string, status: TaskStatus, output?: any, error?: string) {
    return this.prisma.taskTracker.update({
      where: { id },
      data: {
        status,
        output: output || undefined,
        error: error || undefined,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.taskTracker.findUnique({ where: { id } });
  }

  async findByPatient(patientId: string) {
    return this.prisma.taskTracker.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
