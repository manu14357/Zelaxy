import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { authenticateV1Request } from '@/app/api/v1/auth'

const logger = createLogger('V1Middleware')

export type V1Endpoint =
  | 'logs'
  | 'logs-detail'
  | 'workflows'
  | 'workflow-detail'
  | 'audit-logs'
  | 'tables'
  | 'table-detail'
  | 'files'
  | 'file-detail'
  | 'knowledge'
  | 'knowledge-detail'
  | 'knowledge-search'
  | 'copilot-chat'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
  userId?: string
  error?: string
}

export interface AuthorizedRequest {
  requestId: string
  userId: string
  rateLimit: RateLimitResult
}

/**
 * Authenticate the request and perform a lightweight rate-limit check.
 * Zelaxy does not yet have billing-tier rate limiting; this is a pass-through
 * that authenticates and returns a generous static limit.
 */
export async function checkRateLimit(
  request: NextRequest,
  _endpoint: V1Endpoint = 'logs'
): Promise<RateLimitResult> {
  const auth = await authenticateV1Request(request)
  if (!auth.authenticated) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      resetAt: new Date(),
      error: auth.error,
    }
  }

  return {
    allowed: true,
    remaining: 1000,
    limit: 1000,
    resetAt: new Date(Date.now() + 60_000),
    userId: auth.userId,
  }
}

/**
 * Build a standard 401/429 response from a failed RateLimitResult.
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const isAuthError =
    result.error?.toLowerCase().includes('invalid') ||
    result.error?.toLowerCase().includes('required') ||
    result.error?.toLowerCase().includes('failed')

  return NextResponse.json(
    { error: result.error ?? 'Unauthorized' },
    { status: isAuthError ? 401 : 429 }
  )
}

/**
 * Verify that the authenticated user has access to a workspace.
 * Returns a NextResponse on failure, null on success.
 */
export async function validateWorkspaceAccess(
  _rateLimit: RateLimitResult,
  userId: string,
  workspaceId: string,
  mode: 'read' | 'write' | 'admin' = 'read'
): Promise<NextResponse | null> {
  try {
    const permission = await getUserEntityPermissions(userId, 'workspace', workspaceId)

    if (permission === null) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 })
    }

    if (mode === 'write' && permission === 'read') {
      return NextResponse.json({ error: 'Write access required' }, { status: 403 })
    }

    if (mode === 'admin' && permission !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return null
  } catch (error) {
    logger.error('Workspace access check error', { error })
    return NextResponse.json({ error: 'Failed to verify workspace access' }, { status: 500 })
  }
}

/**
 * Check that the request's API key scope matches the requested workspaceId.
 * Zelaxy API keys are user-scoped (not workspace-scoped), so this is a no-op.
 * Reserved for future workspace-scoped key support.
 */
export function checkWorkspaceScope(
  _rateLimit: RateLimitResult,
  _workspaceId: string
): NextResponse | null {
  return null
}

/**
 * Combined authenticate + rate-limit helper used by routes that prefer
 * the `AuthorizedRequest` pattern.
 */
export async function authenticateRequest(
  request: NextRequest,
  endpoint: V1Endpoint
): Promise<AuthorizedRequest | NextResponse> {
  const requestId = crypto.randomUUID().slice(0, 8)
  const rateLimit = await checkRateLimit(request, endpoint)
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit)
  }
  return { requestId, userId: rateLimit.userId!, rateLimit }
}
