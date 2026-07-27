'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { client } from '@/lib/auth-client'
import { quickValidateEmail } from '@/lib/email/validation'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { SocialLoginButtons } from '@/app/(auth)/components/social-login-buttons'
import { SSOLoginButton } from '@/app/(auth)/components/sso-login-button'

const logger = createLogger('LoginForm')

const validateEmailField = (emailValue: string): string[] => {
  const errors: string[] = []
  if (!emailValue || !emailValue.trim()) {
    errors.push('Email is required.')
    return errors
  }
  const validation = quickValidateEmail(emailValue.trim().toLowerCase())
  if (!validation.isValid) {
    errors.push(validation.reason || 'Please enter a valid email address.')
  }
  return errors
}

const PASSWORD_VALIDATIONS = {
  required: {
    test: (value: string) => Boolean(value && typeof value === 'string'),
    message: 'Password is required.',
  },
  notEmpty: {
    test: (value: string) => value.trim().length > 0,
    message: 'Password cannot be empty.',
  },
}

const validateCallbackUrl = (url: string): boolean => {
  try {
    if (url.startsWith('/')) return true
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    return url.startsWith(currentOrigin)
  } catch (error) {
    logger.error('Error validating callback URL:', { error, url })
    return false
  }
}

/**
 * Keeps the post-auth destination attached when someone switches from login
 * to signup. Previously only the invite flow forwarded it, so a visitor who
 * came from "Get Pro" and had no account yet lost the purchase on that one
 * click. Encoded because callbackUrl carries its own query string
 * (`/checkout?plan=pro`), which would otherwise be parsed as params of the
 * signup URL itself.
 */
const buildSignupHref = (isInviteFlow: boolean, callbackUrl: string): string => {
  const isDefault = !callbackUrl || callbackUrl === '/arena'
  if (!isInviteFlow && isDefault) return '/signup'

  const params = new URLSearchParams()
  if (isInviteFlow) params.set('invite_flow', 'true')
  if (!isDefault) params.set('callbackUrl', callbackUrl)
  return `/signup?${params.toString()}`
}

const validatePassword = (passwordValue: string): string[] => {
  const errors: string[] = []
  if (!PASSWORD_VALIDATIONS.required.test(passwordValue)) {
    errors.push(PASSWORD_VALIDATIONS.required.message)
    return errors
  }
  if (!PASSWORD_VALIDATIONS.notEmpty.test(passwordValue)) {
    errors.push(PASSWORD_VALIDATIONS.notEmpty.message)
    return errors
  }
  return errors
}

