import { Injectable } from "@nestjs/common";
import { AuditActorType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorUserId?: string;
    actorType: AuditActorType;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId ?? undefined,
        actorType: params.actorType,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata
          ? (JSON.parse(JSON.stringify(params.metadata)) as any)
          : undefined,
      },
    });
  }
}
