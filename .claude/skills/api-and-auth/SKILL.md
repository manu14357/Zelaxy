---
name: api-and-auth
description: 'Build, modify, and debug API routes and authentication flows. Use for: creating Next.js API routes, better-auth setup, OAuth integration, Zod validation, session management, middleware, CORS, rate limiting, webhook trigger endpoints, chat/public API auth, dual auth (session + workflow), and internal x-api-key auth.'
---

# API & Authentication Skill — Zelaxy

## Purpose
Build, modify, and debug API routes and authentication flows in `apps/zelaxy`.

## When to Use
- Creating new API routes
- Modifying auth flows (login, signup, OAuth)
- Adding middleware or guards
- Debugging API errors
- Working with better-auth configuration
- Implementing rate limiting / request validation
- Updating webhook trigger endpoints
- Working with chat/public API auth and CORS behavior

## Auth Stack
- **Framework**: `better-auth` + `toNextJsHandler` route bridge
- **Primary session helper**: `getSession()` from `lib/auth.ts`
- **Session storage**: DB-backed sessions with cookie session token
- **Auth plugins in use**: `nextCookies`, `oneTimeToken`, `emailOTP`, `genericOAuth`, `organization`, optional `stripe`
- **OAuth model**: provider connections persisted in `account` table (with refresh support)
- **Secrets/encryption**: encrypted env vars and credentials handled in lib utilities

## Auth Flow

```
1. Auth requests hit /api/auth/[...all] and are handled by better-auth.
2. better-auth stores session/account records in Postgres via Drizzle adapter.
3. API routes call getSession() (or route-specific auth helper).
4. Route applies additional authorization (workspace/user/resource ownership).
5. Route validates body/query (commonly with Zod).
6. Route returns JSON (shape differs by route family, do not force one global schema).
```

## Middleware (`middleware.ts`)

```typescript
// Key checks:
// 1. Session presence check via getSessionCookie()
// 2. Docs subdomain passthrough (proxied in next.config.ts rewrites)
// 3. Custom subdomain handling + chat rewrite behavior
// 4. Legacy route redirects (/zelaxy, /workspace, /arena/*/w)
// 5. Protected arena routes redirect to /login when unauthenticated
// 6. Suspicious User-Agent blocking (with webhook trigger exemption)
// 7. Runtime CSP header injection for app/chat entry routes
```

## API Route Patterns

### Location
```
apps/zelaxy/app/api/
├── auth/                 # better-auth bridge + oauth/session utilities
├── arenas/               # workspace/arena membership and permissions
├── billing/              # usage and billing actions
├── chat/                 # chat deployment + public subdomain endpoints
├── copilot/              # copilot API methods/checkpoints/templates
├── environment/          # user env variables (dual auth pattern)
├── files/                # upload/download/serve/presigned/delete
├── function/             # function execution endpoints
├── jobs/                 # background task orchestration
├── knowledge/            # knowledge base + ingestion
├── logs/                 # execution/chat logs
├── mcp/                  # MCP server/tool APIs
├── organizations/        # org config + environment
├── schedules/            # scheduled runs
├── tools/                # tool execution APIs
├── webhooks/             # trigger + provider webhook processing
├── workflows/            # workflow CRUD/execute/helpers
└── plus admin/users/workspaces/usage-limits/health/etc.
```

### Core Auth Patterns (Important)

There is no single auth strategy across all APIs. Pick the correct one for the route family:

1. Session auth
```typescript
const session = await getSession()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

2. Session or API key fallback (copilot helper)
```typescript
const { userId, isAuthenticated } = await authenticateCopilotRequest(req)
if (!isAuthenticated || !userId) {
  return createUnauthorizedResponse()
}
```

3. Internal service key auth (machine-to-machine)
```typescript
const apiKey = req.headers.get('x-api-key')
if (apiKey !== env.INTERNAL_API_SECRET) {
  return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
}
```

4. Dual auth by workflow context (session OR workflow ownership)
```typescript
const userId = await getUserId(requestId, workflowId)
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Standard Route Template (Session + Zod + DB scope)

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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspaceId = request.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
  }

  const items = await db
    .select()
    .from(myTable)
    .where(and(
      eq(myTable.workspaceId, workspaceId),
      // Always scope by workspace!
    ))

  return NextResponse.json({ data: items })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: parsed.error.flatten(),
    }, { status: 400 })
  }

  const [item] = await db
    .insert(myTable)
    .values({ ...parsed.data, userId: session.user.id })
    .returning()

  return NextResponse.json({ data: item }, { status: 201 })
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

