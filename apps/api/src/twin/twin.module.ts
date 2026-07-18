import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TwinService } from "./twin.service";
import { TwinController } from "./twin.controller";

@Module({
  imports: [AuthModule],
  providers: [TwinService],
  controllers: [TwinController],
  exports: [TwinService],
})
export class TwinModule { }
