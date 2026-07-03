'use client'

import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getEnv, isTruthy } from '@/lib/env'

interface SSOLoginButtonProps {
  callbackURL?: string
}

/**
 * "Sign in with SSO" button. Renders only when NEXT_PUBLIC_SSO_ENABLED is set. Routes to the
 * dedicated /sso page which collects a work email and hands off to the identity provider.
 */
export function SSOLoginButton({ callbackURL = '/arena' }: SSOLoginButtonProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch and only show when SSO is enabled.
  if (!mounted || !isTruthy(getEnv('NEXT_PUBLIC_SSO_ENABLED'))) return null

  return (
    <Button
      type='button'
      variant='outline'
      className='h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
      onClick={() => router.push(`/sso?callbackUrl=${encodeURIComponent(callbackURL)}`)}
    >
      <KeyRound className='mr-2 h-4 w-4' />
      Sign in with SSO
    </Button>
  )
}
