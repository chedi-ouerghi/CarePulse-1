import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(taskType: string, payload: unknown) {
    return this.prisma.taskTracker.create({
      data: {
        taskType,
        status: "PENDING",
        payload: payload as any,
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.taskTracker.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }
}
