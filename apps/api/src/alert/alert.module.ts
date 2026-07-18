import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { AlertGateway } from "./alert.gateway";
import { AlertService } from "./alert.service";
import { AlertController } from "./alert.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AlertGateway, AlertService],
  controllers: [AlertController],
  exports: [AlertService],
})
export class AlertModule {}
