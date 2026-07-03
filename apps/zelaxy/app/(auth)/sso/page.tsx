import { redirect } from 'next/navigation'
import { getEnv, isTruthy } from '@/lib/env'
import { SSOForm } from './sso-form'

// Force dynamic rendering to avoid prerender errors with search params
export const dynamic = 'force-dynamic'

export default function SSOPage() {
  // SSO sign-in is only reachable when the feature is enabled.
  if (!isTruthy(getEnv('NEXT_PUBLIC_SSO_ENABLED'))) {
    redirect('/login')
  }

  return <SSOForm />
}