### Response Conventions

```typescript
// Do not enforce one global response shape.
// Existing APIs use multiple valid patterns:

// Pattern A: plain NextResponse JSON
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// Pattern B: helpers in app/api/workflows/utils.ts
return createErrorResponse('Invalid request', 400)
return createSuccessResponse({ data })

// Pattern C: endpoint-specific success envelope
return NextResponse.json({ success: true, output: result }, { status: 200 })
```

## OAuth Configuration

### Where OAuth Is Configured
```
apps/zelaxy/lib/auth.ts
  - socialProviders: google, microsoft (github social provider intentionally disabled)
  - genericOAuth providers: github-repo, google-* scopes, microsoft, slack, reddit, etc.

apps/zelaxy/app/api/auth/oauth/
  - token/credentials/connections/disconnect utilities and tests
```

### OAuth Flow
```
1. Frontend hits better-auth oauth2 connect/callback endpoints.
2. Provider redirects back to /api/auth/oauth2/callback/<providerId>.
3. Token metadata is stored on the account/provider connection.
4. Route helpers refresh expired tokens when refresh token exists.
5. API routes fetch tokens through oauth utils (do not read raw headers directly).
```

### Token Access Pattern
```typescript
const credential = await getCredential(requestId, credentialId, userId)
if (!credential) {
  return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
}

const token = await refreshAccessTokenIfNeeded(credentialId, userId, requestId)
if (!token) {
  return NextResponse.json({ error: 'Token unavailable' }, { status: 401 })
}
```

## Validation with Zod

```typescript
import { z } from 'zod'

// Request body validation
const payloadSchema = z.object({
  id: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
})

// Query coercion
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})
```

Prefer `safeParse` for user-facing API routes where you want explicit error payloads.

## Rate Limiting

```typescript
// Webhook and async execution paths use queue/RateLimiter checks
const rateLimitCheck = await rateLimiter.checkRateLimit(userId, plan, 'webhook', true)
if (!rateLimitCheck.allowed) {
  return new NextResponse('Rate limit exceeded', { status: 429 })
}
```

## Webhook Endpoint Guidance

- Main trigger endpoint: `app/api/webhooks/trigger/[path]/route.ts`
- `GET` supports provider verification checks (e.g., WhatsApp challenge)
- `POST` handles raw body parsing, content-type branching, provider signature checks, and async trigger tasking
- Keep webhook trigger routes public, but validate provider signatures/hmac where required
- Middleware UA blocking exempts `/api/webhooks/trigger/*`

## CORS and Headers

- Baseline API CORS headers are set in `next.config.ts` for `/api/:path*`
- Some public endpoints add route-level CORS helpers (notably chat endpoints)
- Keep OPTIONS handling where cross-origin browser usage is expected

## Testing Expectations for API/Auth Changes

- Add or update route tests alongside endpoint changes (`route.test.ts`)
- Use existing API test utilities under `app/api/__test-utils__/`
- Cover at least: unauthenticated request, invalid payload, success case

## Common Issues
1. **Wrong auth pattern**: Using session auth where route expects internal API key or dual auth
2. **Next.js 15 params**: `params` is a Promise in route handlers with dynamic segments
3. **Assuming one response schema**: Different API groups intentionally return different JSON shapes
4. **Missing ownership checks**: Session auth alone is not authorization; scope DB queries by owner/workspace
5. **Webhook parsing bugs**: Some providers send form-encoded payloads, not JSON
6. **Token refresh gaps**: OAuth access tokens can expire; use refresh helpers instead of raw token reads
7. **CORS regressions**: Public chat/webhook endpoints may need route-level CORS behavior in addition to global headers
