import { Controller, Get, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

interface HealthCheckResult {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  services: {
    postgres: { status: "ok" | "error"; latencyMs?: number; error?: string };
    redis: { status: "ok" | "error"; latencyMs?: number; error?: string };
    riskModel: { status: "ok" | "error"; latencyMs?: number; error?: string };
  };
}

@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const [postgres, redis, riskModel] = await Promise.allSettled([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkRiskModel(),
    ]);

    const postgresResult =
      postgres.status === "fulfilled"
        ? postgres.value
        : { status: "error" as const, error: (postgres.reason as Error)?.message };
    const redisResult =
      redis.status === "fulfilled"
        ? redis.value
        : { status: "error" as const, error: (redis.reason as Error)?.message };
    const riskModelResult =
      riskModel.status === "fulfilled"
        ? riskModel.value
        : { status: "error" as const, error: (riskModel.reason as Error)?.message };

    const allOk =
      postgresResult.status === "ok" &&
      redisResult.status === "ok" &&
      riskModelResult.status === "ok";

    const anyError =
      postgresResult.status === "error" ||
      redisResult.status === "error" ||
      riskModelResult.status === "error";

    return {
      status: anyError ? "error" : allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        postgres: postgresResult,
        redis: redisResult,
        riskModel: riskModelResult,
      },
    };
  }

  private async checkPostgres(): Promise<{
    status: "ok" | "error";
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", latencyMs: Date.now() - start };
    } catch (err) {
      return {
        status: "error",
        latencyMs: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }

  private async checkRedis(): Promise<{
    status: "ok" | "error";
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const redisUrl = this.config.get<string>("REDIS_URL", "redis://localhost:6379");
      const { default: IORedis } = await import("ioredis");
      const client = new IORedis(redisUrl, {
        connectTimeout: 3000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
      });
      await client.connect();
      const pong = await client.ping();
      await client.quit();
      return {
        status: pong === "PONG" ? "ok" : "error",
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        status: "error",
        latencyMs: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }

  private async checkRiskModel(): Promise<{
    status: "ok" | "error";
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const riskModelUrl = this.config.get<string>(
        "RISK_MODEL_URL",
        "http://localhost:8000",
      );
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${riskModelUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return {
        status: response.ok ? "ok" : "error",
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        status: "error",
        latencyMs: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }
}
