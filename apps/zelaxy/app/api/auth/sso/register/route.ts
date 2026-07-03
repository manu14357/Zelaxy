import { and, eq, ne } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { isSsoEnabled } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import { isOrganizationOwnerOrAdmin } from '@/lib/permissions/utils'
import { hasSSOAccess } from '@/lib/sso/access'
import {
  DEFAULT_OIDC_MAPPING,
  DEFAULT_OIDC_SCOPES,
  DEFAULT_SAML_MAPPING,
  REDACTED_SECRET_MARKER,
} from '@/lib/sso/constants'
import { normalizeSSODomain } from '@/lib/sso/domain'
import { getBaseUrl } from '@/lib/urls/utils'
import { db } from '@/db'
import { ssoProvider } from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('SSORegister')

const providerIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Provider ID may only contain lowercase letters, numbers and dashes')

const csvToScopes = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) return DEFAULT_OIDC_SCOPES
    const list = Array.isArray(value) ? value : value.split(',')
    const cleaned = list.map((s) => s.trim()).filter(Boolean)
    return cleaned.length > 0 ? cleaned : DEFAULT_OIDC_SCOPES
  })

const ssoRegistrationSchema = z.discriminatedUnion('providerType', [
  z.object({
    providerType: z.literal('oidc'),
    providerId: providerIdSchema,
    issuer: z.string().url(),
    domain: z.string().min(1),
    organizationId: z.string().optional(),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    scopes: csvToScopes,
    pkce: z.boolean().optional().default(true),
  }),
  z.object({
    providerType: z.literal('saml'),
    providerId: providerIdSchema,
    issuer: z.string().url(),
    domain: z.string().min(1),
    organizationId: z.string().optional(),
    entryPoint: z.string().url(),
    cert: z.string().min(1),
    callbackUrl: z.string().url().optional(),
    audience: z.string().optional(),
    wantAssertionsSigned: z.boolean().optional(),
    idpMetadata: z.string().optional(),
  }),
])

const escapeXml = (str: string) =>
  str.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '"':
        return '&quot;'
      case "'":
        return '&apos;'
      default:
        return c
    }
  })

export async function POST(request: NextRequest) {
  try {
    // The SSO plugin is only registered on the auth instance when SSO is enabled.
    if (!isSsoEnabled) {
      return NextResponse.json({ error: 'SSO is not enabled on this deployment' }, { status: 400 })
    }

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    if (!(await hasSSOAccess(userId))) {
      return NextResponse.json(
        { error: 'SSO configuration requires an Enterprise plan and organization admin access' },
        { status: 403 }
      )
    }

    const json = await request.json().catch(() => null)
    const parsed = ssoRegistrationSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid SSO configuration', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    // If scoping to an organization, the caller must be an owner/admin of it.
    if (body.organizationId && !(await isOrganizationOwnerOrAdmin(userId, body.organizationId))) {
      return NextResponse.json(
        { error: 'You must be an owner or admin of this organization to configure SSO' },
        { status: 403 }
      )
    }

    const domain = normalizeSSODomain(body.domain)
    if (!domain) {
      return NextResponse.json({ error: 'Enter a valid organization domain' }, { status: 400 })
    }

    // Prevent hijacking a domain already claimed by a provider the caller does not own.
    const conflicts = await db
      .select({
        userId: ssoProvider.userId,
        organizationId: ssoProvider.organizationId,
        providerId: ssoProvider.providerId,
      })
      .from(ssoProvider)
      .where(and(eq(ssoProvider.domain, domain), ne(ssoProvider.providerId, body.providerId)))

    const ownsConflict = conflicts.every(
      (c) =>
        c.userId === userId || (body.organizationId && c.organizationId === body.organizationId)
    )
    if (conflicts.length > 0 && !ownsConflict) {
      return NextResponse.json(
        { error: 'This domain is already registered with another SSO provider' },
        { status: 409 }
      )
    }

    // Load any existing provider so an edit can keep the stored client secret.
    const existing = await db
      .select()
      .from(ssoProvider)
      .where(eq(ssoProvider.providerId, body.providerId))
      .limit(1)

    const providerConfig: Record<string, unknown> = {
      providerId: body.providerId,
      issuer: body.issuer,
      domain,
    }
    if (body.organizationId) providerConfig.organizationId = body.organizationId

    if (body.providerType === 'oidc') {
      let clientSecret = body.clientSecret
      if (clientSecret === REDACTED_SECRET_MARKER && existing[0]?.oidcConfig) {
        try {
          const stored = JSON.parse(existing[0].oidcConfig)
          if (stored?.clientSecret) clientSecret = stored.clientSecret
        } catch {
          // fall through — validation below will reject an empty secret
        }
      }
      if (!clientSecret || clientSecret === REDACTED_SECRET_MARKER) {
        return NextResponse.json({ error: 'Client secret is required' }, { status: 400 })
      }

      providerConfig.mapping = { ...DEFAULT_OIDC_MAPPING }
      providerConfig.oidcConfig = {
        clientId: body.clientId,
        clientSecret,
        // Endpoints are auto-discovered from `${issuer}/.well-known/openid-configuration`.
        scopes: body.scopes.filter((s) => s !== 'offline_access'),
        pkce: body.pkce,
      }
    } else {
      const computedCallbackUrl =
        body.callbackUrl || `${getBaseUrl()}/api/auth/sso/saml2/callback/${body.providerId}`

      const spMetadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(getBaseUrl())}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="${body.wantAssertionsSigned ? 'true' : 'false'}" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(computedCallbackUrl)}" index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`

      const certBase64 = body.cert
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s/g, '')

      const idpMetadataXml =
        body.idpMetadata ||
        `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(body.issuer)}">
  <IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${certBase64}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(body.entryPoint)}"/>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${escapeXml(body.entryPoint)}"/>
  </IDPSSODescriptor>
</EntityDescriptor>`

      providerConfig.mapping = { ...DEFAULT_SAML_MAPPING }
      const samlConfig: Record<string, unknown> = {
        entryPoint: body.entryPoint,
        cert: body.cert,
        callbackUrl: computedCallbackUrl,
        spMetadata: { metadata: spMetadataXml },
        idpMetadata: { metadata: idpMetadataXml },
      }
      if (body.audience) samlConfig.audience = body.audience
      if (body.wantAssertionsSigned !== undefined)
        samlConfig.wantAssertionsSigned = body.wantAssertionsSigned
      providerConfig.samlConfig = samlConfig
    }

    const registration = await auth.api.registerSSOProvider({
      body: providerConfig as any,
      headers: request.headers,
    })

    logger.info('Registered SSO provider', {
      providerId: body.providerId,
      providerType: body.providerType,
      domain,
      organizationId: body.organizationId,
      userId,
    })

    return NextResponse.json({
      success: true,
      providerId: body.providerId,
      providerType: body.providerType,
      redirectURI: (registration as any)?.redirectURI,
      message: 'SSO provider saved',
    })
  } catch (error: any) {
    logger.error('Failed to register SSO provider', { error: error?.message || error })
    return NextResponse.json(
      { error: error?.message || 'Failed to register SSO provider' },
      { status: 500 }
    )
  }
}
