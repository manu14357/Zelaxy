import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isSsoEnabled } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import { isOrganizationOwnerOrAdmin } from '@/lib/permissions/utils'
import { hasSSOAccess } from '@/lib/sso/access'
import { REDACTED_SECRET_MARKER } from '@/lib/sso/constants'
import { db } from '@/db'
import { ssoProvider } from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('SSOProviders')

interface SSOProviderView {
  id: string
  providerId: string
  providerType: 'oidc' | 'saml'
  issuer: string
  domain: string
  organizationId: string | null
  clientId?: string
  scopes?: string[]
  entryPoint?: string
  audience?: string
  clientSecret: string
}

function toView(row: typeof ssoProvider.$inferSelect): SSOProviderView {
  const base: SSOProviderView = {
    id: row.id,
    providerId: row.providerId,
    providerType: row.samlConfig ? 'saml' : 'oidc',
    issuer: row.issuer,
    domain: row.domain,
    organizationId: row.organizationId,
    // Never return a stored secret — the settings form treats this marker as "unchanged".
    clientSecret: REDACTED_SECRET_MARKER,
  }

  if (row.oidcConfig) {
    try {
      const cfg = JSON.parse(row.oidcConfig)
      base.clientId = cfg.clientId
      base.scopes = cfg.scopes
    } catch {
      // ignore malformed config
    }
  }
  if (row.samlConfig) {
    try {
      const cfg = JSON.parse(row.samlConfig)
      base.entryPoint = cfg.entryPoint
      base.audience = cfg.audience
    } catch {
      // ignore malformed config
    }
  }
  return base
}

export async function GET(request: NextRequest) {
  try {
    if (!isSsoEnabled) {
      return NextResponse.json({ providers: [] })
    }

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const organizationId = request.nextUrl.searchParams.get('organizationId')

    let rows: (typeof ssoProvider.$inferSelect)[]
    if (organizationId) {
      if (!(await isOrganizationOwnerOrAdmin(userId, organizationId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      rows = await db
        .select()
        .from(ssoProvider)
        .where(eq(ssoProvider.organizationId, organizationId))
    } else {
      rows = await db.select().from(ssoProvider).where(eq(ssoProvider.userId, userId))
    }

    return NextResponse.json({ providers: rows.map(toView) })
  } catch (error: any) {
    logger.error('Failed to list SSO providers', { error: error?.message || error })
    return NextResponse.json({ error: 'Failed to list SSO providers' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isSsoEnabled) {
      return NextResponse.json({ error: 'SSO is not enabled on this deployment' }, { status: 400 })
    }

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    if (!(await hasSSOAccess(userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const providerId = request.nextUrl.searchParams.get('providerId')
    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(ssoProvider)
      .where(eq(ssoProvider.providerId, providerId))
      .limit(1)

    const provider = rows[0]
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Only the owner, or an owner/admin of the provider's organization, may delete it.
    const allowed =
      provider.userId === userId ||
      (provider.organizationId
        ? await isOrganizationOwnerOrAdmin(userId, provider.organizationId)
        : false)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.delete(ssoProvider).where(and(eq(ssoProvider.providerId, providerId)))

    logger.info('Deleted SSO provider', { providerId, userId })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to delete SSO provider', { error: error?.message || error })
    return NextResponse.json({ error: 'Failed to delete SSO provider' }, { status: 500 })
  }
}
