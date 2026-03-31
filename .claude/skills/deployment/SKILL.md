---
name: deployment
description: 'Build, deploy, and configure the Zelaxy platform. Use for: Turborepo pipeline, Vercel deployment, Docker builds, environment variables, Trigger.dev background jobs, cron jobs, Next.js config, Socket.io server deployment.'
---

# Deployment Skill - Zelaxy

## Purpose
Build, deploy, and debug Zelaxy infrastructure using repository-accurate behavior across Next.js app runtime, Socket.IO server, Trigger.dev tasks, cron endpoints, and database migrations.

## Non-Negotiable Rule: Validate Deployment Changes

If you touch deployment scripts, environment wiring, Next.js config, cron routes, Trigger config, or socket runtime:

1. Run the relevant build/type-check commands.
2. Run a targeted runtime smoke check for changed surfaces.
3. Report exact commands and outcomes.
4. If you cannot run verification, explicitly call out what remains unvalidated.

## When to Use
- Configuring build and runtime deployment for `apps/zelaxy` and `apps/docs`
- Setting up environment variables and secrets
- Deploying or debugging Socket.IO service topology
- Configuring Trigger.dev background execution
- Wiring cron jobs and diagnosing scheduler failures
- Handling database migration rollout or connection URL differences

## Deployment Topology (Current)

Zelaxy is not a single process deployment. Treat these as separate runtime units:

1. Main app: Next.js app in `apps/zelaxy`
2. Docs app: separate Next.js app in `apps/docs`
3. Realtime server: separate Socket.IO process in `apps/zelaxy/socket-server/index.ts`
4. Background tasks: Trigger.dev tasks in `apps/zelaxy/background/*`
5. Scheduler: external cron service calling API routes
6. Data services: PostgreSQL (required), optional Redis and cloud object storage

## Source-of-Truth Files

- Monorepo scripts: `package.json`
- Turborepo pipeline: `turbo.json`
- App scripts/config: `apps/zelaxy/package.json`, `apps/zelaxy/next.config.ts`
- Env schema/examples: `apps/zelaxy/lib/env.ts`, `apps/zelaxy/.env.example`
- Trigger config/tasks: `apps/zelaxy/trigger.config.ts`, `apps/zelaxy/background/workflow-execution.ts`, `apps/zelaxy/background/webhook-execution.ts`
- Cron references/routes: `apps/zelaxy/vercel.txt`, `apps/zelaxy/app/api/**/route.ts`
- Socket server runtime: `apps/zelaxy/socket-server/index.ts`, `apps/zelaxy/socket-server/config/socket.ts`
- DB migration config: `apps/zelaxy/drizzle.config.ts`
- Docs app runtime: `apps/docs/package.json`, `apps/docs/next.config.mjs`

## Build and Runtime Commands

From repository root:

```bash
bun install
bun run build
bun run type-check
bun run test
bun run dev:full
```

Key app-level commands:

```bash
# Main app
bun --cwd apps/zelaxy run dev
bun --cwd apps/zelaxy run build
bun --cwd apps/zelaxy run start:prod

# Realtime server (separate process)
bun --cwd apps/zelaxy run dev:sockets

# Docs app (separate process in production too)
bun --cwd apps/docs run build
bun --cwd apps/docs run start
```

## Turborepo Behavior

- `envMode` is `loose`.
- `build` task uses `.env*` as explicit inputs.
- `build` depends on `^build`.
- `dev` is persistent and uncached.
- `test` depends on `^build`.

## Next.js Deployment Behavior (`apps/zelaxy/next.config.ts`)

### Output Mode Switching

- `DOCKER_BUILD=true` -> `output: 'standalone'`
- `CLOUDFLARE_PAGES=true` -> `output: 'export'` plus `trailingSlash=true`
- Default -> regular server output

### Important Side Effect in Docker Mode

When `DOCKER_BUILD=true`, both TypeScript and ESLint build errors are ignored (`ignoreBuildErrors` / `ignoreDuringBuilds`). Always run `bun run type-check` separately before release.

### Routing and Host Behavior

- Hosted-domain redirects only apply when `NEXT_PUBLIC_APP_URL === 'https://www.zelaxy.in'`.
- Docs subdomain proxying is host-based and driven by:
  - `NEXT_PUBLIC_DOCUMENTATION_URL` (public hostname to match)
  - `DOCS_INTERNAL_URL` (internal docs service URL)

### CORS / Header Behavior

- General API CORS headers are applied to `/api/:path*`.
- `/api/workflows/:id/execute` is intentionally more permissive (`Access-Control-Allow-Origin: *`).
- CSP/COEP/COOP policies vary by route groups and must be validated after config changes.

## Socket.IO Deployment Model

Socket server is a separate HTTP server process, not part of `next start`.

- Entrypoint: `apps/zelaxy/socket-server/index.ts`
- Bind host: `0.0.0.0` (default)
- Port resolution: `PORT || SOCKET_PORT || 3002`
- CORS origins derive from `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VERCEL_URL`, and `ALLOWED_ORIGINS`
- Cookie mode uses `sameSite: 'none'` and `secure` in production

Operational implications:

