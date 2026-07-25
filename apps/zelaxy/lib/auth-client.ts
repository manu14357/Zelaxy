import { ssoClient } from '@better-auth/sso/client'
import { emailOTPClient, genericOAuthClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { env, getEnv } from '@/lib/env'

export function getBaseURL() {
  let baseURL

  if (env.VERCEL_ENV === 'preview') {
    baseURL = `https://${getEnv('NEXT_PUBLIC_VERCEL_URL')}`
  } else if (env.VERCEL_ENV === 'development') {
    baseURL = `https://${getEnv('NEXT_PUBLIC_VERCEL_URL')}`
  } else if (env.VERCEL_ENV === 'production') {
    baseURL = env.BETTER_AUTH_URL || getEnv('NEXT_PUBLIC_APP_URL')
  } else if (env.NODE_ENV === 'development') {
    baseURL = getEnv('NEXT_PUBLIC_APP_URL') || env.BETTER_AUTH_URL || 'http://localhost:3000'
  }

  return baseURL
}

// Subscription management (upgrade/cancel) is NOT a better-auth client
// plugin here - unlike Stripe, Razorpay has no official better-auth
// integration, so it's handled by our own API routes + the Razorpay
// Checkout widget instead. See lib/billing/razorpay-checkout-client.ts.
export const client = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [emailOTPClient(), genericOAuthClient(), ssoClient(), organizationClient()],
})

export const { useSession, useActiveOrganization } = client

export const { signIn, signUp, signOut } = client
