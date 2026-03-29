'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
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
  const [callbackUrl, setCallbackUrl] = useState('/workspace')
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
          // Keep the default safe value ('/workspace')
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
      const safeCallbackUrl = validateCallbackUrl(callbackUrl) ? callbackUrl : '/workspace'

      const result = await client.signIn.email(
        {
          email,
          password,
          callbackURL: safeCallbackUrl,
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
    <div className='fade-in grid min-h-screen animate-in gap-0 duration-700 lg:grid-cols-2'>
      {/* Left Side - Branding */}
      <div className='flex flex-col items-center justify-center px-8 py-12 lg:px-16'>
        {/* Enhanced Header with Logo */}
        <div className='max-w-md space-y-8 text-center'>
          <div className='mb-8 flex justify-center'>
            <div className='group relative'>
              <div className='flex h-24 w-24 items-center justify-center'>
                <svg
                  width='80'
                  height='80'
                  viewBox='0 0 100 100'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='text-primary transition-all duration-500 group-hover:scale-110 dark:text-primary/80'
                >
                  <circle cx='50' cy='15' r='4' stroke='currentColor' strokeWidth='5' fill='none' />
                  <path
                    d='M50 15 L50 40'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M50 40 L35 20'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                  />
                  <path
                    d='M50 40 L65 20'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                  />
                  <path
                    d='M35 20 L20 45 L20 75 Q20 82 30 85 L50 85'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                  />
                  <path
                    d='M65 20 L80 45 L80 75 Q80 82 70 85 L50 85'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                  />
                  <circle cx='40' cy='55' r='4' fill='currentColor' />
                  <circle cx='60' cy='55' r='4' fill='currentColor' />
                  <path
                    d='M40 68 Q50 76 60 68'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                  />
                </svg>
              </div>
              <div className='-inset-4 absolute rounded-full bg-gradient-to-r from-primary/20 via-orange-600/20 to-primary/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100 dark:from-primary/30 dark:via-orange-400/30 dark:to-orange-400/30' />
            </div>
          </div>
          <h1 className='font-bold text-6xl tracking-tight sm:text-7xl'>
            <span className='animate-gradient bg-[length:200%_200%] bg-gradient-to-r from-primary via-orange-600 to-primary bg-clip-text text-transparent'>
              Zelaxy
            </span>
          </h1>
          <p className='text-gray-600 text-xl leading-relaxed dark:text-gray-300'>
            Welcome back! Sign in to continue building intelligent workflows that evolve with your
            needs.
          </p>

          {/* Social Login Buttons */}
          <div className='space-y-4 pt-8'>
            <SocialLoginButtons
              googleAvailable={googleAvailable}
              githubAvailable={githubAvailable}
              isProduction={isProduction}
              callbackURL={callbackUrl}
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='flex flex-col items-center justify-center border-gray-200/20 border-l bg-transparent px-8 py-12 backdrop-blur-none lg:px-16 dark:border-gray-700/20'>
        <div className='w-full max-w-md space-y-8'>
          {/* Form Header */}
          <div className='space-y-4 text-center'>
            <h2 className='font-bold text-3xl text-gray-900 dark:text-white'>Sign In</h2>
            <p className='text-gray-600 dark:text-gray-400'>
              Enter your credentials to access your account
            </p>
          </div>

          {/* Login Form */}
          <div className='relative overflow-hidden rounded-3xl border-0 bg-transparent shadow-none backdrop-blur-none'>
            {/* Floating orbs for visual interest */}
            <div className='absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-primary to-orange-400 opacity-60' />
            <div className='absolute bottom-4 left-4 h-3 w-3 animate-bounce rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-40 [animation-delay:1s] [animation-duration:3s]' />
            <div className='absolute top-1/2 left-8 h-1 w-1 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 opacity-50 [animation-delay:2s]' />

            <div className='relative p-8'>
              <form onSubmit={onSubmit} className='space-y-6'>
                <div className='space-y-5'>
                  <div className='space-y-3'>
                    <Label
                      htmlFor='email'
                      className='font-semibold text-base text-gray-700 dark:text-gray-300'
                    >
                      Email Address
                    </Label>
                    <div className='relative'>
                      <Mail className='-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-gray-400 dark:text-gray-500' />
                      <Input
                        id='email'
                        name='email'
                        placeholder='Enter your email address'
                        required
                        autoCapitalize='none'
                        autoComplete='email'
                        autoCorrect='off'
                        value={email}
                        onChange={handleEmailChange}
                        className={cn(
                          'h-14 rounded-2xl border-2 border-gray-300 bg-white/10 pl-12 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400',
                          showEmailValidationError &&
                            emailErrors.length > 0 &&
                            'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                        )}
                      />
                    </div>
                    {showEmailValidationError && emailErrors.length > 0 && (
                      <div className='slide-in-from-top-1 mt-3 animate-in space-y-2 text-red-500 text-sm duration-300'>
                        {emailErrors.map((error, index) => (
                          <p
                            key={index}
                            className='flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'
                          >
                            <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
                            <span>{error}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Label
                        htmlFor='password'
                        className='font-semibold text-base text-gray-700 dark:text-gray-300'
                      >
                        Password
                      </Label>
                      <button
                        type='button'
                        onClick={() => setForgotPasswordOpen(true)}
                        className='font-semibold text-primary text-sm underline-offset-4 transition-all duration-200 hover:scale-105 hover:text-primary hover:underline dark:text-primary/80 dark:hover:text-primary/70'
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className='relative'>
                      <Lock className='-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-gray-400 dark:text-gray-500' />
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
                          'h-14 rounded-2xl border-2 border-gray-300 bg-white/10 pr-14 pl-12 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400',
                          showValidationError &&
                            passwordErrors.length > 0 &&
                            'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                        )}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='-translate-y-1/2 absolute top-1/2 right-4 rounded-xl p-2 text-gray-400 transition-colors duration-200 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                    </div>
                    {showValidationError && passwordErrors.length > 0 && (
                      <div className='slide-in-from-top-1 mt-3 animate-in space-y-2 text-red-500 text-sm duration-300'>
                        {passwordErrors.map((error, index) => (
                          <p
                            key={index}
                            className='flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'
                          >
                            <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
                            <span>{error}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type='submit'
                  className='relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-orange-600 to-primary font-bold text-lg text-white shadow-lg transition-all duration-300 hover:from-orange-700 hover:via-orange-700 hover:to-orange-700'
                  disabled={isLoading}
                >
                  <span className='relative z-10 flex items-center justify-center space-x-3'>
                    {isLoading ? (
                      <>
                        <div className='h-6 w-6 animate-spin rounded-full border-3 border-white/30 border-t-white' />
                        <span>Signing you in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Zelaxy</span>
                        <ArrowRight className='h-6 w-6 transition-transform duration-300' />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className='space-y-4 text-center'>
            <div className='inline-flex items-center space-x-2 rounded-full border-0 bg-transparent px-6 py-3 text-gray-600 shadow-none backdrop-blur-none dark:text-gray-400'>
              <span>Don't have an account?</span>
              <Link
                href={
                  isInviteFlow ? `/signup?invite_flow=true&callbackUrl=${callbackUrl}` : '/signup'
                }
                className='font-bold text-primary underline-offset-4 transition-all duration-200 hover:scale-105 hover:text-primary hover:underline dark:text-primary/80 dark:hover:text-primary/70'
              >
                Sign up for free
              </Link>
            </div>
            <div className='flex items-center justify-center space-x-2 text-gray-500 text-sm dark:text-gray-400'>
              <Sparkles className='h-5 w-5 animate-pulse text-primary' />
              <span className='font-medium'>Start building AI workflows in seconds</span>
              <Sparkles className='h-5 w-5 animate-pulse text-purple-500 [animation-delay:0.5s]' />
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className='mx-auto max-w-md rounded-3xl border border-gray-200/10 bg-white/10 shadow-lg backdrop-blur-lg dark:border-gray-700/10 dark:bg-gray-800/10 dark:shadow-gray-900/20'>
          <DialogHeader className='space-y-4'>
            <DialogTitle className='text-center font-bold text-3xl text-gray-900 tracking-tight dark:text-white'>
              Reset Password
            </DialogTitle>
            <DialogDescription className='text-center text-gray-600 text-lg leading-relaxed dark:text-gray-300'>
              Enter your email address and we'll send you a secure link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-8 pt-6'>
            <div className='space-y-4'>
              <Label
                htmlFor='reset-email'
                className='font-semibold text-base text-gray-700 dark:text-gray-300'
              >
                Email Address
              </Label>
              <div className='relative'>
                <Mail className='-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-gray-400 dark:text-gray-500' />
                <Input
                  id='reset-email'
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder='Enter your email address'
                  required
                  type='email'
                  className='h-14 rounded-2xl border-2 border-gray-300 bg-white/10 pl-12 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400'
                />
              </div>
            </div>
            {resetStatus.type && (
              <div
                className={`slide-in-from-top-2 animate-in rounded-2xl border-2 p-4 text-base duration-300 ${
                  resetStatus.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                <div className='flex items-center space-x-3'>
                  {resetStatus.type === 'success' ? (
                    <Sparkles className='h-5 w-5 flex-shrink-0 animate-pulse' />
                  ) : (
                    <span className='h-5 w-5 flex-shrink-0 text-center text-lg'>⚠</span>
                  )}
                  <span className='font-medium'>{resetStatus.message}</span>
                </div>
              </div>
            )}
            <Button
              type='button'
              onClick={handleForgotPassword}
              className='h-14 w-full rounded-2xl bg-gradient-to-r from-primary via-orange-600 to-primary font-bold text-lg text-white shadow-lg transition-all duration-300 hover:from-orange-700 hover:via-orange-700 hover:to-orange-700'
              disabled={isSubmittingReset}
            >
              {isSubmittingReset ? (
                <div className='flex items-center justify-center space-x-3'>
                  <div className='h-6 w-6 animate-spin rounded-full border-3 border-white/30 border-t-white' />
                  <span>Sending reset link...</span>
                </div>
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
