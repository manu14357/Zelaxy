'use client'

import { Suspense, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
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
    <div className='fade-in grid min-h-screen animate-in gap-0 duration-700 lg:grid-cols-2'>
      {/* Left Side - Branding */}
      <div className='flex flex-col items-center justify-center px-8 py-12 lg:px-16'>
        {/* Enhanced Header with Logo */}
        <div className='max-w-md space-y-8 text-center'>
          {/* Logo with hover effects */}
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
            Join Zelaxy to start building intelligent workflows that evolve with your needs.
          </p>

          {/* Social Login Buttons */}
          <div className='space-y-4 pt-8'>
            <SocialLoginButtons
              githubAvailable={githubAvailable}
              googleAvailable={googleAvailable}
              callbackURL={redirectUrl || '/workspace'}
              isProduction={isProduction}
            />
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className='flex flex-col items-center justify-center border-gray-200/20 border-l bg-transparent px-8 py-12 backdrop-blur-none lg:px-16 dark:border-gray-700/20'>
        <div className='w-full max-w-md space-y-8'>
          {/* Form Header */}
          <div className='space-y-4 text-center'>
            <h2 className='font-bold text-3xl text-gray-900 dark:text-white'>Create Account</h2>
            <p className='text-gray-600 dark:text-gray-400'>
              Enter your details to create a new account
            </p>
          </div>

          {/* Signup Form */}
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
                      htmlFor='name'
                      className='font-semibold text-base text-gray-700 dark:text-gray-300'
                    >
                      Full Name
                    </Label>
                    <Input
                      id='name'
                      name='name'
                      placeholder='Enter your name'
                      type='text'
                      autoCapitalize='words'
                      autoComplete='name'
                      title='Name can only contain letters, spaces, hyphens, and apostrophes'
                      value={name}
                      onChange={handleNameChange}
                      className={cn(
                        'h-14 rounded-2xl border-2 border-gray-300 bg-white/10 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400',
                        showNameValidationError &&
                          nameErrors.length > 0 &&
                          'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      )}
                    />
                    {showNameValidationError && nameErrors.length > 0 && (
                      <div className='slide-in-from-top-1 mt-3 animate-in space-y-2 text-red-500 text-sm duration-300'>
                        {nameErrors.map((error, index) => (
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
                    <Label
                      htmlFor='email'
                      className='font-semibold text-base text-gray-700 dark:text-gray-300'
                    >
                      Email Address
                    </Label>
                    <Input
                      id='email'
                      name='email'
                      placeholder='Enter your email'
                      autoCapitalize='none'
                      autoComplete='email'
                      autoCorrect='off'
                      value={email}
                      onChange={handleEmailChange}
                      className={cn(
                        'h-14 rounded-2xl border-2 border-gray-300 bg-white/10 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400',
                        (emailError || (showEmailValidationError && emailErrors.length > 0)) &&
                          'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      )}
                    />
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
                    {emailError && !showEmailValidationError && (
                      <div className='slide-in-from-top-1 mt-3 animate-in space-y-2 text-red-500 text-sm duration-300'>
                        <p className='flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
                          <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
                          <span>{emailError}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <Label
                      htmlFor='password'
                      className='font-semibold text-base text-gray-700 dark:text-gray-300'
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
                        placeholder='Enter your password'
                        autoCorrect='off'
                        value={password}
                        onChange={handlePasswordChange}
                        className='h-14 rounded-2xl border-2 border-gray-300 bg-white/10 pr-14 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400'
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
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </div>
          </div>

          {/* Sign In Link */}
          <div className='space-y-4 text-center'>
            <div className='inline-flex items-center space-x-2 rounded-full border-0 bg-transparent px-6 py-3 text-gray-600 shadow-none backdrop-blur-none dark:text-gray-400'>
              <span>Already have an account?</span>
              <Link
                href={
                  isInviteFlow ? `/login?invite_flow=true&callbackUrl=${redirectUrl}` : '/login'
                }
                className='font-bold text-primary underline-offset-4 transition-all duration-200 hover:scale-105 hover:text-primary hover:underline dark:text-primary/80 dark:hover:text-primary/70'
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
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
