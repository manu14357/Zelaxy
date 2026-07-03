/**
 * Shared Single Sign-On constants.
 *
 * `SSO_TRUSTED_PROVIDERS` is used in two places:
 *  1. As `accountLinking.trustedProviders` in lib/auth.ts, so an SSO sign-in links to an
 *     existing same-email account without a fresh local email-verification step.
 *  2. As autocomplete suggestions for the Provider ID field in the SSO settings form.
 *
 * Additional provider IDs can be trusted at runtime via the SSO_TRUSTED_PROVIDER_IDS env var
 * (comma-separated) without editing this list.
 */
export const SSO_TRUSTED_PROVIDERS = [
  'okta',
  'azure-ad',
  'entra-id',
  'microsoft',
  'google-workspace',
  'auth0',
  'onelogin',
  'jumpcloud',
  'ping-identity',
  'keycloak',
  'authentik',
  'adfs',
  'shibboleth',
  'saml',
  'oidc',
  'custom-sso',
] as const

/**
 * Placeholder returned in list responses in place of a stored client secret, and accepted on
 * update to mean "keep the existing secret". Never a real secret value.
 */
export const REDACTED_SECRET_MARKER = '__REDACTED__'

/** Default OIDC scopes when none are supplied. */
export const DEFAULT_OIDC_SCOPES = ['openid', 'profile', 'email']

/** Default attribute mapping for OIDC providers (standard OIDC claims). */
export const DEFAULT_OIDC_MAPPING = {
  id: 'sub',
  email: 'email',
  emailVerified: 'email_verified',
  name: 'name',
  image: 'picture',
} as const

/**
 * Default attribute mapping for SAML providers. Uses the Microsoft/ADFS claim URNs, which are
 * also emitted by most SAML 2.0 IdPs (Okta, OneLogin, etc.).
 */
export const DEFAULT_SAML_MAPPING = {
  id: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
} as const
