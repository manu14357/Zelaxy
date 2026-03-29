'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Globe, Loader2, Search, Shield, Trash2, UserCog, Users, X } from 'lucide-react'
import { Button, Input, Switch } from '@/components/ui'
import { cn } from '@/lib/utils'
import { SettingPageHeader, SettingRow, SettingSection } from '../shared'

// ----- Types -----

interface PlatformSettings {
  id: string
  allowedSignupDomains: string | null
  disableRegistration: boolean
  requireEmailVerification: boolean
  defaultUserRole: string
  maxWorkspacesPerUser: number
  updatedAt: string
  updatedBy: string | null
}

interface UserOrg {
  id: string
  name: string | null
  role: string
}

interface PlatformUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  company: string | null
  createdAt: string
  updatedAt: string
  workspaceCount: number
  organizations: UserOrg[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

type AdminTab = 'settings' | 'users'

// ----- Main Component -----

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<AdminTab>('settings')
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/check')
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.data?.isAdmin ?? false))
      .catch(() => setIsAdmin(false))
  }, [])

  if (isAdmin === null) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 p-12 text-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted/70'>
          <Shield className='h-6 w-6 text-muted-foreground/60' />
        </div>
        <p className='font-semibold text-[15px] text-foreground'>Admin Access Required</p>
        <p className='max-w-md text-[13px] text-muted-foreground'>
          You need to be listed in the{' '}
          <code className='rounded bg-muted px-1.5 py-0.5 text-[11px]'>ADMIN_EMAILS</code>{' '}
          environment variable to access admin settings.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Admin Settings'
        description='Manage platform settings, users, and access control.'
      />

      {/* Tabs */}
      <div className='flex gap-1 border-border/50 border-b'>
        <button
          type='button'
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2 font-medium text-[13px] transition-colors',
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Globe className='h-3.5 w-3.5' />
          Platform Settings
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('users')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2 font-medium text-[13px] transition-colors',
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className='h-3.5 w-3.5' />
          All Users
        </button>
      </div>

      {activeTab === 'settings' && <PlatformSettingsTab />}
      {activeTab === 'users' && <UsersTab />}
    </div>
  )
}

// ----- Platform Settings Tab -----

function PlatformSettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Form state
  const [domains, setDomains] = useState('')
  const [disableRegistration, setDisableRegistration] = useState(false)
  const [requireEmailVerification, setRequireEmailVerification] = useState(true)
  const [maxWorkspaces, setMaxWorkspaces] = useState('10')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.success && data.data) {
        setSettings(data.data)
        setDomains(data.data.allowedSignupDomains || '')
        setDisableRegistration(data.data.disableRegistration || false)
        setRequireEmailVerification(data.data.requireEmailVerification ?? true)
        setMaxWorkspaces(String(data.data.maxWorkspacesPerUser || 10))
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedSignupDomains: domains.trim() || null,
          disableRegistration,
          requireEmailVerification,
          maxWorkspacesPerUser: Number(maxWorkspaces),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }
      setSettings(data.data)
      setSaveMessage({ type: 'success', text: 'Settings saved successfully' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings'
      setSaveMessage({ type: 'error', text: msg })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Registration Control */}
      <SettingSection
        title='Registration & Access Control'
        description='Control who can sign up and access the platform.'
        icon={<Shield className='h-4 w-4' />}
      >
        <SettingRow
          label='Disable New Registrations'
          description='When enabled, no new users can sign up.'
          htmlFor='disable-registration'
        >
          <Switch
            id='disable-registration'
            checked={disableRegistration}
            onCheckedChange={setDisableRegistration}
          />
        </SettingRow>

        <SettingRow
          label='Require Email Verification'
          description='Users must verify their email before accessing the platform.'
          htmlFor='require-email-verification'
          bordered={false}
        >
          <Switch
            id='require-email-verification'
            checked={requireEmailVerification}
            onCheckedChange={setRequireEmailVerification}
          />
        </SettingRow>
      </SettingSection>

      {/* Domain Restrictions */}
      <SettingSection
        title='Allowed Signup Domains'
        description='Only users with email addresses from these domains can sign up. Leave empty to allow all.'
        icon={<Globe className='h-4 w-4' />}
      >
        <div className='space-y-3'>
          <Input
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder='company.com, partner.org'
            className='h-9 rounded-lg font-mono text-[13px]'
          />
          {domains && (
            <div className='flex flex-wrap gap-1.5'>
              {domains
                .split(',')
                .map((d) => d.trim())
                .filter(Boolean)
                .map((domain) => (
                  <span
                    key={domain}
                    className='inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-[12px] text-primary'
                  >
                    @{domain}
                    <button
                      type='button'
                      title={`Remove ${domain}`}
                      onClick={() => {
                        const updated = domains
                          .split(',')
                          .map((d) => d.trim())
                          .filter((d) => d !== domain)
                          .join(', ')
                        setDomains(updated)
                      }}
                      className='transition-colors hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>
      </SettingSection>

      {/* Workspace Limits */}
      <SettingSection
        title='User Defaults'
        description='Default limits and settings for new users.'
        icon={<UserCog className='h-4 w-4' />}
      >
        <SettingRow
          label='Max Workspaces per User'
          description='Maximum number of workspaces a user can create.'
          bordered={false}
        >
          <Input
            type='number'
            min={1}
            max={1000}
            value={maxWorkspaces}
            onChange={(e) => setMaxWorkspaces(e.target.value)}
            className='h-8 w-20 rounded-lg text-center text-[13px]'
          />
        </SettingRow>
      </SettingSection>

      {/* Save */}
      <div className='flex items-center gap-3'>
        <Button onClick={handleSave} disabled={isSaving} className='h-8 rounded-lg text-[13px]'>
          {isSaving ? (
            <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
          ) : (
            <Check className='mr-1.5 h-3.5 w-3.5' />
          )}
          Save Settings
        </Button>
        {saveMessage && (
          <span
            className={cn(
              'text-[13px]',
              saveMessage.type === 'success' ? 'text-emerald-600' : 'text-destructive'
            )}
          >
            {saveMessage.text}
          </span>
        )}
      </div>
    </div>
  )
}

// ----- Users Tab -----

function UsersTab() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page = 1, searchQuery = '') => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data.users)
        setPagination(data.data.pagination)
      }
    } catch {
      console.error('Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => fetchUsers(1, value), 300)
    setSearchTimeout(timeout)
  }

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
      }
    } catch {
      console.error('Failed to delete user')
    } finally {
      setDeletingUserId(null)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className='space-y-4'>
      {/* Search & Stats */}
      <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
        <div className='relative w-full flex-1'>
          <Search className='-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder='Search users by name or email…'
            className='h-9 rounded-lg pl-9 text-[13px]'
          />
        </div>
        <span className='whitespace-nowrap text-[12px] text-muted-foreground'>
          {pagination.total} user{pagination.total !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className='flex items-center justify-center p-8'>
          <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
        </div>
      ) : users.length === 0 ? (
        <div className='p-8 text-center text-[13px] text-muted-foreground'>
          {search ? 'No users match your search' : 'No users found'}
        </div>
      ) : (
        <div className='overflow-hidden rounded-xl border border-border/60'>
          <div className='overflow-x-auto'>
            <table className='w-full text-[13px]'>
              <thead>
                <tr className='border-border/50 border-b bg-muted/30'>
                  <th className='px-4 py-2.5 text-left font-semibold text-[11px] text-muted-foreground uppercase tracking-wider'>
                    User
                  </th>
                  <th className='hidden px-4 py-2.5 text-left font-semibold text-[11px] text-muted-foreground uppercase tracking-wider sm:table-cell'>
                    Email
                  </th>
                  <th className='hidden px-4 py-2.5 text-center font-semibold text-[11px] text-muted-foreground uppercase tracking-wider md:table-cell'>
                    Workspaces
                  </th>
                  <th className='hidden px-4 py-2.5 text-left font-semibold text-[11px] text-muted-foreground uppercase tracking-wider lg:table-cell'>
                    Organizations
                  </th>
                  <th className='hidden px-4 py-2.5 text-left font-semibold text-[11px] text-muted-foreground uppercase tracking-wider md:table-cell'>
                    Joined
                  </th>
                  <th className='px-4 py-2.5 text-center font-semibold text-[11px] text-muted-foreground uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/30'>
                {users.map((user) => (
                  <tr key={user.id} className='transition-colors hover:bg-muted/20'>
                    <td className='px-4 py-2.5'>
                      <div className='flex items-center gap-2.5'>
                        {user.image ? (
                          <img src={user.image} alt='' className='h-7 w-7 rounded-full' />
                        ) : (
                          <div className='flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-semibold text-[11px] text-primary'>
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className='min-w-0'>
                          <p className='truncate font-medium text-foreground'>{user.name}</p>
                          <p className='truncate text-[11px] text-muted-foreground sm:hidden'>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='hidden px-4 py-2.5 text-muted-foreground sm:table-cell'>
                      <div className='flex items-center gap-1.5'>
                        {user.email}
                        {user.emailVerified && <Check className='h-3 w-3 text-emerald-500' />}
                      </div>
                    </td>
                    <td className='hidden px-4 py-2.5 text-center text-muted-foreground md:table-cell'>
                      {user.workspaceCount}
                    </td>
                    <td className='hidden px-4 py-2.5 lg:table-cell'>
                      {user.organizations.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {user.organizations.map((org) => (
                            <span
                              key={org.id}
                              className='inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[11px]'
                            >
                              {org.name || 'Unknown'}
                              <span className='ml-1 text-muted-foreground'>({org.role})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className='text-[11px] text-muted-foreground'>None</span>
                      )}
                    </td>
                    <td className='hidden px-4 py-2.5 text-[12px] text-muted-foreground md:table-cell'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-4 py-2.5 text-center'>
                      {deleteConfirm === user.id ? (
                        <div className='flex items-center justify-center gap-1'>
                          <Button
                            variant='destructive'
                            size='sm'
                            className='h-7 rounded-md text-[11px]'
                            disabled={deletingUserId === user.id}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className='h-3 w-3 animate-spin' />
                            ) : (
                              'Confirm'
                            )}
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 rounded-md text-[11px]'
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 w-7 p-0 text-muted-foreground hover:text-destructive'
                          onClick={() => setDeleteConfirm(user.id)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <p className='text-[12px] text-muted-foreground'>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='h-7 rounded-lg text-[12px]'
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1, search)}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-7 rounded-lg text-[12px]'
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1, search)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
