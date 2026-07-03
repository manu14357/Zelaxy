'use client'

import { useState } from 'react'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'

const logger = createLogger('SSOForm')

function validateCallbackUrl(url: string): boolean {
  // Only allow same-origin relative paths as callback targets.
  return url.startsWith('/') && !url.startsWith('//')
}

export function SSOForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rawCallback = searchParams.get('callbackUrl') || '/arena'
  const callbackUrl = validateCallbackUrl(rawCallback) ? rawCallback : '/arena'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const value = email.trim()
    if (!value) {
      setError('Enter your work email to continue')
      return
    }

    setIsLoading(true)
    try {
      // Better Auth resolves the SSO provider from the email domain and redirects to the IdP.
      await client.signIn.sso({
        email: value,
        callbackURL: callbackUrl,
        errorCallbackURL: `/sso?error=sso_failed&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      })
    } catch (err: any) {
      const message: string = err?.message || err?.error?.message || ''
      logger.error('SSO sign-in failed', { error: message })

      if (/no.*provider|not found|INVALID_EMAIL_DOMAIN|no sso/i.test(message)) {
        setError('No SSO provider is configured for this email domain.')
      } else if (/rate limit/i.test(message)) {
        setError('Too many attempts. Please try again later.')
      } else if (/network/i.test(message)) {
        setError('Network error. Check your connection and try again.')
      } else {
        setError('Could not start SSO sign-in. Please try again.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className='auth-card'>
      {/* Header */}
      <div className='mb-7 flex flex-col items-center gap-3 text-center'>
        <Link href='/'>
          <Image
            src='/Zelaxy.png'
            alt='Zelaxy'
            width={44}
            height={44}
            className='h-11 w-11 rounded-xl'
            priority
          />
        </Link>
        <div>
          <h1 className='t-ink font-semibold text-[22px] tracking-[-0.02em]'>Single sign-on</h1>
          <p className='t-faint mt-1 text-[13px]'>
            Enter your work email to continue with your identity provider
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='sso-email' className='t-dim font-medium text-[13px]'>
            Work Email
          </label>
          <div className='relative'>
            <Mail className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[color:var(--bp-ink-faint)]' />
            <input
              id='sso-email'
              name='email'
              type='email'
              placeholder='you@company.com'
              required
              autoComplete='email'
              autoCapitalize='none'
              autoCorrect='off'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              className={cn('auth-input', error && 'error')}
            />
          </div>
          {error && <p className='text-[12px] text-red-400'>{error}</p>}
        </div>

        <Button type='submit' disabled={isLoading} className='h-11 w-full rounded-xl'>
          <KeyRound className='mr-2 h-4 w-4' />
          {isLoading ? 'Redirecting…' : 'Continue with SSO'}
        </Button>
      </form>

      <button
        type='button'
        onClick={() => router.push('/login')}
        className='t-faint mt-6 flex w-full items-center justify-center gap-1.5 text-[13px] transition-colors hover:text-[color:var(--bp-ink)]'
      >
        <ArrowLeft className='h-3.5 w-3.5' />
        Back to sign in
      </button>
    </div>
  )
}
