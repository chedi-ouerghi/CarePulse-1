import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = "connected";
    } catch {
      checks.database = "disconnected";
    }

    try {
      const { default: Redis } = await import("ioredis");
      const redis = new Redis({ host: process.env.REDIS_HOST || "localhost", port: Number(process.env.REDIS_PORT) || 6379, lazyConnect: true });
      await redis.connect();
      await redis.ping();
      checks.redis = "connected";
      await redis.quit();
    } catch {
      checks.redis = "disconnected";
    }

    try {
      const pythonUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
      const res = await fetch(`${pythonUrl}/health`, { signal: AbortSignal.timeout(3000) });
      checks.pythonService = res.ok ? "connected" : "error";
    } catch {
      checks.pythonService = "disconnected";
    }

    const allOk = Object.values(checks).every((s) => s === "connected");
    if (!allOk) {
      throw new ServiceUnavailableException({
        status: "error",
        timestamp: new Date().toISOString(),
        ...checks,
      });
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      ...checks,
    };
  }
}
