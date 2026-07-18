import { Module } from '@nestjs/common';
import { GlucoseService } from './glucose.service';
import { GlucoseController } from './glucose.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [GlucoseService],
  controllers: [GlucoseController],
  exports: [GlucoseService],
})
export class GlucoseModule {}
