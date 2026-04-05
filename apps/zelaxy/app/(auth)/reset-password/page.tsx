'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
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
              Reset Password
            </h1>
            <p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
              Create a new secure password for your account
            </p>
          </div>
        </div>

        {/* Reset Password Form */}
        <SetNewPasswordForm
          token={token}
          onSubmit={handleResetPassword}
          isSubmitting={isSubmitting}
          statusType={statusMessage.type}
          statusMessage={statusMessage.text}
        />

        {/* Back to Login */}
        <p className='text-center text-neutral-500 text-sm'>
          <Link
            href='/login'
            className='inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
            Back to login
          </Link>
        </p>
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
