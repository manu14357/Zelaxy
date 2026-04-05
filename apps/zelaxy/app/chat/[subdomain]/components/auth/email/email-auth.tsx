'use client'

import { type KeyboardEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { OTPInputForm } from '@/components/ui/input-otp-form'
import { getBaseUrl } from '@/lib/urls/utils'

interface EmailAuthProps {
  subdomain: string
  onAuthSuccess: () => void
  title?: string
  primaryColor?: string
}

export default function EmailAuth({
  subdomain,
  onAuthSuccess,
  title = 'chat',
  primaryColor = '#F97316',
}: EmailAuthProps) {
  // Email auth state
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // OTP verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [otpValue, setOtpValue] = useState('')

  // Handle email input key down
  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendOtp()
    }
  }

  // Handle sending OTP
  const handleSendOtp = async () => {
    setAuthError(null)
    setIsSendingOtp(true)

    try {
      const response = await fetch(`/api/chat/${subdomain}/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setAuthError(errorData.error || 'Failed to send verification code')
        return
      }

      setShowOtpVerification(true)
    } catch (error) {
      console.error('Error sending OTP:', error)
      setAuthError('An error occurred while sending the verification code')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (otp?: string) => {
    const codeToVerify = otp || otpValue

    if (!codeToVerify || codeToVerify.length !== 6) {
      return
    }

    setAuthError(null)
    setIsVerifyingOtp(true)

    try {
      const response = await fetch(`/api/chat/${subdomain}/otp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email, otp: codeToVerify }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setAuthError(errorData.error || 'Invalid verification code')
        return
      }

      onAuthSuccess()
    } catch (error) {
      console.error('Error verifying OTP:', error)
      setAuthError('An error occurred during verification')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setAuthError(null)
    setIsSendingOtp(true)

    try {
      const response = await fetch(`/api/chat/${subdomain}/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setAuthError(errorData.error || 'Failed to resend verification code')
        return
      }

      setAuthError('Verification code sent. Please check your email.')
    } catch (error) {
      console.error('Error resending OTP:', error)
      setAuthError('An error occurred while resending the verification code')
    } finally {
      setIsSendingOtp(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className='flex flex-col gap-0 overflow-hidden p-0 sm:max-w-[450px]'
        hideCloseButton
      >
        <DialogHeader className='border-b px-6 py-4'>
          <div className='flex items-center justify-center'>
            <a
              href={`${getBaseUrl()}/`}
              target='_blank'
              rel='noopener noreferrer'
              className='mb-2'
              title='Powered by Zelaxy'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-md bg-primary'>
                <img src='/Zelaxy.png' alt='Zelaxy' width={20} height={20} className='h-5 w-5' />
              </div>
            </a>
          </div>
          <DialogTitle className='text-center font-medium text-lg'>{title}</DialogTitle>
        </DialogHeader>

        <div className='p-6'>
          {!showOtpVerification ? (
            <>
              <div className='mb-4 text-center'>
                <p className='text-muted-foreground'>
                  This chat requires email verification. Please enter your email to continue.
                </p>
              </div>

              {authError && (
                <div className='mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-600 text-sm'>
                  {authError}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendOtp()
                }}
                className='space-y-4'
              >
                <div className='space-y-2'>
                  <Input
                    id='email'
                    type='email'
                    placeholder='Email address'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    disabled={isSendingOtp}
                    className='w-full'
                    autoFocus
                    autoComplete='off'
                  />
                </div>

                <Button
                  type='submit'
                  onClick={handleSendOtp}
                  disabled={!email || isSendingOtp}
                  className='w-full'
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSendingOtp ? (
                    <div className='flex items-center justify-center'>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Sending Code...
                    </div>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className='space-y-4'>
              <div className='text-center'>
                <p className='mb-1 text-muted-foreground text-sm'>
                  Enter the verification code sent to
                </p>
                <p className='break-all font-medium text-sm'>{email}</p>
              </div>

              {authError && (
                <div className='rounded-md border border-red-200 bg-red-50 p-3 text-red-600 text-sm'>
                  {authError}
                </div>
              )}

              <OTPInputForm
                onSubmit={(value) => {
                  setOtpValue(value)
                  handleVerifyOtp(value)
                }}
                isLoading={isVerifyingOtp}
                error={null}
              />

              <div className='flex items-center justify-center pt-2'>
                <button
                  type='button'
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                  className='text-primary text-sm hover:underline disabled:opacity-50'
                >
                  {isSendingOtp ? 'Sending...' : 'Resend code'}
                </button>
                <span className='mx-2 text-neutral-300 dark:text-neutral-600'>•</span>
                <button
                  type='button'
                  onClick={() => {
                    setShowOtpVerification(false)
                    setOtpValue('')
                    setAuthError(null)
                  }}
                  className='text-primary text-sm hover:underline'
                >
                  Change email
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