export default function LoginPage({
  githubAvailable,
  googleAvailable,
  isProduction,
}: {
  githubAvailable: boolean
  googleAvailable: boolean
  isProduction: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [_mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [showValidationError, setShowValidationError] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('/arena')
  const [isInviteFlow, setIsInviteFlow] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isSubmittingReset, setIsSubmittingReset] = useState(false)
  const [resetStatus, setResetStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [email, setEmail] = useState('')
  const [emailErrors, setEmailErrors] = useState<string[]>([])
  const [showEmailValidationError, setShowEmailValidationError] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (searchParams) {
      const callback = searchParams.get('callbackUrl')
      if (callback && validateCallbackUrl(callback)) setCallbackUrl(callback)
      setIsInviteFlow(searchParams.get('invite_flow') === 'true')
    }
  }, [searchParams])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && forgotPasswordOpen) handleForgotPassword()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [forgotPasswordEmail, forgotPasswordOpen])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setEmailErrors(validateEmailField(newEmail))
    setShowEmailValidationError(false)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordErrors(validatePassword(newPassword))
    setShowValidationError(false)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const emailVal = formData.get('email') as string

    const emailValidationErrors = validateEmailField(emailVal)
    setEmailErrors(emailValidationErrors)
    setShowEmailValidationError(emailValidationErrors.length > 0)

    const passwordValidationErrors = validatePassword(password)
    setPasswordErrors(passwordValidationErrors)
    setShowValidationError(passwordValidationErrors.length > 0)

    if (emailValidationErrors.length > 0 || passwordValidationErrors.length > 0) {
      setIsLoading(false)
      return
    }

    try {
      const safeCallbackUrl = validateCallbackUrl(callbackUrl) ? callbackUrl : '/arena'
      const result = await client.signIn.email(
        { email: emailVal, password },
        {
          onError: (ctx) => {
            console.error('Login error:', ctx.error)
            const errorMessage: string[] = ['Invalid email or password']
            if (ctx.error.code?.includes('EMAIL_NOT_VERIFIED')) return
            if (
              ctx.error.code?.includes('BAD_REQUEST') ||
              ctx.error.message?.includes('Email and password sign in is not enabled')
            ) {
              errorMessage.push('Email sign in is currently disabled.')
            } else if (
              ctx.error.code?.includes('INVALID_CREDENTIALS') ||
              ctx.error.message?.includes('invalid password')
            ) {
              errorMessage.push('Invalid email or password. Please try again.')
            } else if (
              ctx.error.code?.includes('USER_NOT_FOUND') ||
              ctx.error.message?.includes('not found')
            ) {
              errorMessage.push('No account found with this email. Please sign up first.')
            } else if (ctx.error.code?.includes('MISSING_CREDENTIALS')) {
              errorMessage.push('Please enter both email and password.')
            } else if (ctx.error.code?.includes('EMAIL_PASSWORD_DISABLED')) {
              errorMessage.push('Email and password login is disabled.')
            } else if (ctx.error.code?.includes('FAILED_TO_CREATE_SESSION')) {
              errorMessage.push('Failed to create session. Please try again later.')
            } else if (ctx.error.code?.includes('too many attempts')) {
              errorMessage.push(
                'Too many login attempts. Please try again later or reset your password.'
              )
            } else if (ctx.error.code?.includes('account locked')) {
              errorMessage.push(
                'Your account has been locked for security. Please reset your password.'
              )
            } else if (ctx.error.code?.includes('network')) {
              errorMessage.push('Network error. Please check your connection and try again.')
            } else if (ctx.error.message?.includes('rate limit')) {
              errorMessage.push('Too many requests. Please wait a moment before trying again.')
            }
            setPasswordErrors(errorMessage)
            setShowValidationError(true)
          },
        }
      )

      if (!result || result.error) {
        setIsLoading(false)
        return
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('has_logged_in_before', 'true')
        document.cookie = 'has_logged_in_before=true; path=/; max-age=31536000; SameSite=Lax'
      }
      router.push(safeCallbackUrl)
    } catch (err: any) {
      if (err.message?.includes('not verified') || err.code?.includes('EMAIL_NOT_VERIFIED')) {
        try {
          await client.emailOtp.sendVerificationOtp({ email: email, type: 'email-verification' })
          if (typeof window !== 'undefined') sessionStorage.setItem('verificationEmail', email)
          router.push('/verify')
          return
        } catch (_verifyErr) {
          setPasswordErrors(['Failed to send verification code. Please try again later.'])
          setShowValidationError(true)
          setIsLoading(false)
          return
        }
      }
      console.error('Uncaught login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setResetStatus({ type: 'error', message: 'Please enter your email address' })
      return
    }
    try {
      setIsSubmittingReset(true)
      setResetStatus({ type: null, message: '' })
      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to request password reset')
      }
      setResetStatus({ type: 'success', message: 'Password reset link sent to your email' })
      setTimeout(() => {
        setForgotPasswordOpen(false)
        setResetStatus({ type: null, message: '' })
      }, 2000)
    } catch (error) {
      logger.error('Error requesting password reset:', { error })
      setResetStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to request password reset',
      })
    } finally {
      setIsSubmittingReset(false)
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
          <h1 className='t-ink font-semibold text-[22px] tracking-[-0.02em]'>Welcome back</h1>
          <p className='t-faint mt-1 text-[13px]'>Sign in to continue building</p>
        </div>
      </div>

      {/* Social */}
      <div className='grid gap-3'>
        <SocialLoginButtons
          googleAvailable={googleAvailable}
          githubAvailable={githubAvailable}
          isProduction={isProduction}
          callbackURL={callbackUrl}
        />
        <SSOLoginButton callbackURL={callbackUrl} />
      </div>

      {/* Divider */}
      <div className='auth-divider my-5'>or</div>

      {/* Form */}
      <form onSubmit={onSubmit} className='flex flex-col gap-4'>
        {/* Email */}
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='email' className='t-dim font-medium text-[13px]'>
            Email Address
          </label>
          <div className='relative'>
            <Mail className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[color:var(--bp-ink-faint)]' />
            <input
              id='email'
              name='email'
              type='email'
              placeholder='you@example.com'
              required
              autoComplete='email'
              autoCapitalize='none'
              autoCorrect='off'
              value={email}
              onChange={handleEmailChange}
              className={cn(
                'auth-input',
                showEmailValidationError && emailErrors.length > 0 && 'error'
              )}
            />
          </div>
          {showEmailValidationError &&
            emailErrors.map((err, i) => (
              <p key={i} className='text-[12px] text-red-400'>
                {err}
              </p>
            ))}
        </div>

        {/* Password */}
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between'>
            <label htmlFor='password' className='t-dim font-medium text-[13px]'>
              Password
            </label>
            <button
              type='button'
              onClick={() => setForgotPasswordOpen(true)}
              className='t-accent text-[13px] transition-opacity hover:opacity-80'
            >
              Forgot password?
            </button>
          </div>
          <div className='relative'>
            <Lock className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[color:var(--bp-ink-faint)]' />
            <input
              id='password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter your password'
              required
              autoComplete='current-password'
              value={password}
              onChange={handlePasswordChange}
              className={cn(
                'auth-input pr-11',
                showValidationError && passwordErrors.length > 0 && 'error'
              )}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className='-translate-y-1/2 t-faint hover:t-dim absolute top-1/2 right-3 transition-colors'
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {showValidationError &&
            passwordErrors.map((err, i) => (
              <p key={i} className='text-[12px] text-red-400'>
                {err}
              </p>
            ))}
        </div>

        {/* Submit */}
        <button type='submit' disabled={isLoading} className='auth-submit-btn mt-1'>
          {isLoading ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-[#1c0c00]/20 border-t-[#1c0c00]' />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              Sign In <ArrowRight className='h-4 w-4' />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className='t-faint mt-6 text-center text-[13px]'>
        Don&apos;t have an account?{' '}
        <Link
          href={buildSignupHref(isInviteFlow, callbackUrl)}
          className='t-accent font-medium transition-opacity hover:opacity-80'
        >
          Sign up free
        </Link>
      </p>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className='s-panel b-strong mx-auto max-w-sm rounded-2xl border'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='t-ink text-center font-semibold text-[18px]'>
              Reset Password
            </DialogTitle>
            <DialogDescription className='t-faint text-center text-[13px]'>
              We&apos;ll send a reset link to your email.
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4 pt-2'>
            <div className='relative'>
              <Mail className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[color:var(--bp-ink-faint)]' />
              <input
                id='reset-email'
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder='you@example.com'
                type='email'
                className='auth-input'
              />
            </div>
            {resetStatus.type && (
              <p
                className={cn(
                  'rounded-lg px-3 py-2.5 text-[13px]',
                  resetStatus.type === 'success'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                )}
              >
                {resetStatus.message}
              </p>
            )}
            <button
              type='button'
              onClick={handleForgotPassword}
              disabled={isSubmittingReset}
              className='auth-submit-btn'
            >
              {isSubmittingReset ? (
                <>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-[#1c0c00]/20 border-t-[#1c0c00]' />
                  Sending…
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