1. `bun run start:prod` only starts Next.js app; socket process must be deployed separately.
2. Set `NEXT_PUBLIC_SOCKET_URL` for clients to the socket service URL.
3. Avoid accidental port conflicts by explicitly setting `SOCKET_PORT` when `PORT` is set by platform defaults.

## Trigger.dev Background Jobs

Trigger config lives in `apps/zelaxy/trigger.config.ts`:

- `runtime: 'node'`
- `maxDuration: 180`
- retries enabled with `maxAttempts: 1`
- task discovery from `dirs: ['./background']`

Defined tasks:

- `workflow-execution`
- `webhook-execution`

Local worker dev command (run from `apps/zelaxy`):

```bash
bunx trigger.dev@latest dev
```

Note: the `increase-memory` build extension sets `NODE_OPTIONS=--max-old-space-size=1024` only for Trigger `dev` target.

## Cron Configuration and Endpoint Semantics

Cron schedules are currently captured in `apps/zelaxy/vercel.txt` (reference file):

- `/api/schedules/execute` -> `*/1 * * * *`
- `/api/webhooks/poll/gmail` -> `*/1 * * * *`
- `/api/webhooks/poll/outlook` -> `*/1 * * * *`
- `/api/logs/cleanup` -> `0 0 * * *`
- `/api/billing/daily` -> `0 2 * * *`

Endpoint behavior that affects scheduler setup:

1. `/api/webhooks/poll/gmail` and `/api/webhooks/poll/outlook`: `GET`, requires `Authorization: Bearer ${CRON_SECRET}`.
2. `/api/logs/cleanup`: `GET`, requires cron auth and S3 log bucket config.
3. `/api/billing/daily`: billing execution is on `POST`; `GET` is health check only.
4. `/api/schedules/execute`: `GET`, currently does not enforce `verifyCronAuth`; protect via network or platform-level controls.

Local development cron simulation runs in `apps/zelaxy/instrumentation-node.ts` and uses `setInterval` plus `CRON_SECRET`.

## Environment Variable Strategy

Primary env contract is in `apps/zelaxy/lib/env.ts` with examples in `apps/zelaxy/.env.example`.

Important behavior:

- `createEnv` uses `skipValidation: true`, so misconfiguration can survive startup and fail at runtime.
- `getEnv()` supports runtime client env via `next-runtime-env`.

Minimum baseline for core app startup:

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `ENCRYPTION_KEY`
- `INTERNAL_API_SECRET`
- `NEXT_PUBLIC_APP_URL`

Deployment-critical groups:

- Cron: `CRON_SECRET`
- Trigger.dev: `TRIGGER_SECRET_KEY`
- Socket: `NEXT_PUBLIC_SOCKET_URL`, optional `SOCKET_SERVER_URL`, `SOCKET_PORT`, `ALLOWED_ORIGINS`
- Docs host routing: `NEXT_PUBLIC_DOCUMENTATION_URL`, `DOCS_INTERNAL_URL`
- DB migrations: `DIRECT_URL` (falls back to `DATABASE_URL` in `drizzle.config.ts`)

## Deployment Playbooks

### 1) Standard Node/Vercel-style Deploy

1. Build from root: `bun run build`
2. Run migrations in app env: `bun --cwd apps/zelaxy run db:migrate`
3. Start app service: `bun run start:prod`
4. Start socket service separately: `bun --cwd apps/zelaxy run dev:sockets` (or equivalent process command)
5. Ensure Trigger.dev worker/project is configured and live
6. Configure cron scheduler for all required endpoints and methods

### 2) Docker-Oriented Build

1. Build with `DOCKER_BUILD=true` to generate standalone output.
2. Do not rely on build success alone; run explicit type-check because build ignores TS/ESLint errors in this mode.
3. Repo currently has no checked-in Dockerfile, so provide your own image/runtime wiring.

### 3) Cloudflare Pages Export Mode

1. Build with `CLOUDFLARE_PAGES=true` to enable static export mode.
2. This mode is static-output oriented and does not cover full server runtime features (API routes, socket server, Trigger-driven execution).

## Database Migration Workflow

From `apps/zelaxy`:

```bash
bunx drizzle-kit generate
bunx drizzle-kit push
bunx drizzle-kit migrate
```

Use `migrate` for production rollouts; prefer controlled migration application before app start.

## Common Deployment Failure Patterns

1. Cron endpoints return `401`: scheduler missing `Authorization: Bearer ${CRON_SECRET}`.
2. Billing cron appears healthy but no charges happen: scheduler calls `GET /api/billing/daily` instead of `POST`.
3. Realtime features fail after deploy: app started but socket server process not deployed.
4. Socket CORS/auth issues: mismatch among `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SOCKET_URL`, and `ALLOWED_ORIGINS`.
5. Build passes in Docker mode but runtime breaks: TS/ESLint errors were ignored due to `DOCKER_BUILD=true`.
6. Docs host routing fails: missing or invalid `NEXT_PUBLIC_DOCUMENTATION_URL` / `DOCS_INTERNAL_URL`.
7. Runtime crashes despite successful boot: env validation skipped (`skipValidation: true`) and critical vars missing.
