---
name: api-and-auth
description: 'Build, modify, and debug API routes and authentication flows. Use for: creating Next.js API routes, better-auth setup, OAuth integration, Zod validation, session management, middleware, CORS, rate limiting, webhook endpoints.'
---

# API & Authentication Skill — Zelaxy

## Purpose
Build, modify, and debug API routes and authentication flows.

## When to Use
- Creating new API routes
- Modifying auth flows (login, signup, OAuth)
- Adding middleware or guards
- Debugging API errors
- Working with better-auth configuration
- Implementing rate limiting

## Auth Stack
- **Framework**: better-auth (Next.js 15 compatible)
- **Session**: HTTP-only cookies
- **OAuth**: 15+ providers (Google, GitHub, Microsoft, Slack, etc.)
- **Multi-tenant**: Organization → Workspace scoping
- **Encryption**: AES-256 for stored credentials

## Auth Flow

```
1. User signs up/logs in → better-auth
2. Session token → HTTP-only cookie
3. API request → middleware extracts session
4. Session → user + activeOrganization
5. Route handler → validates workspace access
6. Response → standard format
```

## Middleware (`middleware.ts`)

```typescript
// Key checks:
// 1. Session validation via getSessionCookie()
// 2. Subdomain extraction (custom domains)
// 3. Docs subdomain routing (docs.*)
// 4. Chat subdomain rewrite
// 5. Suspicious UA pattern detection (security)
```

## API Route Patterns

### Location
```
apps/zelaxy/app/api/
├── auth/                 # better-auth routes
├── workflows/            # CRUD, execute, sync
├── copilot/chat/         # AI copilot
├── webhooks/             # Webhook management
├── schedules/            # Cron management
├── knowledge/            # Knowledge base CRUD
├── tools/                # Tool execution
├── mcp/                  # MCP server management
├── users/                # User management
├── organizations/        # Org management
├── workspaces/           # Workspace management
├── custom-ui/            # Embedded UIs
├── embed/                # Embeddable endpoints
├── jobs/                 # Background job triggers
└── admin/                # Admin endpoints
```

### Standard Route Template

```typescript
// app/api/my-resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { myTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const workspaceId = request.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: 'Missing workspaceId' }, { status: 400 })
  }

  const items = await db
    .select()
    .from(myTable)
    .where(and(
      eq(myTable.workspaceId, workspaceId),
      // Always scope by workspace!
    ))

  return NextResponse.json({ success: true, data: items })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.flatten(),
    }, { status: 400 })
  }

  const [item] = await db
    .insert(myTable)
    .values({ ...parsed.data, userId: session.user.id })
    .returning()

  return NextResponse.json({ success: true, data: item }, { status: 201 })
}
```

### Dynamic Route

```typescript
// app/api/my-resource/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // Next.js 15: params is a Promise
  // ...
}
```

### Response Format

```typescript
// Success
{ success: true, data: any, metadata?: { page, total, ... } }

// Error
{ success: false, error: string, details?: any }

// HTTP Status Codes
200 — OK
201 — Created
400 — Bad Request (validation)
401 — Unauthorized (no session)
403 — Forbidden (no access to resource)
404 — Not Found
429 — Rate Limited
500 — Internal Server Error
```

## OAuth Configuration

### Supported Providers
```
Google (gmail, drive, docs, sheets, calendar)
GitHub, X (Twitter), Microsoft, Confluence
Airtable, Notion, Jira, Discord, Linear
Slack, Reddit, Wealthbox
```

### OAuth Flow
```
1. Frontend → `/api/auth/oauth/connect?provider=google&scopes=gmail.send`
2. Redirect → Provider consent screen
3. Callback → `/api/auth/callback/google`
4. Token stored → `credential` table (encrypted)
5. Usage → `getCredentials(credentialId)` in handlers
```

### Credential Storage
```typescript
// Encrypted with AES-256 using ENCRYPTION_KEY env var
credential: {
  id: uuid,
  userId: uuid,
  provider: text,               // 'google', 'github', etc.
  credentialData: jsonb,        // { accessToken, refreshToken, scopes }
  expiresAt: timestamp,
  workspaceId: uuid,
}
```

## Validation with Zod

```typescript
import { z } from 'zod'

// Request body validation
const workflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  state: z.record(z.unknown()).optional(),
  variables: z.array(z.object({
    key: z.string(),
    value: z.string(),
    type: z.enum(['string', 'number', 'boolean']),
  })).optional(),
})

// Query parameter validation
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
```

## Rate Limiting

```typescript
// Via queue service — subscription plan based
// Check rate limit before executing
const allowed = await checkRateLimit(userId, 'workflow_execution')
if (!allowed) {
  return NextResponse.json(
    { success: false, error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

## Common Issues
1. **Next.js 15 params**: `params` is now a `Promise` — always `await params`
2. **Missing auth check**: Every route MUST check session (except public endpoints)
3. **Missing workspace scope**: All DB queries MUST filter by workspaceId
4. **CORS**: Configured in `next.config.ts` for API routes
5. **Streaming responses**: Use `ReadableStream` for SSE endpoints
6. **File uploads**: Use `request.formData()`, not `request.json()`
