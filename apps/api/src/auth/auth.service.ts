import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

export interface JwtPayload {
  sub: string;
  email: string;
  role: "patient" | "clinician";
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async loginPatient(email: string, password: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { email },
    });
    if (!patient || !patient.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, patient.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const payload: JwtPayload = {
      sub: patient.id,
      email: patient.email,
      role: "patient",
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: patient.id, name: patient.name, email: patient.email, role: "patient" as const },
    };
  }

  async loginClinician(email: string, password: string) {
    const clinician = await this.prisma.clinician.findUnique({
      where: { email },
    });
    if (!clinician || !clinician.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, clinician.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const payload: JwtPayload = {
      sub: clinician.id,
      email: clinician.email,
      role: "clinician",
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: clinician.id, name: clinician.name, email: clinician.email, role: "clinician" as const },
    };
  }

  async registerPatient(data: {
    name: string;
    email: string;
    password: string;
    diabetesType: string;
  }) {
    const existing = await this.prisma.patient.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const patient = await this.prisma.patient.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        diabetesType: data.diabetesType as any,
      },
    });

    const payload: JwtPayload = {
      sub: patient.id,
      email: patient.email,
      role: "patient",
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: patient.id, name: patient.name, email: patient.email, role: "patient" as const },
    };
  }

  async registerClinician(data: {
    name: string;
    email: string;
    password: string;
    specialty?: string;
  }) {
    const existing = await this.prisma.clinician.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const clinician = await this.prisma.clinician.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        specialty: data.specialty,
      },
    });

    const payload: JwtPayload = {
      sub: clinician.id,
      email: clinician.email,
      role: "clinician",
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: clinician.id, name: clinician.name, email: clinician.email, role: "clinician" as const },
    };
  }

  async validateToken(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
