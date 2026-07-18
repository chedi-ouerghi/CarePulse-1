import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ClinicalAnalysisService } from "./clinical-analysis.service";
import { ClinicalAnalysisController } from "./clinical-analysis.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ClinicalAnalysisService],
  controllers: [ClinicalAnalysisController],
  exports: [ClinicalAnalysisService],
})
export class ClinicalAnalysisModule {}
