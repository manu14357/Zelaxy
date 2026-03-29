'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { client, useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'
import { generateAvatarOptions, getDefaultAvatarUrl, isMultiavatarUrl } from '@/lib/multiavatar'
import { cn } from '@/lib/utils'
import { useAvatarStore } from '@/stores/user/avatar-store'

const logger = createLogger('AvatarPicker')

interface AvatarPickerProps {
  /** Called after a successful avatar save with the new image URL */
  onAvatarUpdated?: (imageUrl: string) => void
}

export function AvatarPicker({ onAvatarUpdated }: AvatarPickerProps) {
  const { data: session, refetch: refetchSession } = useSession()
  const { avatarUrl: storeAvatarUrl, setAvatarUrl } = useAvatarStore()
  const [avatarOptions, setAvatarOptions] = useState<string[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const userSeed = session?.user?.name || session?.user?.email || 'user'

  // Generate avatar options
  const refreshAvatars = useCallback(() => {
    setIsRefreshing(true)
    const options = generateAvatarOptions(userSeed, 8)
    setAvatarOptions(options)
    setSelectedAvatar(null)
    // Brief animation delay
    setTimeout(() => setIsRefreshing(false), 300)
  }, [userSeed])

  // Initialize on mount — prefer store override over session image
  useEffect(() => {
    if (session?.user) {
      setCurrentAvatar(storeAvatarUrl || session.user.image || null)
      refreshAvatars()
    }
  }, [session?.user?.id])

  // Keep currentAvatar in sync with global store updates
  useEffect(() => {
    if (storeAvatarUrl) setCurrentAvatar(storeAvatarUrl)
  }, [storeAvatarUrl])

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url === selectedAvatar ? null : url)
    setSaveStatus({ type: null, message: '' })
  }

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return

    try {
      setIsSaving(true)
      setSaveStatus({ type: null, message: '' })

      const { error } = await client.updateUser({ image: selectedAvatar })

      if (error) {
        throw new Error(error.message || 'Failed to update avatar')
      }

      setCurrentAvatar(selectedAvatar)
      setAvatarUrl(selectedAvatar)
      setSelectedAvatar(null)
      setSaveStatus({ type: 'success', message: 'Avatar updated successfully.' })
      onAvatarUpdated?.(selectedAvatar)

      // Refresh the session so session.user.image is updated in the cache
      // This prevents the avatar reverting to old value on page reload
      await refetchSession()

      // Clear success message after delay
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 4000)
    } catch (error) {
      logger.error('Error saving avatar:', { error })
      setSaveStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save avatar',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const hasOAuthImage = session?.user?.image && !isMultiavatarUrl(session.user.image)

  return (
    <div className='space-y-4'>
      {/* Current Avatar Display */}
      <div className='flex items-center gap-4'>
        <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-border/60 bg-muted/30 shadow-sm'>
          {currentAvatar ? (
            <img src={currentAvatar} alt='Current avatar' className='h-full w-full object-cover' />
          ) : (
            <img
              src={getDefaultAvatarUrl(userSeed)}
              alt='Default avatar'
              className='h-full w-full object-cover'
            />
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <p className='font-medium text-[13px] text-foreground'>
            {currentAvatar ? 'Your current avatar' : 'No avatar set'}
          </p>
          <p className='mt-0.5 text-[12px] text-muted-foreground'>
            {hasOAuthImage
              ? 'Using your sign-in provider avatar. Pick a custom one below.'
              : 'Select an avatar from the options below or refresh for more.'}
          </p>
        </div>
      </div>

      {/* Avatar Grid */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between'>
          <p className='font-semibold text-[11px] text-muted-foreground/70 uppercase tracking-wider'>
            Choose an avatar
          </p>
          <Button
            variant='ghost'
            size='sm'
            onClick={refreshAvatars}
            disabled={isRefreshing}
            className='h-7 gap-1.5 rounded-lg px-2.5 text-[11px] text-muted-foreground hover:text-foreground'
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
            Shuffle
          </Button>
        </div>

        <div className='grid grid-cols-4 gap-2.5'>
          {avatarOptions.map((url, index) => {
            const isSelected = selectedAvatar === url
            const isCurrent = currentAvatar === url

            return (
              <button
                key={`${url}-${index}`}
                onClick={() => handleSelectAvatar(url)}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200',
                  isSelected
                    ? 'border-primary shadow-md shadow-primary/20 ring-2 ring-primary/20'
                    : isCurrent
                      ? 'border-emerald-500 shadow-sm'
                      : 'border-border/60'
                )}
              >
                <img
                  src={url}
                  alt={`Avatar option ${index + 1}`}
                  className='h-full w-full object-cover p-1.5'
                  loading='lazy'
                />
                {/* Selection indicator */}
                {isSelected && (
                  <div className='absolute inset-0 flex items-center justify-center bg-primary/10'>
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/100 shadow-sm'>
                      <Check className='h-3.5 w-3.5 text-white' />
                    </div>
                  </div>
                )}
                {/* Current indicator */}
                {isCurrent && !isSelected && (
                  <div className='absolute right-1 bottom-1'>
                    <div className='flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 shadow-sm'>
                      <Check className='h-2.5 w-2.5 text-white' />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status Message */}
      {saveStatus.message && (
        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-[12px]',
            saveStatus.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
          )}
        >
          {saveStatus.message}
        </div>
      )}

      {/* Save Button */}
      {selectedAvatar && (
        <div className='flex justify-end'>
          <Button
            size='sm'
            onClick={handleSaveAvatar}
            disabled={isSaving}
            className='h-8 gap-1.5 rounded-lg px-4 text-[13px]'
          >
            <Sparkles className='h-3.5 w-3.5' />
            {isSaving ? 'Saving…' : 'Set as Avatar'}
          </Button>
        </div>
      )}
    </div>
  )
}
