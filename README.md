# CarePulse

AI-powered diabetes digital twin platform — monorepo powered by TurboRepo.

## Tech Stack

| Package | Stack |
|---------|-------|
| `apps/api` | NestJS 10, TypeScript, Prisma ORM, PostgreSQL, Redis/BullMQ, JWT, WebSocket |
| `apps/web` | Next.js 14 (App Router), React 18, Tailwind CSS, TanStack React Query, Socket.IO |
| `agent/` | Python 3, FastAPI, scikit-learn, pandas |
| `packages/shared-types` | Shared TypeScript interfaces/DTOs |
| `packages/ui` | Reusable UI components |

## Prerequisites

- Node.js >= 20
- npm >= 10
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 16 (or via Docker)
- Redis 7 (or via Docker)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd carepulse
npm install

# 2. Start everything with Docker
docker compose up -d

# 3. Seed the database
npm run db:seed

# 4. Open the app
open http://localhost:3000
```

## Demo Credentials

After seeding, use these credentials (password: `demo1234`):

| Role | Email |
|------|-------|
| Clinician | dr.martin@carepulse.demo |
| Patient 1 | alice.dupont@carepulse.demo (Type 2, controlled) |
| Patient 2 | marcus.chen@carepulse.demo (Type 1, high-risk) |
| Patient 3 | fatima.alrashid@carepulse.demo (Type 2, post-hospital) |

## Services

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3001/api | NestJS backend |
| Web | http://localhost:3000 | Next.js frontend |
| Risk Model | http://localhost:8000 | Python ML microservice |
| Postgres | localhost:5432 | PostgreSQL database |
| Redis | localhost:6379 | Redis cache/queues |

## Available Scripts

```bash
npm run dev          # Start all services in dev mode
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run typecheck    # Type-check all packages
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with demo data
npm run db:reset     # Reset and re-seed database
npm run test:e2e     # Run end-to-end tests
```

## Docker Compose

```bash
# Start everything (recommended)
docker compose up -d

# Start only infrastructure
docker compose up -d postgres redis

# Start with risk model
docker compose up -d postgres redis risk-model

# View logs
docker compose logs -f api
```

## Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "postgres": { "status": "ok", "latencyMs": 2 },
    "redis": { "status": "ok", "latencyMs": 1 },
    "riskModel": { "status": "ok", "latencyMs": 45 }
  }
}
```

## Project Structure

```
carepulse/
├── apps/
│   ├── api/              # NestJS API
│   │   ├── prisma/       # Prisma schema, migrations & seed
│   │   ├── src/          # API source code
│   │   └── test/         # E2E tests
│   └── web/              # Next.js frontend
├── agent/                # Python ML microservice
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   └── ui/               # Shared UI components
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Environment Variables

See [`.env.example`](.env.example) for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `PORT` | No | API port (default: 3001) |
| `MISTRAL_API_KEY` | No | Mistral AI API key |
| `MISTRAL_MODEL` | No | Mistral model name |
| `RISK_MODEL_URL` | No | Risk model service URL |
| `NEXT_PUBLIC_WS_URL` | No | WebSocket URL for frontend |

## Production Deployment

Before deploying to production, review the [Production Checklist](PRODUCTION_CHECKLIST.md) for security, compliance, and operational requirements.
