import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { AuditInterceptor } from "./audit/audit.interceptor";

/** Simple in-memory rate limiter for auth routes. */
function createRateLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: { ip?: string; headers?: Record<string, string> }, res: { setHeader: (k: string, v: string) => void; status: (c: number) => { json: (o: unknown) => void } }) => {
    const key = req.ip ?? req.headers?.["x-forwarded-for"] ?? "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({
        statusCode: 429,
        message: "Too many requests. Please try again later.",
      });
      return false;
    }

    return true;
  };
}

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    logger.warn(
      "FRONTEND_URL not set — CORS will allow all origins (development only)",
    );
  }
  app.enableCors({
    origin: frontendUrl || true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.setGlobalPrefix("api");

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Audit interceptor (global — only fires on @AuditLog decorated methods)
  app.useGlobalInterceptors(app.get(AuditInterceptor));

  // ── Rate limiting on auth routes ──────────────────────────────────
  const authRateLimit = createRateLimiter(20, 60_000); // 20 req/min
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.use("/api/auth/*", (req: any, res: any, next: () => void) => {
    if (!authRateLimit(req, res)) return;
    next();
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`CarePulse API running on http://localhost:${port}/api`);
}
bootstrap();