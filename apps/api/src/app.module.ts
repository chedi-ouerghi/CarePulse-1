import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { PatientModule } from "./patient/patient.module";
import { ClinicianModule } from "./clinician/clinician.module";
import { IngestionModule } from "./ingestion/ingestion.module";
import { TwinModule } from "./twin/twin.module";
import { AgentOrchestrationModule } from "./agent-orchestration/agent-orchestration.module";
import { ClinicalAnalysisModule } from "./clinical-analysis/clinical-analysis.module";
import { ClinicalReportModule } from "./clinical-report/clinical-report.module";
import { AlertModule } from "./alert/alert.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { ChatModule } from "./chat/chat.module";
import { GlucoseModule } from "./glucose/glucose.module";
import { EventsModule } from "./events/events.module";
import { TaskTrackerModule } from "./task-tracker/task-tracker.module";
import { RagModule } from "./rag/rag.module";
import { QueueModule } from "./queue/queue.module";

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
    ClinicalAnalysisModule,
    ClinicalReportModule,
    AlertModule,
    HealthModule,
    ChatModule,
    GlucoseModule,
    EventsModule,
    TaskTrackerModule,
    RagModule,
    QueueModule,
  ],
})
export class AppModule {}
