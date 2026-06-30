'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'
import { useVerification } from '@/app/(auth)/verify/use-verification'

interface VerifyContentProps {
  hasResendKey: boolean
  baseUrl: string
  isProduction: boolean
}

function VerificationForm({
  hasResendKey,
  isProduction,
}: {
  hasResendKey: boolean
  isProduction: boolean
}) {
  const {
    otp,
    email,
    isLoading,
    isVerified,
    isInvalidOtp,
    errorMessage,
    isOtpComplete,
    verifyCode,
    resendCode,
    handleOtpChange,
  } = useVerification({ hasResendKey, isProduction })

  const [countdown, setCountdown] = useState(0)
  const [isResendDisabled, setIsResendDisabled] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (countdown === 0 && isResendDisabled) {
      setIsResendDisabled(false)
    }
  }, [countdown, isResendDisabled])

  const handleResend = () => {
    resendCode()
    setIsResendDisabled(true)
    setCountdown(30)
  }

  return (
    <div className='auth-card flex flex-col gap-6'>
      <div className='flex flex-col items-center gap-3 text-center'>
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
          <h2 className='t-ink font-semibold text-[22px] tracking-[-0.02em]'>
            {isVerified ? 'Email Verified!' : 'Verify Your Email'}
          </h2>
          <p className='t-faint mt-1 text-[13px]'>
            {isVerified
              ? 'Your email has been verified. Redirecting…'
              : hasResendKey
                ? `Code sent to ${email || 'your email'}`
                : !isProduction
                  ? 'Dev mode — check console for code'
                  : 'Error: Invalid API key configuration'}
          </p>
        </div>
      </div>

      {!isVerified && (
        <div className='flex flex-col gap-5'>
          <p className='t-faint text-center text-[13px]'>
            Enter the 6-digit code to verify your account.
            {hasResendKey ? " Check spam if you don't see it." : ''}
          </p>

          <div className='flex justify-center'>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              disabled={isLoading}
              className={cn(isInvalidOtp ? 'border-red-500' : '')}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className='s-panel-2 b-strong t-ink border' />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {errorMessage && (
            <p className='rounded-lg bg-red-500/10 px-3 py-2.5 text-center text-[13px] text-red-400'>
              {errorMessage}
            </p>
          )}

          <button
            type='button'
            onClick={verifyCode}
            disabled={!isOtpComplete || isLoading}
            className='auth-submit-btn'
          >
            {isLoading ? (
              <>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-[#1c0c00]/20 border-t-[#1c0c00]' />
                Verifying…
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {hasResendKey && (
            <p className='t-faint text-center text-[13px]'>
              Didn&apos;t receive a code?{' '}
              {countdown > 0 ? (
                <span>
                  Resend in <span className='t-dim font-medium'>{countdown}s</span>
                </span>
              ) : (
                <button
                  type='button'
                  className='t-accent font-medium transition-opacity hover:opacity-80'
                  onClick={handleResend}
                  disabled={isLoading || isResendDisabled}
                >
                  Resend
                </button>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Fallback component while the verification form is loading
function VerificationFormFallback() {
  return (
    <div className='p-8 text-center'>
      <div className='animate-pulse'>
        <div className='mx-auto mb-4 h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800' />
        <div className='mx-auto h-4 w-64 rounded bg-neutral-200 dark:bg-neutral-800' />
      </div>
    </div>
  )
}

export function VerifyContent({ hasResendKey, baseUrl, isProduction }: VerifyContentProps) {
  return (
    <Suspense fallback={<VerificationFormFallback />}>
      <VerificationForm hasResendKey={hasResendKey} isProduction={isProduction} />
    </Suspense>
  )
}
