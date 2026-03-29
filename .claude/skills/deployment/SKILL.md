---
name: deployment
description: 'Build, deploy, and configure the Zelaxy platform. Use for: Turborepo pipeline, Vercel deployment, Docker builds, environment variables, Trigger.dev background jobs, cron jobs, Next.js config, Socket.io server deployment.'
---

# Deployment & Infrastructure Skill — Zelaxy

## Purpose
Build, deploy, and configure the Zelaxy platform.

## When to Use
- Building the project
- Deploying to Vercel or Docker
- Configuring environment variables
- Managing background jobs (Trigger.dev)
- Setting up cron jobs
- Debugging deployment issues

## Build Pipeline (Turborepo)

```bash
# Build all apps
bun run build

# Dev all apps
bun run dev

# Specific tasks
bun run test
bun run lint
bun run format
bun run format:check
bun run type-check
```

### Turbo Pipeline Config
| Task | Depends On | Cached | Outputs |
|------|-----------|--------|---------|
| `build` | `^build` | Yes | `.next/**`, `dist/**` |
| `dev` | — | No (persistent) | — |
| `test` | `^build` | Yes | — |
| `lint` | — | Yes | — |
| `type-check` | — | Yes | — |

- Uses `envMode: "loose"` — env vars from `.env*` files are inputs to `build`

## Next.js Deployment Config

### Output Modes
| Mode | When | Config |
|------|------|--------|
| `standalone` | Docker builds | `DOCKER_BUILD=true` |
| `export` | Cloudflare Pages | `CLOUDFLARE_PAGES=true` |
| (default) | Vercel | No env var needed |

### Server External Packages
```
sharp, tesseract.js, pdf-parse, detect-libc, mupdf
```

### Image Remote Patterns
```
GitHub avatars, Stability AI, Azure Blob (*.blob.core.windows.net),
AWS S3 (*.s3.amazonaws.com, *.s3.*.amazonaws.com), custom blob URL
```

### Security Headers (auto-applied)
- `Content-Security-Policy` (build-time + runtime)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Cross-Origin-Embedder-Policy: credentialless`
- Source map access blocking

### CORS
- Applied to `/api/:path*` and `/api/workflows/:id/execute`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-API-Key, X-CSRF-Token

### Experimental Features
- `optimizeCss: true`
- `turbopackSourceMaps: false`

## Vercel Cron Jobs

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/schedules/execute` | Every minute | Run scheduled workflows |
| `/api/webhooks/poll/gmail` | Every minute | Poll Gmail triggers |
| `/api/webhooks/poll/outlook` | Every minute | Poll Outlook triggers |
| `/api/logs/cleanup` | Daily midnight | Clean old execution logs |
| `/api/billing/daily` | Daily 2 AM | Process daily billing |

## Background Jobs (Trigger.dev)

```typescript
// trigger.config.ts
project: "proj_zunnejsqpkvkzywyajao"
runtime: "node"
maxDuration: 180  // seconds
retries: { maxAttempts: 1 }  // no retries in dev
dirs: ['./background']
// Custom: 1024MB Node.js heap for PDF/DWG processing
```

### Background Task Files
```
background/
├── webhook-execution.ts    # Webhook-triggered workflow execution
└── workflow-execution.ts   # Async workflow execution
```

## Environment Variables

### Required (Core)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_URL` | Auth service URL |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `ENCRYPTION_KEY` | AES-256 key (64-char hex, min 32) |
| `INTERNAL_API_SECRET` | Internal API auth |

### Registration Control
| Variable | Description |
|----------|-------------|
| `DISABLE_REGISTRATION` | Block new signups |
| `ALLOWED_LOGIN_EMAILS` | Comma-separated email whitelist |
| `ALLOWED_LOGIN_DOMAINS` | Comma-separated domain whitelist |

### Storage
| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | PostgreSQL URL |
| `REDIS_URL` | Redis URL |
| `S3_BUCKET_NAME` | Primary S3 bucket |
| `S3_LOGS_BUCKET_NAME` | Execution logs bucket |
| `S3_KB_BUCKET_NAME` | Knowledge base bucket |
| `S3_EXECUTION_FILES_BUCKET_NAME` | Execution files |
| `S3_CHAT_BUCKET_NAME` | Chat storage |
| `S3_COPILOT_BUCKET_NAME` | Copilot storage |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AZURE_ACCOUNT_NAME`, `AZURE_ACCOUNT_KEY`, `AZURE_CONNECTION_STRING` | Azure storage |

### AI Providers
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` (×4) | OpenAI keys (primary + fallback) |
| `ANTHROPIC_API_KEY` (×3) | Anthropic keys |
| `MISTRAL_API_KEY` | Mistral |
| `OLLAMA_URL` | Local Ollama instance |
| `ELEVENLABS_API_KEY` | Text-to-speech |
| `SERPER_API_KEY` | Web search |
| `AZURE_OPENAI_*` | Azure OpenAI config |

### Real-time
| Variable | Description |
|----------|-------------|
| `SOCKET_SERVER_URL` | Socket.io server URL |
| `SOCKET_PORT` | Socket port (default: 3002) |
| `ALLOWED_ORIGINS` | CORS origins |

### Client-side (NEXT_PUBLIC_*)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Main app URL |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket URL |
| `NEXT_PUBLIC_BLOB_BASE_URL` | Blob storage URL |
| `NEXT_PUBLIC_BRAND_NAME` | Whitelabel brand name |
| `NEXT_PUBLIC_BRAND_LOGO_URL` | Custom logo |
| `NEXT_PUBLIC_BRAND_PRIMARY_COLOR` | Theme color |

### Rate Limiting
| Variable | Default |
|----------|---------|
| `RATE_LIMIT_WINDOW_MS` | 60000 (60s) |
| Free tier sync/async | 10/50 |
| Pro tier sync/async | 25/200 |
| Team tier sync/async | 75/500 |
| Enterprise sync/async | 150/1000 |

### Background Jobs
| Variable | Description |
|----------|-------------|
| `TRIGGER_SECRET_KEY` | Trigger.dev auth |
| `CRON_SECRET` | Vercel cron auth |
| `JOB_RETENTION_DAYS` | Log retention period |

### Util
- `skipValidation: true` — env validation is opt-in
- `NEXT_TELEMETRY_DISABLED` defaults to `'1'`
- `isTruthy()` helper for string boolean parsing
- `getEnv()` for universal client/server env access via `next-runtime-env`

## Socket.io Server Deployment

```bash
# Runs separately from Next.js
# Host: 0.0.0.0, Port: SOCKET_PORT || 3002
# Transports: websocket (primary), polling (fallback)
# Ping: timeout 60s, interval 25s
# Max buffer: 1MB
```

## Database Migrations

```bash
# Generate migration
bunx drizzle-kit generate

# Push schema changes (dev)
bunx drizzle-kit push

# Run migrations (production)
bunx drizzle-kit migrate
```

## Common Issues
1. **Build failure**: Check `bun install` ran at root, `^build` dependencies built first
2. **Missing env vars**: Check `apps/core/lib/env.ts` for required vars
3. **Socket connection fails**: Ensure `SOCKET_PORT` and CORS origins configured
4. **Cron not firing**: Verify `vercel.json` crons and `CRON_SECRET` matches
5. **Background job timeout**: Max 180s — split long tasks
6. **PDF processing OOM**: Trigger.dev build extends Node.js heap to 1024MB
