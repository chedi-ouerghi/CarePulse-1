import { Module } from '@nestjs/common';
import { TaskTrackerService } from './task-tracker.service';

@Module({
  providers: [TaskTrackerService],
  exports: [TaskTrackerService],
})
export class TaskTrackerModule {}
