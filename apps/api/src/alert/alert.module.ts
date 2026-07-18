import { Module } from "@nestjs/common";
import { AlertGateway } from "./alert.gateway";
import { AlertService } from "./alert.service";

@Module({
  providers: [AlertGateway, AlertService],
  exports: [AlertService],
})
export class AlertModule {}
