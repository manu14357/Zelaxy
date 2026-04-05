'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/auth-client'
import { quickValidateEmail } from '@/lib/email/validation'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { SocialLoginButtons } from '@/app/(auth)/components/social-login-buttons'

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

// Validate callback URL to prevent open redirect vulnerabilities
const validateCallbackUrl = (url: string): boolean => {
  try {
    // If it's a relative URL, it's safe
    if (url.startsWith('/')) {
      return true
    }

    // If absolute URL, check if it belongs to the same origin
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    if (url.startsWith(currentOrigin)) {
      return true
    }

    return false
  } catch (error) {
    logger.error('Error validating callback URL:', { error, url })
    return false
  }
}

// Validate password and return array of error messages
const validatePassword = (passwordValue: string): string[] => {
  const errors: string[] = []

  if (!PASSWORD_VALIDATIONS.required.test(passwordValue)) {
    errors.push(PASSWORD_VALIDATIONS.required.message)
    return errors // Return early for required field
  }

  if (!PASSWORD_VALIDATIONS.notEmpty.test(passwordValue)) {
    errors.push(PASSWORD_VALIDATIONS.notEmpty.message)
    return errors // Return early for empty field
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

  // Initialize state for URL parameters
  const [callbackUrl, setCallbackUrl] = useState('/arena')
  const [isInviteFlow, setIsInviteFlow] = useState(false)

  // Forgot password states
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isSubmittingReset, setIsSubmittingReset] = useState(false)
  const [resetStatus, setResetStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // Email validation state
  const [email, setEmail] = useState('')
  const [emailErrors, setEmailErrors] = useState<string[]>([])
  const [showEmailValidationError, setShowEmailValidationError] = useState(false)

  // Extract URL parameters after component mounts to avoid SSR issues
  useEffect(() => {
    setMounted(true)

    // Only access search params on the client side
    if (searchParams) {
      const callback = searchParams.get('callbackUrl')
      if (callback) {
        // Validate the callbackUrl before setting it
        if (validateCallbackUrl(callback)) {
          setCallbackUrl(callback)
        } else {
          logger.warn('Invalid callback URL detected and blocked:', { url: callback })
          // Keep the default safe value ('/arena')
        }
      }

      const inviteFlow = searchParams.get('invite_flow') === 'true'
      setIsInviteFlow(inviteFlow)
    }
  }, [searchParams])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && forgotPasswordOpen) {
        handleForgotPassword()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [forgotPasswordEmail, forgotPasswordOpen])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)

    // Silently validate but don't show errors until submit
    const errors = validateEmailField(newEmail)
    setEmailErrors(errors)
    setShowEmailValidationError(false)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)

    // Silently validate but don't show errors until submit
    const errors = validatePassword(newPassword)
    setPasswordErrors(errors)
    setShowValidationError(false)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    // Validate email on submit
    const emailValidationErrors = validateEmailField(email)
    setEmailErrors(emailValidationErrors)
    setShowEmailValidationError(emailValidationErrors.length > 0)

    // Validate password on submit
    const passwordValidationErrors = validatePassword(password)
    setPasswordErrors(passwordValidationErrors)
    setShowValidationError(passwordValidationErrors.length > 0)

    // If there are validation errors, stop submission
    if (emailValidationErrors.length > 0 || passwordValidationErrors.length > 0) {
      setIsLoading(false)
      return
    }

    try {
      // Final validation before submission
      const safeCallbackUrl = validateCallbackUrl(callbackUrl) ? callbackUrl : '/arena'

      const result = await client.signIn.email(
        {
          email,
          password,
        },
        {
          onError: (ctx) => {
            console.error('Login error:', ctx.error)
            const errorMessage: string[] = ['Invalid email or password']

            if (ctx.error.code?.includes('EMAIL_NOT_VERIFIED')) {
              return
            }
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

      // Mark that the user has previously logged in
      if (typeof window !== 'undefined') {
        localStorage.setItem('has_logged_in_before', 'true')
        document.cookie = 'has_logged_in_before=true; path=/; max-age=31536000; SameSite=Lax' // 1 year expiry
      }

      // Use client-side navigation for instant redirect (no full page reload)
      router.push(safeCallbackUrl)
    } catch (err: any) {
      // Handle only the special verification case that requires a redirect
      if (err.message?.includes('not verified') || err.code?.includes('EMAIL_NOT_VERIFIED')) {
        try {
          await client.emailOtp.sendVerificationOtp({
            email,
            type: 'email-verification',
          })

          if (typeof window !== 'undefined') {
            sessionStorage.setItem('verificationEmail', email)
          }

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
      setResetStatus({
        type: 'error',
        message: 'Please enter your email address',
      })
      return
    }

    try {
      setIsSubmittingReset(true)
      setResetStatus({ type: null, message: '' })

      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to request password reset')
      }

      setResetStatus({
        type: 'success',
        message: 'Password reset link sent to your email',
      })

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
    <div className='flex min-h-screen items-center justify-center px-5 py-10 sm:px-6 sm:py-12'>
      <div className='w-full max-w-[420px] space-y-7'>
        {/* Header */}
        <div className='flex flex-col items-center space-y-3 text-center'>
          <Link href='/' className='inline-block'>
            <Image
              src='/Zelaxy.png'
              alt='Zelaxy'
              width={48}
              height={48}
              className='h-12 w-12 rounded-xl'
              priority
            />
          </Link>
          <div>
            <h1 className='font-bold text-2xl tracking-tight text-neutral-900 dark:text-white'>
              Welcome back
            </h1>
            <p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
              Sign in to continue building intelligent workflows
            </p>
          </div>
        </div>

        {/* Social Login */}
        <SocialLoginButtons
          googleAvailable={googleAvailable}
          githubAvailable={githubAvailable}
          isProduction={isProduction}
          callbackURL={callbackUrl}
        />

        {/* Divider */}
        <div className='flex items-center gap-4'>
          <div className='h-px flex-1 bg-neutral-200 dark:bg-white/10' />
          <span className='text-neutral-400 dark:text-neutral-500 text-xs uppercase tracking-wider'>or</span>
          <div className='h-px flex-1 bg-neutral-200 dark:bg-white/10' />
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className='space-y-5'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email' className='font-medium text-neutral-700 dark:text-neutral-300 text-sm'>
                Email Address
              </Label>
              <div className='relative'>
                <Mail className='-translate-y-1/2 absolute top-1/2 left-3.5 h-4 w-4 text-neutral-400 dark:text-neutral-500' />
                <Input
                  id='email'
                  name='email'
                  placeholder='you@example.com'
                  required
                  autoCapitalize='none'
                  autoComplete='email'
                  autoCorrect='off'
                  value={email}
                  onChange={handleEmailChange}
                  className={cn(
                    'h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 pl-11 text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20',
                    showEmailValidationError &&
                      emailErrors.length > 0 &&
                      'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                  )}
                />
              </div>
              {showEmailValidationError && emailErrors.length > 0 && (
                <div className='space-y-1'>
                  {emailErrors.map((error, index) => (
                    <p key={index} className='text-red-400 text-sm'>
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password' className='font-medium text-neutral-700 dark:text-neutral-300 text-sm'>
                  Password
                </Label>
                <button
                  type='button'
                  onClick={() => setForgotPasswordOpen(true)}
                  className='text-primary/80 text-sm transition-colors hover:text-primary'
                >
                  Forgot password?
                </button>
              </div>
              <div className='relative'>
                <Lock className='-translate-y-1/2 absolute top-1/2 left-3.5 h-4 w-4 text-neutral-400 dark:text-neutral-500' />
                <Input
                  id='password'
                  name='password'
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoCapitalize='none'
                  autoComplete='current-password'
                  autoCorrect='off'
                  placeholder='Enter your password'
                  value={password}
                  onChange={handlePasswordChange}
                  className={cn(
                    'h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 pr-12 pl-11 text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20',
                    showValidationError &&
                      passwordErrors.length > 0 &&
                      'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                  )}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='-translate-y-1/2 absolute top-1/2 right-3.5 text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {showValidationError && passwordErrors.length > 0 && (
                <div className='space-y-1'>
                  {passwordErrors.map((error, index) => (
                    <p key={index} className='text-red-400 text-sm'>
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            type='submit'
            className='h-11 w-full rounded-xl bg-neutral-900 font-semibold text-sm text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 dark:bg-white dark:text-black dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:bg-neutral-100'
            disabled={isLoading}
          >
            {isLoading ? (
              <span className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black' />
                Signing in...
              </span>
            ) : (
              <span className='flex items-center gap-2'>
                Sign In
                <ArrowRight className='h-4 w-4' />
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className='text-center text-neutral-500 text-sm'>
          Don&apos;t have an account?{' '}
          <Link
            href={isInviteFlow ? `/signup?invite_flow=true&callbackUrl=${callbackUrl}` : '/signup'}
            className='font-medium text-primary transition-colors hover:text-primary/80'
          >
            Sign up for free
          </Link>
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className='mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111]'>
          <DialogHeader className='space-y-2'>
            <DialogTitle className='text-center font-bold text-2xl text-neutral-900 dark:text-white'>
              Reset Password
            </DialogTitle>
            <DialogDescription className='text-center text-neutral-500 dark:text-neutral-400'>
              We&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-5 pt-4'>
            <div className='space-y-2'>
              <Label htmlFor='reset-email' className='font-medium text-neutral-700 dark:text-neutral-300 text-sm'>
                Email Address
              </Label>
              <div className='relative'>
                <Mail className='-translate-y-1/2 absolute top-1/2 left-3.5 h-4 w-4 text-neutral-400 dark:text-neutral-500' />
                <Input
                  id='reset-email'
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder='you@example.com'
                  required
                  type='email'
                  className='h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 pl-11 text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20'
                />
              </div>
            </div>
            {resetStatus.type && (
              <p
                className={`rounded-lg p-3 text-sm ${
                  resetStatus.type === 'success'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {resetStatus.message}
              </p>
            )}
            <Button
              type='button'
              onClick={handleForgotPassword}
              className='h-11 w-full rounded-xl bg-neutral-900 font-semibold text-sm text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100'
              disabled={isSubmittingReset}
            >
              {isSubmittingReset ? (
                <span className='flex items-center gap-2'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black' />
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
