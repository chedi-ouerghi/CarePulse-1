import { Module } from "@nestjs/common";
import { TwinService } from "./twin.service";
import { TwinController } from "./twin.controller";

@Module({
  providers: [TwinService],
  controllers: [TwinController],
  exports: [TwinService],
})
export class TwinModule {}
