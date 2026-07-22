import { Module } from "@nestjs/common";
import { TwinService } from "./twin.service";
import { TwinController } from "./twin.controller";
import { AlertsModule } from "../alerts/alerts.module";
import { TasksModule } from "../tasks/tasks.module";

@Module({
  imports: [AlertsModule, TasksModule],
  controllers: [TwinController],
  providers: [TwinService],
  exports: [TwinService],
})
export class TwinModule {}
