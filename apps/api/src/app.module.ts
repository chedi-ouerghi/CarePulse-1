import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { PatientModule } from "./patient/patient.module";
import { ClinicianModule } from "./clinician/clinician.module";
import { IngestionModule } from "./ingestion/ingestion.module";
import { TwinModule } from "./twin/twin.module";
import { AgentOrchestrationModule } from "./agent-orchestration/agent-orchestration.module";
import { PatternModule } from "./pattern/pattern.module";
import { BriefModule } from "./brief/brief.module";
import { AlertModule } from "./alert/alert.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PatientModule,
    ClinicianModule,
    IngestionModule,
    TwinModule,
    AgentOrchestrationModule,
    PatternModule,
    BriefModule,
    AlertModule,
    HealthModule,
  ],
})
export class AppModule {}
