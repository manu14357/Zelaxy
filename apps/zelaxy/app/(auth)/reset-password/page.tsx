'use client'

import { Suspense, useEffect, useState } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createLogger } from '@/lib/logs/console/logger'
import { SetNewPasswordForm } from '@/app/(auth)/reset-password/reset-password-form'

const logger = createLogger('ResetPasswordPage')

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | null
    text: string
  }>({
    type: null,
    text: '',
  })

  // Validate token presence
  useEffect(() => {
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid or missing reset token. Please request a new password reset link.',
      })
    }
  }, [token])

  const handleResetPassword = async (password: string) => {
    try {
      setIsSubmitting(true)
      setStatusMessage({ type: null, text: '' })

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reset password')
      }

      setStatusMessage({
        type: 'success',
        text: 'Password reset successful! Redirecting to login...',
      })

      // Redirect to login page after 1.5 seconds
      setTimeout(() => {
        router.push('/login?resetSuccess=true')
      }, 1500)
    } catch (error) {
      logger.error('Error resetting password:', { error })
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reset password',
      })
    } finally {
      setIsSubmitting(false)
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
            Almost there! Create a new secure password to regain access to your intelligent
            workflows.
          </p>

          <div className='flex items-center justify-center space-x-2 pt-8 text-gray-500 text-sm dark:text-gray-400'>
            <Sparkles className='h-5 w-5 animate-pulse text-primary' />
            <span className='font-medium'>Your secure workspace awaits</span>
            <Sparkles className='h-5 w-5 animate-pulse text-purple-500 [animation-delay:0.5s]' />
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className='flex flex-col items-center justify-center border-gray-200/20 border-l bg-transparent px-8 py-12 backdrop-blur-none lg:px-16 dark:border-gray-700/20'>
        <div className='w-full max-w-md space-y-8'>
          {/* Form Header */}
          <div className='space-y-4 text-center'>
            <h2 className='font-bold text-3xl text-gray-900 dark:text-white'>Reset Password</h2>
            <p className='text-gray-600 dark:text-gray-400'>
              Enter a new secure password for your account
            </p>
          </div>

          {/* Reset Password Form */}
          <div className='relative overflow-hidden rounded-3xl border-0 bg-transparent shadow-none backdrop-blur-none'>
            {/* Floating orbs for visual interest */}
            <div className='absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-primary to-orange-400 opacity-60' />
            <div className='absolute bottom-4 left-4 h-3 w-3 animate-bounce rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-40 [animation-delay:1s] [animation-duration:3s]' />
            <div className='absolute top-1/2 left-8 h-1 w-1 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 opacity-50 [animation-delay:2s]' />

            <div className='relative p-8'>
              <SetNewPasswordForm
                token={token}
                onSubmit={handleResetPassword}
                isSubmitting={isSubmitting}
                statusType={statusMessage.type}
                statusMessage={statusMessage.text}
              />
            </div>
          </div>

          {/* Back to Login Link */}
          <div className='space-y-4 text-center'>
            <div className='inline-flex items-center space-x-2 rounded-full border-0 bg-transparent px-6 py-3 text-gray-600 shadow-none backdrop-blur-none dark:text-gray-400'>
              <ArrowLeft className='h-4 w-4' />
              <Link
                href='/login'
                className='font-bold text-primary underline-offset-4 transition-all duration-200 hover:scale-105 hover:text-primary hover:underline dark:text-primary/80 dark:hover:text-primary/70'
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className='flex min-h-screen items-center justify-center'>Loading...</div>}
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
