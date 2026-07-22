import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConsentType, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../ingestion/ingestion.service";

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaService) {}

  /** Check if an active consent exists for a patient + type. */
  async hasActiveConsent(
    patientId: string,
    type: ConsentType,
  ): Promise<boolean> {
    const consent = await this.prisma.consent.findFirst({
      where: {
        patientId,
        type,
        revokedAt: null,
      },
    });
    return consent !== null;
  }

  /** Grant (or re-grant) a consent. */
  async grant(user: AuthUser, patientId: string, type: ConsentType) {
    if (user.role !== Role.PATIENT || user.profileId !== patientId) {
      throw new ForbiddenException("Only the patient can grant consent");
    }

    // Check for existing active consent
    const existing = await this.prisma.consent.findFirst({
      where: { patientId, type, revokedAt: null },
    });
    if (existing) return existing;

    // Check for a previously revoked consent and re-grant it
    const revoked = await this.prisma.consent.findFirst({
      where: { patientId, type, revokedAt: { not: null } },
      orderBy: { revokedAt: "desc" },
    });
    if (revoked) {
      return this.prisma.consent.update({
        where: { id: revoked.id },
        data: { grantedAt: new Date(), revokedAt: null },
      });
    }

    return this.prisma.consent.create({
      data: { patientId, type },
    });
  }

  /** Revoke a consent. */
  async revoke(user: AuthUser, patientId: string, type: ConsentType) {
    if (user.role !== Role.PATIENT || user.profileId !== patientId) {
      throw new ForbiddenException("Only the patient can revoke consent");
    }

    const consent = await this.prisma.consent.findFirst({
      where: { patientId, type, revokedAt: null },
    });
    if (!consent) throw new NotFoundException("No active consent found");

    return this.prisma.consent.update({
      where: { id: consent.id },
      data: { revokedAt: new Date() },
    });
  }

  /** List all consents for a patient. */
  async findAll(user: AuthUser, patientId: string) {
    if (user.role === Role.PATIENT && user.profileId !== patientId) {
      throw new ForbiddenException("Cannot view another patient's consents");
    }
    if (user.role === Role.CLINICIAN) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: { clinicianId: true },
      });
      if (!patient) throw new NotFoundException("Patient not found");
      if (patient.clinicianId !== user.profileId) {
        throw new ForbiddenException("Patient not assigned to you");
      }
    }

    return this.prisma.consent.findMany({
      where: { patientId },
      orderBy: { grantedAt: "desc" },
    });
  }
}
