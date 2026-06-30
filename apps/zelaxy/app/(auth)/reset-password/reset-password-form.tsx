'use client'

import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RequestResetFormProps {
  email: string
  onEmailChange: (email: string) => void
  onSubmit: (email: string) => Promise<void>
  isSubmitting: boolean
  statusType: 'success' | 'error' | null
  statusMessage: string
  className?: string
}

export function RequestResetForm({
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  statusType,
  statusMessage,
  className,
}: RequestResetFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(email)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4', className)}>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='reset-email' className='t-dim font-medium text-[13px]'>
          Email
        </label>
        <input
          id='reset-email'
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder='you@example.com'
          type='email'
          disabled={isSubmitting}
          required
          className='auth-input !pl-3'
        />
        <p className='t-faint text-[12px]'>We&apos;ll send a password reset link to this email.</p>
      </div>

      {statusType && (
        <p
          className={cn(
            'rounded-lg px-3 py-2.5 text-[13px]',
            statusType === 'success'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          )}
        >
          {statusMessage}
        </p>
      )}

      <button type='submit' disabled={isSubmitting} className='auth-submit-btn'>
        {isSubmitting ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            Sending…
          </>
        ) : (
          'Send Reset Link'
        )}
      </button>
    </form>
  )
}

interface SetNewPasswordFormProps {
  token: string | null
  onSubmit: (password: string) => Promise<void>
  isSubmitting: boolean
  statusType: 'success' | 'error' | null
  statusMessage: string
  className?: string
}

export function SetNewPasswordForm({
  token,
  onSubmit,
  isSubmitting,
  statusType,
  statusMessage,
  className,
}: SetNewPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation
    if (password.length < 8) {
      setValidationMessage('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setValidationMessage('Passwords do not match')
      return
    }

    setValidationMessage('')
    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4', className)}>
      {/* New password */}
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='password' className='t-dim font-medium text-[13px]'>
          New Password
        </label>
        <div className='relative'>
          <input
            id='password'
            type={showPassword ? 'text' : 'password'}
            autoCapitalize='none'
            autoComplete='new-password'
            disabled={isSubmitting || !token}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder='Enter new password'
            className='auth-input !pl-3 pr-11'
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='-translate-y-1/2 t-faint hover:t-dim absolute top-1/2 right-3 transition-colors'
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='confirmPassword' className='t-dim font-medium text-[13px]'>
          Confirm Password
        </label>
        <div className='relative'>
          <input
            id='confirmPassword'
            type={showConfirmPassword ? 'text' : 'password'}
            autoCapitalize='none'
            autoComplete='new-password'
            disabled={isSubmitting || !token}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder='Confirm new password'
            className='auth-input !pl-3 pr-11'
          />
          <button
            type='button'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className='-translate-y-1/2 t-faint hover:t-dim absolute top-1/2 right-3 transition-colors'
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {validationMessage && (
        <p className='rounded-lg bg-red-500/10 px-3 py-2.5 text-[13px] text-red-400'>
          {validationMessage}
        </p>
      )}

      {statusType && (
        <p
          className={cn(
            'rounded-lg px-3 py-2.5 text-[13px]',
            statusType === 'success'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          )}
        >
          {statusMessage}
        </p>
      )}

      <button disabled={isSubmitting || !token} type='submit' className='auth-submit-btn'>
        {isSubmitting ? (
          <>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-[#1c0c00]/20 border-t-[#1c0c00]' />
            Resetting…
          </>
        ) : (
          <>
            Reset Password <ArrowRight className='h-4 w-4' />
          </>
        )}
      </button>
    </form>
  )
}
