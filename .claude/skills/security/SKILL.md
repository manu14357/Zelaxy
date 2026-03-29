---
name: security
description: 'Maintain and improve security across the Zelaxy platform. Use for: AES-256-GCM encryption, CSP policy, CSRF protection, credential storage, multi-tenant isolation, rate limiting, middleware security, OAuth token management, suspicious UA detection.'
---

# Security Skill — Zelaxy

## Purpose
Maintain and improve security across the Zelaxy platform.

## When to Use
- Handling credentials or secrets
- Writing API routes or middleware
- Reviewing auth flows
- Implementing data access controls
- Adding new external integrations
- Auditing security posture

## Encryption

### Credential Storage (AES-256-GCM)
```typescript
// lib/utils.ts
// Algorithm: AES-256-GCM (authenticated encryption)
// Key: ENCRYPTION_KEY env var — 64-char hex string (32 bytes)
// Format: iv:encrypted:authTag (hex encoded)

import { encryptSecret, decryptSecret } from '@/lib/utils'

// Encrypt
const { encrypted, iv } = encryptSecret(plaintext)
// Store as: `${iv}:${encrypted}:${authTag}`

// Decrypt
const { decrypted } = decryptSecret(storedValue)

// IV: crypto.randomBytes(16) — unique per encryption
// Auth tag: GCM provides integrity verification
```

### Key Requirements
- `ENCRYPTION_KEY`: Minimum 32 characters, 64-char hex recommended
- `BETTER_AUTH_SECRET`: Minimum 32 characters
- `INTERNAL_API_SECRET`: Used for service-to-service auth

## Middleware Security (`middleware.ts`)

### Suspicious UA Detection
```typescript
// Blocked patterns (regex):
// - Empty user agents
// - Path traversal: '..'
// - XSS attempts: '<script'
// - Command injection: '() {'
// - Scanning tools: sqlmap, nikto, gobuster, dirb, nmap

// Response for suspicious requests:
// Status: 403
// Headers: X-Content-Type-Options: nosniff
//          X-Frame-Options: DENY
//          CSP: default-src 'none'
//          Cache-Control: no-store
```

### Session Validation
```typescript
// All protected routes check:
const session = getSessionCookie()
// /arena/* requires session — redirect to /login if missing
// API routes return 401 if no session
```

### Webhook Exemption
```typescript
// /api/webhooks/trigger/* endpoints are exempt from UA validation
// They use their own auth (webhook signatures, API keys)
```

## Content Security Policy

### Build-Time CSP (`next.config.ts`)
Applied via response headers to all routes.

### Runtime CSP (`lib/security/csp.ts`)
```typescript
// generateRuntimeCSP() — applied via middleware for:
// /arena, /chat, / routes

// Key directives:
// default-src 'self'
// script-src 'self' 'unsafe-inline' 'unsafe-eval' (Next.js requirement)
// connect-src 'self' + extensive whitelist (API, socket, analytics)
// object-src 'none'
// frame-ancestors 'self'
// base-uri 'self'
```

### Workflow Execution CSP
```typescript
// More permissive policy for /api/workflows/:id/execute
// Allows external API calls from workflow blocks
```

## CSRF Protection
- **Better Auth** handles CSRF natively
- Validates request origin against `trustedOrigins`
- `X-CSRF-Token` header in CORS `Access-Control-Allow-Headers`
- Configurable via `disableCSRFCheck` (should remain false in production)

## Cross-Origin Policies
```
Cross-Origin-Embedder-Policy: credentialless  (main routes)
Cross-Origin-Opener-Policy: same-origin
Access-Control-Allow-Credentials: true
```

## Multi-Tenant Data Isolation

### Rules
1. **All DB queries MUST filter by workspaceId** (or organizationId)
2. **Never expose data across organizations**
3. **Credential access scoped to workspace**
4. **Knowledge base access scoped to workspace**

### Pattern
```typescript
// ALWAYS include workspace/user scope in queries
const items = await db
  .select()
  .from(table)
  .where(and(
    eq(table.workspaceId, workspaceId),  // Required
    // ... other conditions
  ))
```

## OAuth Token Security
```typescript
// Tokens stored encrypted in `credential` table
// credentialData (jsonb): { accessToken, refreshToken, scopes }
// Encrypted with AES-256-GCM before storage
// Decrypted only when needed for API calls
// Token refresh handled transparently
```

## API Key Authentication
```typescript
// Workflow execution supports X-API-Key header
// Used for external/programmatic access
// Keys stored hashed, not in plaintext
// Rate-limited by subscription tier
```

## Rate Limiting
```typescript
// Tier-based limits (configurable via env vars)
// Window: RATE_LIMIT_WINDOW_MS (default 60s)
//
// | Tier       | Sync | Async |
// |------------|------|-------|
// | Free       | 10   | 50    |
// | Pro        | 25   | 200   |
// | Team       | 75   | 500   |
// | Enterprise | 150  | 1000  |
```

## Socket.io Security
- One-time token authentication via Better Auth
- Token validated before connection established
- CORS restricted to configured origins
- Credentials required (`withCredentials: true`)
- Secure cookies in production (`httpOnly`, `sameSite: 'none'`, `secure`)
- `maxHttpBufferSize: 1MB` — prevents large payload attacks

## Source Map Protection
```
// Headers block access to .map files
// X-Robots-Tag: noindex
// Cache-Control: no-store
```

## Registration Controls
```typescript
// Configurable via env vars:
DISABLE_REGISTRATION=true          // Block all new signups
ALLOWED_LOGIN_EMAILS=a@b.com,...   // Email whitelist
ALLOWED_LOGIN_DOMAINS=company.com  // Domain whitelist
```

## Security Checklist

### For New API Routes
- [ ] Session validation (`getSession()`)
- [ ] Workspace-scoped DB queries
- [ ] Input validation with Zod
- [ ] Proper error responses (no stack traces)
- [ ] Rate limiting for public endpoints

### For New Integrations
- [ ] OAuth tokens encrypted before storage
- [ ] Scopes minimized (least privilege)
- [ ] Token refresh implemented
- [ ] Credential access scoped to workspace

### For Frontend
- [ ] No secrets in client-side code
- [ ] NEXT_PUBLIC_ prefix only for safe values
- [ ] Socket auth token passed correctly
- [ ] User input sanitized before display

### Code Review Security Flags
- Direct `process.env` access without validation
- DB queries without workspace scope
- Missing session checks in API routes
- Credentials logged or exposed in responses
- `dangerouslySetInnerHTML` without sanitization
- Hard-coded secrets or API keys

## Known Limitations
1. **No HTML sanitization library** — no DOMPurify in codebase
2. **`unsafe-inline` + `unsafe-eval` in CSP** — required by Next.js/React
3. **LLM parameter sanitization only** — sanitizes model params, not HTML/XSS
4. **Skip env validation** — `skipValidation: true` means validation is opt-in
