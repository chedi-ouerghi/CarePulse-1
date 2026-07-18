import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ClinicalReportService } from "./clinical-report.service";
import { ClinicalReportController } from "./clinical-report.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ClinicalReportService],
  controllers: [ClinicalReportController],
  exports: [ClinicalReportService],
})
export class ClinicalReportModule {}
