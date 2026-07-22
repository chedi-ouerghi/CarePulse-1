import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterPatientDto } from "./dto/register-patient.dto";
import { RegisterClinicianDto } from "./dto/register-clinician.dto";
import { Role } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  role: Role;
  profileId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { patient: true, clinician: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const profileId = user.patient?.id ?? user.clinician?.id;
    if (!profileId) {
      throw new UnauthorizedException("No profile linked to this account");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.signToken({
      sub: user.id,
      role: user.role,
      profileId,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: user.patient?.fullName ?? user.clinician?.fullName,
        email: user.email,
        role: user.role,
        profileId,
      },
    };
  }

  async registerPatient(dto: RegisterPatientDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.PATIENT,
        patient: {
          create: {
            fullName: dto.fullName,
            diabetesType: dto.diabetesType,
          },
        },
      },
      include: { patient: true },
    });

    const token = this.signToken({
      sub: user.id,
      role: user.role,
      profileId: user.patient!.id,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: user.patient!.fullName,
        email: user.email,
        role: user.role,
        profileId: user.patient!.id,
      },
    };
  }

  async registerClinician(dto: RegisterClinicianDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.CLINICIAN,
        clinician: {
          create: {
            fullName: dto.fullName,
            specialty: dto.specialty,
            licenseNumber: dto.licenseNumber,
          },
        },
      },
      include: { clinician: true },
    });

    const token = this.signToken({
      sub: user.id,
      role: user.role,
      profileId: user.clinician!.id,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: user.clinician!.fullName,
        email: user.email,
        role: user.role,
        profileId: user.clinician!.id,
      },
    };
  }

  private signToken(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }
}
