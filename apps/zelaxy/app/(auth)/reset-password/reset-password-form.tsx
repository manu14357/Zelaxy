'use client'

import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <form onSubmit={handleSubmit} className={className}>
      <div className='grid gap-4'>
        <div className='grid gap-2'>
          <Label
            htmlFor='reset-email'
            className='font-medium text-neutral-700 text-sm dark:text-neutral-300'
          >
            Email
          </Label>
          <Input
            id='reset-email'
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder='you@example.com'
            type='email'
            disabled={isSubmitting}
            required
            className='h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20 dark:placeholder:text-neutral-500'
          />
          <p className='text-neutral-500 text-sm'>
            We'll send a password reset link to this email address.
          </p>
        </div>

        {/* Status message display */}
        {statusType && (
          <div
            className={cn(
              'rounded-lg border p-3 text-sm',
              statusType === 'success'
                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                : 'border-red-500/20 bg-red-500/10 text-red-400'
            )}
          >
            {statusMessage}
          </div>
        )}

        <Button
          type='submit'
          disabled={isSubmitting}
          className='h-11 w-full rounded-xl bg-neutral-900 font-semibold text-sm text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </div>
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
    <form onSubmit={handleSubmit} className={className}>
      <div className='space-y-5'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label
              htmlFor='password'
              className='font-medium text-neutral-700 text-sm dark:text-neutral-300'
            >
              New Password
            </Label>
            <div className='relative'>
              <Lock className='-translate-y-1/2 absolute top-1/2 left-3.5 h-4 w-4 text-neutral-400 dark:text-neutral-500' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                autoCapitalize='none'
                autoComplete='new-password'
                autoCorrect='off'
                disabled={isSubmitting || !token}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder='Enter new password'
                className='h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 pr-12 pl-11 text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20 dark:placeholder:text-neutral-500'
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
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='confirmPassword'
              className='font-medium text-neutral-700 text-sm dark:text-neutral-300'
            >
              Confirm Password
            </Label>
            <div className='relative'>
              <Lock className='-translate-y-1/2 absolute top-1/2 left-3.5 h-4 w-4 text-neutral-400 dark:text-neutral-500' />
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                autoCapitalize='none'
                autoComplete='new-password'
                autoCorrect='off'
                disabled={isSubmitting || !token}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder='Confirm new password'
                className='h-11 rounded-xl border border-neutral-200 bg-neutral-50/50 pr-12 pl-11 text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary dark:focus:bg-white/[0.07] dark:focus:ring-primary/20 dark:placeholder:text-neutral-500'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='-translate-y-1/2 absolute top-1/2 right-3.5 text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {validationMessage && (
          <p className='rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400 text-sm'>
            {validationMessage}
          </p>
        )}

        {statusType && (
          <p
            className={cn(
              'rounded-lg p-3 text-sm',
              statusType === 'success'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            )}
          >
            {statusMessage}
          </p>
        )}

        <Button
          disabled={isSubmitting || !token}
          type='submit'
          className='h-11 w-full rounded-xl bg-neutral-900 font-semibold text-sm text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 dark:bg-white dark:text-black dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:bg-neutral-100'
        >
          {isSubmitting ? (
            <span className='flex items-center gap-2'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black' />
              Resetting password...
            </span>
          ) : (
            <span className='flex items-center gap-2'>
              Reset Password
              <ArrowRight className='h-4 w-4' />
            </span>
          )}
        </Button>
      </div>
    </form>
  )
}
