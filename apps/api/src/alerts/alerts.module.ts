import { Module } from "@nestjs/common";
import { AlertsService } from "./alerts.service";
import { AlertsController } from "./alerts.controller";
import { AlertsGateway } from "./alerts.gateway";
import { ConsoleNotificationProvider } from "./console-notification.provider";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { ConsentModule } from "../consent/consent.module";

@Module({
  imports: [
    PrismaModule,
    ConsentModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET", "carepulse-dev-secret"),
        signOptions: { expiresIn: "24h" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertsGateway,
    {
      provide: "NotificationProvider",
      useClass: ConsoleNotificationProvider,
    },
  ],
  exports: [AlertsService, AlertsGateway],
})
export class AlertsModule { }
