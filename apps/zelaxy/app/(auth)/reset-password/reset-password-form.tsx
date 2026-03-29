'use client'

import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Sparkles } from 'lucide-react'
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
          <Label htmlFor='reset-email'>Email</Label>
          <Input
            id='reset-email'
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder='your@email.com'
            type='email'
            disabled={isSubmitting}
            required
            className='placeholder:text-white/60'
          />
          <p className='text-muted-foreground text-sm'>
            We'll send a password reset link to this email address.
          </p>
        </div>

        {/* Status message display */}
        {statusType && (
          <div
            className={cn(
              'rounded-md border p-3 text-sm',
              statusType === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {statusMessage}
          </div>
        )}

        <Button type='submit' disabled={isSubmitting} className='w-full'>
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
      <div className='space-y-6'>
        <div className='space-y-5'>
          <div className='space-y-3'>
            <Label
              htmlFor='password'
              className='font-semibold text-base text-gray-700 dark:text-gray-300'
            >
              New Password
            </Label>
            <div className='relative'>
              <Lock className='-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-gray-400 dark:text-gray-500' />
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
                className={cn(
                  'h-14 rounded-2xl border-2 border-gray-300 bg-white/10 pr-14 pl-12 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400'
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
          </div>

          <div className='space-y-3'>
            <Label
              htmlFor='confirmPassword'
              className='font-semibold text-base text-gray-700 dark:text-gray-300'
            >
              Confirm Password
            </Label>
            <div className='relative'>
              <Lock className='-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-gray-400 dark:text-gray-500' />
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
                className={cn(
                  'h-14 rounded-2xl border-2 border-gray-300 bg-white/10 pr-14 pl-12 text-base text-gray-900 backdrop-blur-none transition-all duration-300 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900/10 dark:text-white dark:placeholder:text-gray-400'
                )}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='-translate-y-1/2 absolute top-1/2 right-4 rounded-xl p-2 text-gray-400 transition-colors duration-200 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>
        </div>

        {validationMessage && (
          <div className='slide-in-from-top-1 mt-3 animate-in space-y-2 text-red-500 text-sm duration-300'>
            <p className='flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
              <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
              <span>{validationMessage}</span>
            </p>
          </div>
        )}

        {statusType && (
          <div
            className={cn(
              'slide-in-from-top-2 animate-in rounded-2xl border-2 p-4 text-base duration-300',
              statusType === 'success'
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
            )}
          >
            <div className='flex items-center space-x-3'>
              {statusType === 'success' ? (
                <Sparkles className='h-5 w-5 flex-shrink-0 animate-pulse' />
              ) : (
                <span className='h-5 w-5 flex-shrink-0 text-center text-lg'>⚠</span>
              )}
              <span className='font-medium'>{statusMessage}</span>
            </div>
          </div>
        )}

        <Button
          disabled={isSubmitting || !token}
          type='submit'
          className='relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-orange-600 to-primary font-bold text-lg text-white shadow-lg transition-all duration-300 hover:from-orange-700 hover:via-orange-700 hover:to-orange-700'
        >
          <span className='relative z-10 flex items-center justify-center space-x-3'>
            {isSubmitting ? (
              <>
                <div className='h-6 w-6 animate-spin rounded-full border-3 border-white/30 border-t-white' />
                <span>Resetting password...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowRight className='h-6 w-6 transition-transform duration-300' />
              </>
            )}
          </span>
        </Button>
      </div>
    </form>
  )
}
