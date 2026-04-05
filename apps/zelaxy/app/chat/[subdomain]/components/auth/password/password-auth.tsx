'use client'

import { type KeyboardEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getBaseUrl } from '@/lib/urls/utils'

interface PasswordAuthProps {
  subdomain: string
  onAuthSuccess: () => void
  title?: string
  primaryColor?: string
}

export default function PasswordAuth({
  subdomain,
  onAuthSuccess,
  title = 'chat',
  primaryColor = '#F97316',
}: PasswordAuthProps) {
  // Password auth state
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Handle keyboard input for auth forms
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAuthenticate()
    }
  }

  // Handle authentication
  const handleAuthenticate = async () => {
    if (!password.trim()) {
      setAuthError('Password is required')
      return
    }

    setAuthError(null)
    setIsAuthenticating(true)

    try {
      const payload = { password }

      const response = await fetch(`/api/chat/${subdomain}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setAuthError(errorData.error || 'Authentication failed')
        return
      }

      // Authentication successful, notify parent
      onAuthSuccess()

      // Reset auth state
      setPassword('')
    } catch (error) {
      console.error('Authentication error:', error)
      setAuthError('An error occurred during authentication')
    } finally {
      setIsAuthenticating(false)
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
          <div className='mb-4 text-center'>
            <p className='text-muted-foreground'>
              This chat is password-protected. Please enter the password to continue.
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
              handleAuthenticate()
            }}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Enter password'
                disabled={isAuthenticating}
                autoComplete='new-password'
                className='w-full'
                autoFocus
              />
            </div>

            <Button
              type='submit'
              disabled={!password || isAuthenticating}
              className='w-full'
              style={{ backgroundColor: primaryColor }}
            >
              {isAuthenticating ? (
                <div className='flex items-center justify-center'>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Authenticating...
                </div>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
