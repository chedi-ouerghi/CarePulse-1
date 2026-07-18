import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LifeEventType } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: string, data: { type: string; timestamp?: string; metadata?: any }) {
    return this.prisma.lifeEvent.create({
      data: {
        patientId,
        type: data.type as LifeEventType,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        metadata: data.metadata || {},
      },
    });
  }
}
