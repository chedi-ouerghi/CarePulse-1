import { Module, Global } from "@nestjs/common";
import { QueueService } from "./queue.service";

/**
 * Global module providing BullMQ queue access.
 * Redis connection configured via REDIS_URL env var.
 */
@Global()
@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
