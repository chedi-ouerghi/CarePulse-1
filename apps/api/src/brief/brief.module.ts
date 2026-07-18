import { Module } from "@nestjs/common";
import { BriefService } from "./brief.service";
import { BriefController } from "./brief.controller";

@Module({
  providers: [BriefService],
  controllers: [BriefController],
  exports: [BriefService],
})
export class BriefModule {}
