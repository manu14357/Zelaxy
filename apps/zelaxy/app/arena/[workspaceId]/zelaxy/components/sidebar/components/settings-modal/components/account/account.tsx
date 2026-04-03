'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  ChevronDown,
  Edit3,
  ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  Save,
  User,
  UserCircle,
  UserPlus,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { signOut, useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'
import { getDefaultAvatarUrl } from '@/lib/multiavatar'
import { cn } from '@/lib/utils'
import { RequestResetForm } from '@/app/(auth)/reset-password/reset-password-form'
import { clearUserData } from '@/stores'
import { useAvatarStore } from '@/stores/user/avatar-store'
import { SettingPageHeader, SettingSection } from '../shared'
import { AvatarPicker } from './avatar-picker'

const logger = createLogger('Account')

interface AccountProps {
  onOpenChange?: (open: boolean) => void
}

interface UserData {
  isLoggedIn: boolean
  name?: string
  email?: string
}

interface AccountData {
  id: string
  name: string
  email: string
  isActive?: boolean
}

export function Account({ onOpenChange }: AccountProps) {
  const router = useRouter()

  // In a real app, this would be fetched from an auth provider
  const [userData, setUserData] = useState<UserData>({
    isLoggedIn: false,
    name: '',
    email: '',
  })

  // Get session data using the client hook
  const { data: session, isPending, error } = useSession()
  const storeAvatarUrl = useAvatarStore((state) => state.avatarUrl)
  const [isLoadingUserData, _setIsLoadingUserData] = useState(false)

  // Reset password states
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [resetPasswordEmail, setResetPasswordEmail] = useState('')
  const [isSubmittingResetPassword, setIsSubmittingResetPassword] = useState(false)
  const [resetPasswordStatus, setResetPasswordStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    company: '',
    location: '',
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileUpdateStatus, setProfileUpdateStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // Mock accounts for the multi-account UI
  const [accounts, setAccounts] = useState<AccountData[]>([])
  const [open, setOpen] = useState(false)

  // Fetch complete profile data
  const fetchProfileData = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          const profile = data.user
          setProfileData({
            name: profile.name || '',
            email: profile.email || '',
            bio: profile.bio || '',
            company: profile.company || '',
            location: profile.location || '',
          })
        }
      }
    } catch (error) {
      logger.error('Error fetching profile data:', { error })
    }
  }

  // Update user data when session changes
  useEffect(() => {
    const updateUserData = async () => {
      if (!isPending && session?.user) {
        // User is logged in
        setUserData({
          isLoggedIn: true,
          name: session.user.name || 'User',
          email: session.user.email,
        })

        setAccounts([
          {
            id: '1',
            name: session.user.name || 'User',
            email: session.user.email,
            isActive: true,
          },
        ])

        // Fetch complete profile data from database
        await fetchProfileData()

        // Pre-fill the reset password email with the current user's email
        setResetPasswordEmail(session.user.email)
      } else if (!isPending) {
        // User is not logged in
        setUserData({
          isLoggedIn: false,
          name: '',
          email: '',
        })
        setAccounts([])
        setProfileData({
          name: '',
          email: '',
          bio: '',
          company: '',
          location: '',
        })
      }
    }

    updateUserData()
  }, [session, isPending])

  const handleSignIn = () => {
    // Use Next.js router to navigate to login page
    router.push('/login')
    setOpen(false)
  }

  const handleSignOut = async () => {
    try {
      // Start the sign-out process
      const signOutPromise = signOut()

      // Clear all user data to prevent persistence between accounts
      await clearUserData()

      // Set a short timeout to improve perceived performance
      // while still ensuring auth state starts to clear
      setTimeout(() => {
        router.push('/login?fromLogout=true')
      }, 100)

      // Still wait for the promise to resolve/reject to catch errors
      await signOutPromise
    } catch (error) {
      logger.error('Error signing out:', { error })
      // Still navigate even if there's an error
      router.push('/login?fromLogout=true')
    } finally {
      setOpen(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordEmail) {
      setResetPasswordStatus({
        type: 'error',
        message: 'Please enter your email address',
      })
      return
    }

    try {
      setIsSubmittingResetPassword(true)
      setResetPasswordStatus({ type: null, message: '' })

      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetPasswordEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to request password reset')
      }

      setResetPasswordStatus({
        type: 'success',
        message: 'Password reset link sent to your email',
      })

      // Close dialog after successful submission with a small delay for user to see success message
      setTimeout(() => {
        setResetPasswordDialogOpen(false)
        setResetPasswordStatus({ type: null, message: '' })
      }, 2000)
    } catch (error) {
      logger.error('Error requesting password reset:', { error })
      setResetPasswordStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to request password reset',
      })
    } finally {
      setIsSubmittingResetPassword(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!session?.user?.id) return

    try {
      setIsUpdatingProfile(true)
      setProfileUpdateStatus({ type: null, message: '' })

      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update profile'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      setProfileUpdateStatus({
        type: 'success',
        message: 'Profile updated successfully',
      })

      setIsEditingProfile(false)

      // Update local user data to reflect changes
      setUserData((prev) => ({
        ...prev,
        name: profileData.name,
        email: profileData.email,
      }))

      // Update accounts list
      setAccounts((prev) =>
        prev.map((account) =>
          account.isActive
            ? { ...account, name: profileData.name, email: profileData.email }
            : account
        )
      )

      // Refresh profile data from database to ensure we have the latest data
      await fetchProfileData()

      // Log the successful update for debugging
      logger.info('Profile updated locally', {
        profileData: profileData,
        result: result,
      })

      // Clear success message after delay
      setTimeout(() => {
        setProfileUpdateStatus({ type: null, message: '' })
      }, 3000)
    } catch (error) {
      logger.error('Error updating profile:', { error })
      setProfileUpdateStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update profile',
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleCancelProfileEdit = async () => {
    // Reset to original data by fetching from database
    await fetchProfileData()
    setIsEditingProfile(false)
    setProfileUpdateStatus({ type: null, message: '' })
  }

  const activeAccount = accounts.find((acc) => acc.isActive) || accounts[0]

  // ── Loading skeleton ───────────────────────────────────────────────────

  const AccountSkeleton = () => (
    <div className='flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4'>
      <div className='h-10 w-10 animate-pulse rounded-full bg-muted' />
      <div className='flex flex-col gap-2'>
        <div className='h-4 w-24 animate-pulse rounded-md bg-muted' />
        <div className='h-3 w-32 animate-pulse rounded-md bg-muted' />
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Account'
        description='Manage your profile, credentials, and sign-in.'
        action={
          userData.isLoggedIn && !isEditingProfile ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditingProfile(true)}
              className='h-8 rounded-lg text-[13px]'
            >
              <Edit3 className='mr-1.5 h-3.5 w-3.5' />
              Edit Profile
            </Button>
          ) : undefined
        }
      />

      {/* Status message */}
      {profileUpdateStatus.message && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-[13px]',
            profileUpdateStatus.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
          )}
        >
          {profileUpdateStatus.message}
        </div>
      )}

      {/* ── Profile Information ────────────────────────────────────── */}
      {userData.isLoggedIn && (
        <SettingSection
          title='Profile Information'
          description='Your personal details visible to your team.'
          icon={<UserCircle className='h-4 w-4' />}
        >
          {isEditingProfile ? (
            <div className='space-y-4 pt-1'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label
                    htmlFor='profile-name'
                    className='font-medium text-[12px] text-muted-foreground'
                  >
                    Full Name
                  </Label>
                  <Input
                    id='profile-name'
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder='Enter your name'
                    className='h-9 rounded-lg text-[13px]'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label
                    htmlFor='profile-email'
                    className='font-medium text-[12px] text-muted-foreground'
                  >
                    Email
                  </Label>
                  <Input
                    id='profile-email'
                    value={profileData.email}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder='Enter your email'
                    type='email'
                    className='h-9 rounded-lg text-[13px]'
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label
                    htmlFor='profile-company'
                    className='font-medium text-[12px] text-muted-foreground'
                  >
                    Company
                  </Label>
                  <Input
                    id='profile-company'
                    value={profileData.company}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, company: e.target.value }))
                    }
                    placeholder='Enter your company'
                    className='h-9 rounded-lg text-[13px]'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label
                    htmlFor='profile-location'
                    className='font-medium text-[12px] text-muted-foreground'
                  >
                    Location
                  </Label>
                  <Input
                    id='profile-location'
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder='Enter your location'
                    className='h-9 rounded-lg text-[13px]'
                  />
                </div>
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='profile-bio'
                  className='font-medium text-[12px] text-muted-foreground'
                >
                  Bio
                </Label>
                <Textarea
                  id='profile-bio'
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder='Tell us about yourself'
                  rows={3}
                  className='rounded-lg text-[13px]'
                />
              </div>
              <div className='flex justify-end gap-2 pt-1'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCancelProfileEdit}
                  disabled={isUpdatingProfile}
                  className='h-8 rounded-lg text-[13px]'
                >
                  <X className='mr-1.5 h-3.5 w-3.5' />
                  Cancel
                </Button>
                <Button
                  size='sm'
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className='h-8 rounded-lg text-[13px]'
                >
                  <Save className='mr-1.5 h-3.5 w-3.5' />
                  {isUpdatingProfile ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-0'>
              {/* Display rows */}
              <ProfileDisplayRow
                icon={<User className='h-3.5 w-3.5' />}
                label='Name'
                value={profileData.name}
              />
              <ProfileDisplayRow
                icon={<Edit3 className='h-3.5 w-3.5' />}
                label='Email'
                value={profileData.email}
              />
              <ProfileDisplayRow
                icon={<Building2 className='h-3.5 w-3.5' />}
                label='Company'
                value={profileData.company}
              />
              <ProfileDisplayRow
                icon={<MapPin className='h-3.5 w-3.5' />}
                label='Location'
                value={profileData.location}
                last={!profileData.bio}
              />
              {profileData.bio && (
                <ProfileDisplayRow
                  icon={<Edit3 className='h-3.5 w-3.5' />}
                  label='Bio'
                  value={profileData.bio}
                  last
                />
              )}
            </div>
          )}
        </SettingSection>
      )}

      {/* ── Avatar ──────────────────────────────────────────────── */}
      {userData.isLoggedIn && (
        <SettingSection
          title='Avatar'
          description='Choose a unique avatar for your profile.'
          icon={<ImageIcon className='h-4 w-4' />}
        >
          <AvatarPicker />
        </SettingSection>
      )}

      {/* ── Active Session ─────────────────────────────────────────── */}
      <SettingSection
        title='Active Session'
        description='Currently signed-in account.'
        icon={<KeyRound className='h-4 w-4' />}
      >
        {isPending || isLoadingUserData ? (
          <AccountSkeleton />
        ) : (
          <div className='space-y-0'>
            {/* Account card */}
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 p-3.5 text-left transition-colors',
                    'hover:bg-accent/40',
                    open && 'bg-accent/40'
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <div className='relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full'>
                      {userData.isLoggedIn ? (
                        <img
                          src={
                            storeAvatarUrl ||
                            session?.user?.image ||
                            getDefaultAvatarUrl(session?.user?.name || session?.user?.email)
                          }
                          alt={session?.user?.name || 'User'}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center bg-muted text-muted-foreground'>
                          <User className='h-4 w-4' />
                        </div>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <p className='truncate font-medium text-[13px] text-foreground'>
                        {userData.isLoggedIn ? activeAccount?.name : 'Sign in'}
                      </p>
                      <p className='truncate text-[12px] text-muted-foreground'>
                        {userData.isLoggedIn ? activeAccount?.email : 'Click to sign in'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                      open && 'rotate-180'
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='start'
                className='max-h-[350px] w-[min(280px,calc(100vw-4rem))] overflow-y-auto rounded-xl'
                sideOffset={6}
              >
                {userData.isLoggedIn ? (
                  <>
                    {accounts.length > 1 && (
                      <>
                        <div className='px-2 py-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider'>
                          Switch Account
                        </div>
                        {accounts.map((account) => (
                          <DropdownMenuItem
                            key={account.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-2.5 rounded-lg p-2.5',
                              account.isActive && 'bg-accent'
                            )}
                          >
                            <div className='flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full'>
                              <img
                                src={
                                  session?.user?.image ||
                                  getDefaultAvatarUrl(account.name || account.email)
                                }
                                alt={account.name || 'User'}
                                className='h-full w-full object-cover'
                              />
                            </div>
                            <div className='min-w-0'>
                              <p className='truncate font-medium text-[13px] leading-none'>
                                {account.name}
                              </p>
                              <p className='truncate text-[11px] text-muted-foreground'>
                                {account.email}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className='flex cursor-pointer items-center gap-2 rounded-lg py-2 pl-2.5 text-[13px]'
                      onClick={() => {
                        setResetPasswordDialogOpen(true)
                        setOpen(false)
                      }}
                    >
                      <Lock className='h-3.5 w-3.5' />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='flex cursor-pointer items-center gap-2 rounded-lg py-2 pl-2.5 text-[13px] text-destructive focus:text-destructive'
                      onClick={handleSignOut}
                    >
                      <LogOut className='h-3.5 w-3.5' />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    className='flex cursor-pointer items-center gap-2 rounded-lg py-2 pl-2.5 text-[13px]'
                    onClick={handleSignIn}
                  >
                    <UserPlus className='h-3.5 w-3.5' />
                    Sign in
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </SettingSection>

      {/* ── Reset Password Dialog ──────────────────────────────────── */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className='rounded-xl sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='font-semibold text-[15px]'>Reset Password</DialogTitle>
          </DialogHeader>
          <RequestResetForm
            email={resetPasswordEmail}
            onEmailChange={setResetPasswordEmail}
            onSubmit={handleResetPassword}
            isSubmitting={isSubmittingResetPassword}
            statusType={resetPasswordStatus.type}
            statusMessage={resetPasswordStatus.message}
            className='py-4'
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Profile Display Row ──────────────────────────────────────────────────

function ProfileDisplayRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  last?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 py-3', !last && 'border-border/40 border-b')}>
      <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground'>
        {icon}
      </span>
      <div className='min-w-0 flex-1'>
        <p className='font-medium text-[11px] text-muted-foreground uppercase tracking-wider'>
          {label}
        </p>
        <p className='truncate font-medium text-[13px] text-foreground'>{value || 'Not set'}</p>
      </div>
    </div>
  )
}
