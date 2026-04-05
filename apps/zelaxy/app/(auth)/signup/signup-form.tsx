'use client'

import { Suspense, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/auth-client'
import { quickValidateEmail } from '@/lib/email/validation'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { SocialLoginButtons } from '@/app/(auth)/components/social-login-buttons'

const logger = createLogger('SignupForm')

const PASSWORD_VALIDATIONS = {
  minLength: { regex: /.{8,}/, message: 'Password must be at least 8 characters long.' },
  uppercase: {
    regex: /(?=.*?[A-Z])/,
    message: 'Password must include at least one uppercase letter.',
  },
  lowercase: {
    regex: /(?=.*?[a-z])/,
    message: 'Password must include at least one lowercase letter.',
  },
  number: { regex: /(?=.*?[0-9])/, message: 'Password must include at least one number.' },
  special: {
    regex: /(?=.*?[#?!@$%^&*-])/,
    message: 'Password must include at least one special character.',
  },
}

const NAME_VALIDATIONS = {
  required: {
    test: (value: string) => Boolean(value && typeof value === 'string'),
    message: 'Name is required.',
  },
  notEmpty: {
    test: (value: string) => value.trim().length > 0,
    message: 'Name cannot be empty.',
  },
  validCharacters: {
    regex: /^[\p{L}\s\-']+$/u,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes.',
  },
  noConsecutiveSpaces: {
    regex: /^(?!.*\s\s).*$/,
    message: 'Name cannot contain consecutive spaces.',
  },
  noLeadingTrailingSpaces: {
    test: (value: string) => value === value.trim(),
    message: 'Name cannot start or end with spaces.',
  },
}

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

function SignupFormContent({
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
  const [, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [showValidationError, setShowValidationError] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailErrors, setEmailErrors] = useState<string[]>([])
  const [showEmailValidationError, setShowEmailValidationError] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('')
  const [isInviteFlow, setIsInviteFlow] = useState(false)

  // Name validation state
  const [name, setName] = useState('')
  const [nameErrors, setNameErrors] = useState<string[]>([])
  const [showNameValidationError, setShowNameValidationError] = useState(false)

  useEffect(() => {
    setMounted(true)
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }

    // Handle redirection for invitation flow
    const redirectParam = searchParams.get('redirect') || searchParams.get('callbackUrl')
    if (redirectParam) {
      setRedirectUrl(redirectParam)

      // Check if this is part of an invitation flow
      if (redirectParam.startsWith('/invite/')) {
        setIsInviteFlow(true)
      }
    }

    // Explicitly check for invite_flow parameter
    const inviteFlowParam = searchParams.get('invite_flow')
    if (inviteFlowParam === 'true') {
      setIsInviteFlow(true)
    }
  }, [searchParams])

  // Validate password and return array of error messages
  const validatePassword = (passwordValue: string): string[] => {
    const errors: string[] = []

    if (!PASSWORD_VALIDATIONS.minLength.regex.test(passwordValue)) {
      errors.push(PASSWORD_VALIDATIONS.minLength.message)
    }

    if (!PASSWORD_VALIDATIONS.uppercase.regex.test(passwordValue)) {
      errors.push(PASSWORD_VALIDATIONS.uppercase.message)
    }

    if (!PASSWORD_VALIDATIONS.lowercase.regex.test(passwordValue)) {
      errors.push(PASSWORD_VALIDATIONS.lowercase.message)
    }

    if (!PASSWORD_VALIDATIONS.number.regex.test(passwordValue)) {
      errors.push(PASSWORD_VALIDATIONS.number.message)
    }

    if (!PASSWORD_VALIDATIONS.special.regex.test(passwordValue)) {
      errors.push(PASSWORD_VALIDATIONS.special.message)
    }

    return errors
  }

  // Validate name and return array of error messages
  const validateName = (nameValue: string): string[] => {
    const errors: string[] = []

    if (!NAME_VALIDATIONS.required.test(nameValue)) {
      errors.push(NAME_VALIDATIONS.required.message)
      return errors // Return early for required field
    }

    if (!NAME_VALIDATIONS.notEmpty.test(nameValue)) {
      errors.push(NAME_VALIDATIONS.notEmpty.message)
      return errors // Return early for empty field
    }

    if (!NAME_VALIDATIONS.validCharacters.regex.test(nameValue.trim())) {
      errors.push(NAME_VALIDATIONS.validCharacters.message)
    }

    if (!NAME_VALIDATIONS.noConsecutiveSpaces.regex.test(nameValue)) {
      errors.push(NAME_VALIDATIONS.noConsecutiveSpaces.message)
    }

    if (!NAME_VALIDATIONS.noLeadingTrailingSpaces.test(nameValue)) {
      errors.push(NAME_VALIDATIONS.noLeadingTrailingSpaces.message)
    }

    return errors
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)

    // Silently validate but don't show errors
    const errors = validatePassword(newPassword)
    setPasswordErrors(errors)
    setShowValidationError(false)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)

    // Silently validate but don't show errors until submit
    const errors = validateName(newName)
    setNameErrors(errors)
    setShowNameValidationError(false)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)

    // Silently validate but don't show errors until submit
    const errors = validateEmailField(newEmail)
    setEmailErrors(errors)
    setShowEmailValidationError(false)

    // Clear any previous server-side email errors when the user starts typing
    if (emailError) {
      setEmailError('')
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const emailValue = formData.get('email') as string
    const passwordValue = formData.get('password') as string
    const name = formData.get('name') as string

    // Validate name on submit
    const nameValidationErrors = validateName(name)
    setNameErrors(nameValidationErrors)
    setShowNameValidationError(nameValidationErrors.length > 0)

    // Validate email on submit
    const emailValidationErrors = validateEmailField(emailValue)
    setEmailErrors(emailValidationErrors)
    setShowEmailValidationError(emailValidationErrors.length > 0)

    // Validate password on submit
    const errors = validatePassword(passwordValue)
    setPasswordErrors(errors)

    // Only show validation errors if there are any
    setShowValidationError(errors.length > 0)

    try {
      if (
        nameValidationErrors.length > 0 ||
        emailValidationErrors.length > 0 ||
        errors.length > 0
      ) {
        // Prioritize name errors first, then email errors, then password errors
        if (nameValidationErrors.length > 0) {
          setNameErrors([nameValidationErrors[0]])
          setShowNameValidationError(true)
        }
        if (emailValidationErrors.length > 0) {
          setEmailErrors([emailValidationErrors[0]])
          setShowEmailValidationError(true)
        }
        if (errors.length > 0) {
          setPasswordErrors([errors[0]])
          setShowValidationError(true)
        }
        setIsLoading(false)
        return
      }

      // Check if name will be truncated and warn user
      const trimmedName = name.trim()
      if (trimmedName.length > 100) {
        setNameErrors(['Name will be truncated to 100 characters. Please shorten your name.'])
        setShowNameValidationError(true)
        setIsLoading(false)
        return
      }

      const sanitizedName = trimmedName

      const response = await client.signUp.email(
        {
          email: emailValue,
          password: passwordValue,
          name: sanitizedName,
        },
        {
          onError: (ctx) => {
            logger.error('Signup error:', ctx.error)
            const errorMessage: string[] = ['Failed to create account']

            if (ctx.error.code?.includes('USER_ALREADY_EXISTS')) {
              errorMessage.push(
                'An account with this email already exists. Please sign in instead.'
              )
              setEmailError(errorMessage[0])
            } else if (
              ctx.error.code?.includes('BAD_REQUEST') ||
              ctx.error.message?.includes('Email and password sign up is not enabled')
            ) {
              errorMessage.push('Email signup is currently disabled.')
              setEmailError(errorMessage[0])
            } else if (ctx.error.code?.includes('INVALID_EMAIL')) {
              errorMessage.push('Please enter a valid email address.')
              setEmailError(errorMessage[0])
            } else if (ctx.error.code?.includes('PASSWORD_TOO_SHORT')) {
              errorMessage.push('Password must be at least 8 characters long.')
              setPasswordErrors(errorMessage)
              setShowValidationError(true)
            } else if (ctx.error.code?.includes('PASSWORD_TOO_LONG')) {
              errorMessage.push('Password must be less than 128 characters long.')
              setPasswordErrors(errorMessage)
              setShowValidationError(true)
            } else if (ctx.error.code?.includes('network')) {
              errorMessage.push('Network error. Please check your connection and try again.')
              setPasswordErrors(errorMessage)
              setShowValidationError(true)
            } else if (ctx.error.code?.includes('rate limit')) {
              errorMessage.push('Too many requests. Please wait a moment before trying again.')
              setPasswordErrors(errorMessage)
              setShowValidationError(true)
            } else {
              setPasswordErrors(errorMessage)
              setShowValidationError(true)
            }
          },
        }
      )

      if (!response || response.error) {
        setIsLoading(false)
        return
      }

      // For new signups, always require verification
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('verificationEmail', emailValue)
        localStorage.setItem('has_logged_in_before', 'true')

        // Set cookie flag for middleware check
        document.cookie = 'requiresEmailVerification=true; path=/; max-age=900; SameSite=Lax' // 15 min expiry
        document.cookie = 'has_logged_in_before=true; path=/; max-age=31536000; SameSite=Lax'

        // Store invitation flow state if applicable
        if (isInviteFlow) {
          sessionStorage.setItem('isInviteFlow', 'true')
          // Also store in cookie so it persists if user closes browser
          document.cookie = `isInviteFlow=true; path=/; max-age=3600; SameSite=Lax`
          if (redirectUrl) {
            sessionStorage.setItem('inviteRedirectUrl', redirectUrl)
            document.cookie = `inviteRedirectUrl=${encodeURIComponent(redirectUrl)}; path=/; max-age=3600; SameSite=Lax`
          }
        }
      }

      // Send verification OTP manually
      try {
        await client.emailOtp.sendVerificationOtp({
          email: emailValue,
          type: 'email-verification',
        })
      } catch (otpError) {
        logger.error('Failed to send OTP:', otpError)
        // Continue anyway - user can use resend button
      }

      // Always redirect to verification for new signups
      router.push('/verify?fromSignup=true')
    } catch (error) {
      logger.error('Signup error:', error)
      setIsLoading(false)
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
            <h1 className='font-bold text-2xl text-neutral-900 tracking-tight dark:text-white'>
              Create your account
            </h1>
            <p className='mt-1 text-neutral-500 text-sm dark:text-neutral-400'>
              Start building intelligent workflows today
            </p>
          </div>
        </div>

        {/* Social Login */}
        <SocialLoginButtons
          githubAvailable={githubAvailable}
          googleAvailable={googleAvailable}
          callbackURL={redirectUrl || '/arena'}
          isProduction={isProduction}
        />

        {/* Divider */}
        <div className='flex items-center gap-4'>
          <div className='h-px flex-1 bg-neutral-200 dark:bg-white/10' />
          <span className='text-neutral-400 text-xs uppercase tracking-wider dark:text-neutral-500'>
            or
          </span>
          <div className='h-px flex-1 bg-neutral-200 dark:bg-white/10' />
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className='space-y-5'>
          <div className='space-y-4'>
            {/* Name */}
            <div className='space-y-2'>
              <Label
                htmlFor='name'
                className='font-medium text-neutral-700 text-sm dark:text-neutral-300'
              >
                Full Name
              </Label>
              <Input
                id='name'
                name='name'
                placeholder='Your name'
                type='text'
                autoCapitalize='words'
                autoComplete='name'
                title='Name can only contain letters, spaces, hyphens, and apostrophes'
                value={name}
                onChange={handleNameChange}
                className={cn(
                  'h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20 dark:placeholder:text-neutral-500',
                  showNameValidationError &&
                    nameErrors.length > 0 &&
                    'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                )}
              />
              {showNameValidationError && nameErrors.length > 0 && (
                <div className='space-y-1'>
                  {nameErrors.map((error, index) => (
                    <p key={index} className='text-red-400 text-sm'>
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Email */}
            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='font-medium text-neutral-700 text-sm dark:text-neutral-300'
              >
                Email Address
              </Label>
              <Input
                id='email'
                name='email'
                placeholder='you@example.com'
                autoCapitalize='none'
                autoComplete='email'
                autoCorrect='off'
                value={email}
                onChange={handleEmailChange}
                className={cn(
                  'h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20 dark:placeholder:text-neutral-500',
                  (emailError || (showEmailValidationError && emailErrors.length > 0)) &&
                    'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                )}
              />
              {showEmailValidationError && emailErrors.length > 0 && (
                <div className='space-y-1'>
                  {emailErrors.map((error, index) => (
                    <p key={index} className='text-red-400 text-sm'>
                      {error}
                    </p>
                  ))}
                </div>
              )}
              {emailError && !showEmailValidationError && (
                <p className='text-red-400 text-sm'>{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='font-medium text-neutral-700 text-sm dark:text-neutral-300'
              >
                Password
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoCapitalize='none'
                  autoComplete='new-password'
                  placeholder='Min. 8 characters'
                  autoCorrect='off'
                  value={password}
                  onChange={handlePasswordChange}
                  className='h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 pr-12 text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20 dark:placeholder:text-neutral-500'
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
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className='text-center text-neutral-500 text-sm'>
          Already have an account?{' '}
          <Link
            href={isInviteFlow ? `/login?invite_flow=true&callbackUrl=${redirectUrl}` : '/login'}
            className='font-medium text-primary transition-colors hover:text-primary/80'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage({
  githubAvailable,
  googleAvailable,
  isProduction,
}: {
  githubAvailable: boolean
  googleAvailable: boolean
  isProduction: boolean
}) {
  return (
    <Suspense
      fallback={<div className='flex h-screen items-center justify-center'>Loading...</div>}
    >
      <SignupFormContent
        githubAvailable={githubAvailable}
        googleAvailable={googleAvailable}
        isProduction={isProduction}
      />
    </Suspense>
  )
}
