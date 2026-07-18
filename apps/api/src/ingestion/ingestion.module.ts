import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { IngestionService } from "./ingestion.service";
import { IngestionController } from "./ingestion.controller";

@Module({
  imports: [AuthModule],
  providers: [IngestionService],
  controllers: [IngestionController],
  exports: [IngestionService],
})
export class IngestionModule { }
