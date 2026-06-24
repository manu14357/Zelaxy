'use client'

import { useEffect, useState } from 'react'
import { Download, ExternalLink, Eye, Loader2, Mail, Shield, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { signOut, useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { useGeneralStore } from '@/stores/settings/general/store'
import { SettingPageHeader, SettingRow, SettingSection } from '../shared'

const logger = createLogger('PrivacySettings')

// ── Component ────────────────────────────────────────────────────────────────

export function Privacy() {
  const router = useRouter()
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? ''

  // Real, persisted settings (telemetry → DB; email opt-outs → DB emailPreferences).
  const telemetryEnabled = useGeneralStore((s) => s.telemetryEnabled)
  const setTelemetryEnabled = useGeneralStore((s) => s.setTelemetryEnabled)
  const emailPreferences = useGeneralStore((s) => s.emailPreferences)
  const setEmailPreference = useGeneralStore((s) => s.setEmailPreference)
  const loadSettings = useGeneralStore((s) => s.loadSettings)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/users/me/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'zelaxy-data-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Data export failed:', { error })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/users/me/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Account deletion failed')
      }
      // Account is gone — sign out and bounce to login.
      await signOut().catch(() => {})
      router.push('/login?fromLogout=true')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Account deletion failed')
      setDeleting(false)
    }
  }

  const canConfirmDelete =
    confirmEmail.trim().length > 0 && confirmEmail.trim().toLowerCase() === userEmail.toLowerCase()

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Privacy'
        description='Control how your data is collected, used, and shared.'
      />

      {/* ── Status Banner — reflects the ACTUAL telemetry setting ───── */}
      {telemetryEnabled ? (
        <div className='flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4'>
          <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted'>
            <Eye className='h-3.5 w-3.5 text-muted-foreground' />
          </span>
          <div>
            <p className='font-medium text-[13px] text-foreground'>Usage analytics is on</p>
            <p className='mt-0.5 text-[12px] text-muted-foreground leading-relaxed'>
              Anonymous usage data helps improve the platform. No workflow content is ever
              collected. You can turn this off below.
            </p>
          </div>
        </div>
      ) : (
        <div className='flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30'>
          <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60'>
            <ShieldCheck className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' />
          </span>
          <div>
            <p className='font-medium text-[13px] text-emerald-900 dark:text-emerald-100'>
              Privacy Enhanced
            </p>
            <p className='mt-0.5 text-[12px] text-emerald-700 leading-relaxed dark:text-emerald-300'>
              Usage analytics is off. Your data stays private and secure.
            </p>
          </div>
        </div>
      )}

      {/* ── Data Collection ────────────────────────────────────────── */}
      <SettingSection
        title='Data Collection'
        description='Control what anonymous data we collect to improve your experience.'
        icon={<Eye className='h-4 w-4' />}
      >
        <SettingRow
          label='Usage analytics'
          description='Share anonymous usage and performance data. No workflow content is collected.'
          htmlFor='telemetry'
          bordered={false}
        >
          <Switch id='telemetry' checked={telemetryEnabled} onCheckedChange={setTelemetryEnabled} />
        </SettingRow>
      </SettingSection>

      {/* ── Email Preferences ──────────────────────────────────────── */}
      <SettingSection
        title='Email Preferences'
        description='Choose which emails you receive from us.'
        icon={<Mail className='h-4 w-4' />}
      >
        <SettingRow
          label='Product updates'
          description='New features, improvements, and release notes.'
          htmlFor='emails-updates'
        >
          <Switch
            id='emails-updates'
            checked={!emailPreferences.unsubscribeUpdates}
            onCheckedChange={(checked) => setEmailPreference('unsubscribeUpdates', !checked)}
          />
        </SettingRow>

        <SettingRow
          label='Marketing emails'
          description='Tips, offers, and promotional content.'
          htmlFor='emails-marketing'
        >
          <Switch
            id='emails-marketing'
            checked={!emailPreferences.unsubscribeMarketing}
            onCheckedChange={(checked) => setEmailPreference('unsubscribeMarketing', !checked)}
          />
        </SettingRow>

        <SettingRow
          label='Activity notifications'
          description='Important account and workflow activity.'
          htmlFor='emails-notifications'
          bordered={false}
        >
          <Switch
            id='emails-notifications'
            checked={!emailPreferences.unsubscribeNotifications}
            onCheckedChange={(checked) => setEmailPreference('unsubscribeNotifications', !checked)}
          />
        </SettingRow>
      </SettingSection>

      {/* ── Data Management ────────────────────────────────────────── */}
      <SettingSection
        title='Data Management'
        description='Export or delete your personal data.'
        icon={<Shield className='h-4 w-4' />}
      >
        <SettingRow
          label='Export Your Data'
          description='Download a copy of your profile, settings, and workflows as JSON.'
        >
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 rounded-lg text-[13px]'
            onClick={handleExportData}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <Download className='h-3.5 w-3.5' />
            )}
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
        </SettingRow>

        <SettingRow
          label='Delete Account'
          description='Permanently delete your account and all associated data.'
          bordered={false}
        >
          <Button
            variant='outline'
            size='sm'
            className='h-8 rounded-lg border-destructive/30 text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive'
            onClick={() => {
              setConfirmEmail('')
              setDeleteError(null)
              setDeleteOpen(true)
            }}
          >
            Delete
          </Button>
        </SettingRow>
      </SettingSection>

      {/* ── Privacy Info ───────────────────────────────────────────── */}
      <div className='rounded-xl border border-border/40 bg-muted/20 px-3 py-4 sm:px-5'>
        <ul className='space-y-2'>
          {[
            'We never sell your personal information to third parties.',
            'Your workflow data is encrypted both in transit and at rest.',
            'You can export or request deletion of your data at any time.',
            'We comply with GDPR, CCPA, and other privacy regulations.',
          ].map((item) => (
            <li key={item} className='flex items-start gap-2 text-[12px] text-muted-foreground'>
              <span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40' />
              {item}
            </li>
          ))}
        </ul>
        <a
          href='https://zelaxy.in/privacy'
          target='_blank'
          rel='noopener noreferrer'
          className='mt-3 inline-flex h-auto items-center gap-1 p-0 text-[12px] text-primary/80 hover:text-primary'
        >
          Read our Privacy Policy <ExternalLink className='h-3 w-3' />
        </a>
      </div>

      {/* ── Delete confirmation ────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and <strong>all</strong> your data — workflows,
              settings, credentials, and more. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <p className='text-[13px] text-muted-foreground'>
              Type <span className='font-medium text-foreground'>{userEmail}</span> to confirm.
            </p>
            <Input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder='Enter your email'
              autoComplete='off'
              className={cn(deleteError && 'border-destructive')}
            />
            {deleteError && <p className='text-[12px] text-destructive'>{deleteError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={handleDeleteAccount}
              disabled={deleting || !canConfirmDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' /> Deleting…
                </>
              ) : (
                'Delete permanently'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
