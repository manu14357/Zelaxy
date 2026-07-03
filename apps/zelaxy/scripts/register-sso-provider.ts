#!/usr/bin/env bun
/**
 * Register (or update) a Single Sign-On provider directly in the database, without going through
 * the Settings UI. Useful during initial deployment or CI/CD automation.
 *
 * OIDC example:
 *   SSO_ENABLED=true \
 *   NEXT_PUBLIC_APP_URL=https://your-instance.com \
 *   SSO_PROVIDER_TYPE=oidc \
 *   SSO_PROVIDER_ID=okta \
 *   SSO_ISSUER=https://dev-1234567.okta.com/oauth2/default \
 *   SSO_DOMAIN=company.com \
 *   SSO_USER_EMAIL=admin@company.com \
 *   SSO_OIDC_CLIENT_ID=your-client-id \
 *   SSO_OIDC_CLIENT_SECRET=your-client-secret \
 *   bun run apps/zelaxy/scripts/register-sso-provider.ts
 *
 * SAML example:
 *   SSO_ENABLED=true \
 *   NEXT_PUBLIC_APP_URL=https://your-instance.com \
 *   SSO_PROVIDER_TYPE=saml \
 *   SSO_PROVIDER_ID=adfs \
 *   SSO_ISSUER=https://your-instance.com \
 *   SSO_DOMAIN=company.com \
 *   SSO_USER_EMAIL=admin@company.com \
 *   SSO_SAML_ENTRY_POINT=https://adfs.company.com/adfs/ls \
 *   SSO_SAML_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----" \
 *   bun run apps/zelaxy/scripts/register-sso-provider.ts
 */
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import {
  DEFAULT_OIDC_MAPPING,
  DEFAULT_OIDC_SCOPES,
  DEFAULT_SAML_MAPPING,
} from '@/lib/sso/constants'
import { normalizeSSODomain } from '@/lib/sso/domain'
import { db } from '@/db'
import { ssoProvider, user } from '@/db/schema'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`❌ Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

const escapeXml = (str: string) =>
  str.replace(/[<>&"']/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === '"' ? '&quot;' : '&apos;'
  )

async function main() {
  if (process.env.SSO_ENABLED !== 'true' && process.env.SSO_ENABLED !== '1') {
    console.error('❌ SSO_ENABLED must be set to "true" to register a provider')
    process.exit(1)
  }

  const providerType = (process.env.SSO_PROVIDER_TYPE || 'oidc').toLowerCase()
  if (providerType !== 'oidc' && providerType !== 'saml') {
    console.error('❌ SSO_PROVIDER_TYPE must be "oidc" or "saml"')
    process.exit(1)
  }

  const providerId = requireEnv('SSO_PROVIDER_ID')
  const issuer = requireEnv('SSO_ISSUER')
  const rawDomain = requireEnv('SSO_DOMAIN')
  const userEmail = requireEnv('SSO_USER_EMAIL')

  const domain = normalizeSSODomain(rawDomain)
  if (!domain) {
    console.error(`❌ Invalid domain: ${rawDomain}`)
    process.exit(1)
  }

  // The owning user must already exist.
  const owner = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, userEmail.toLowerCase()))
    .limit(1)
  if (owner.length === 0) {
    console.error(`❌ No user found with email ${userEmail}. Create the account first.`)
    process.exit(1)
  }
  const userId = owner[0].id
  const organizationId = process.env.SSO_ORGANIZATION_ID || null

  let oidcConfig: string | null = null
  let samlConfig: string | null = null

  if (providerType === 'oidc') {
    const clientId = requireEnv('SSO_OIDC_CLIENT_ID')
    const clientSecret = requireEnv('SSO_OIDC_CLIENT_SECRET')
    const scopes = process.env.SSO_OIDC_SCOPES
      ? process.env.SSO_OIDC_SCOPES.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_OIDC_SCOPES

    oidcConfig = JSON.stringify({
      issuer,
      clientId,
      clientSecret,
      // Endpoints are auto-discovered from the issuer at sign-in time.
      discoveryEndpoint: `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`,
      scopes: scopes.filter((s) => s !== 'offline_access'),
      pkce: true,
      mapping: {
        id: process.env.SSO_MAPPING_ID || DEFAULT_OIDC_MAPPING.id,
        email: process.env.SSO_MAPPING_EMAIL || DEFAULT_OIDC_MAPPING.email,
        emailVerified: DEFAULT_OIDC_MAPPING.emailVerified,
        name: process.env.SSO_MAPPING_NAME || DEFAULT_OIDC_MAPPING.name,
        image: process.env.SSO_MAPPING_IMAGE || DEFAULT_OIDC_MAPPING.image,
      },
    })
  } else {
    const entryPoint = requireEnv('SSO_SAML_ENTRY_POINT')
    const cert = requireEnv('SSO_SAML_CERT').replace(/\\n/g, '\n')
    const callbackUrl = `${getBaseUrl()}/api/auth/sso/saml2/callback/${providerId}`

    const certBase64 = cert
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '')

    const spMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(getBaseUrl())}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(callbackUrl)}" index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`

    const idpMetadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(issuer)}">
  <IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${certBase64}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(entryPoint)}"/>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${escapeXml(entryPoint)}"/>
  </IDPSSODescriptor>
</EntityDescriptor>`

    samlConfig = JSON.stringify({
      issuer,
      entryPoint,
      cert,
      callbackUrl,
      spMetadata: { metadata: spMetadata },
      idpMetadata: { metadata: idpMetadata },
      wantAssertionsSigned: false,
      mapping: {
        id: process.env.SSO_MAPPING_ID || DEFAULT_SAML_MAPPING.id,
        email: process.env.SSO_MAPPING_EMAIL || DEFAULT_SAML_MAPPING.email,
        name: process.env.SSO_MAPPING_NAME || DEFAULT_SAML_MAPPING.name,
      },
    })
  }

  const existing = await db
    .select({ id: ssoProvider.id })
    .from(ssoProvider)
    .where(eq(ssoProvider.providerId, providerId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(ssoProvider)
      .set({ issuer, domain, oidcConfig, samlConfig, userId, organizationId })
      .where(eq(ssoProvider.providerId, providerId))
    console.log(`✅ Updated SSO provider "${providerId}" (${providerType.toUpperCase()})`)
  } else {
    await db.insert(ssoProvider).values({
      id: nanoid(),
      issuer,
      domain,
      oidcConfig,
      samlConfig,
      userId,
      providerId,
      organizationId,
    })
    console.log(`✅ Registered SSO provider "${providerId}" (${providerType.toUpperCase()})`)
  }

  const callbackUrl =
    providerType === 'saml'
      ? `${getBaseUrl()}/api/auth/sso/saml2/callback/${providerId}`
      : `${getBaseUrl()}/api/auth/sso/callback/${providerId}`

  console.log(`   Domain:       ${domain}`)
  console.log(`   Callback URL: ${callbackUrl}`)
  console.log('   Register this Callback URL (Redirect URI / ACS URL) in your identity provider.')

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Failed to register SSO provider:', error)
  process.exit(1)
})
