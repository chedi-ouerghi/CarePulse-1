import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';

@Module({
  imports: [AuthModule],
  providers: [RagService],
  controllers: [RagController],
  exports: [RagService],
})
export class RagModule { }
