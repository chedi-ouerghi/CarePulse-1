import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { PatientModule } from "./patient/patient.module";
import { ClinicianModule } from "./clinician/clinician.module";
import { IngestionModule } from "./ingestion/ingestion.module";
import { TwinModule } from "./twin/twin.module";
import { AgentOrchestrationModule } from "./agent-orchestration/agent-orchestration.module";
import { AlertsModule } from "./alerts/alerts.module";
import { ChatModule } from "./chat/chat.module";
import { QueueModule } from "./queue/queue.module";
import { TasksModule } from "./tasks/tasks.module";
import { AuditModule } from "./audit/audit.module";
import { ConsentModule } from "./consent/consent.module";
import { QueueService } from "./queue/queue.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    PatientModule,
    ClinicianModule,
    IngestionModule,
    TwinModule,
    AgentOrchestrationModule,
    AlertsModule,
    ChatModule,
    QueueModule,
    TasksModule,
    AuditModule,
    ConsentModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private queueService: QueueService) {}

  onModuleInit() {
    this.queueService.startWorkers();
  }
}
