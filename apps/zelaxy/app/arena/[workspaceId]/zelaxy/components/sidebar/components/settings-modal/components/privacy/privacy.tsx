'use client'

import { useState } from 'react'
import { ExternalLink, Eye, Shield, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SettingPageHeader, SettingRow, SettingSection } from '../shared'

// ── Component ────────────────────────────────────────────────────────────────

export function Privacy() {
  const [dataCollection, setDataCollection] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [crashReports, setCrashReports] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [activityTracking, setActivityTracking] = useState(false)

  const handleExportData = () => {}

  const handleDeleteAccount = () => {}

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Privacy'
        description='Control how your data is collected, used, and shared.'
      />

      {/* ── Status Banner ──────────────────────────────────────────── */}
      <div className='flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30'>
        <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60'>
          <ShieldCheck className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' />
        </span>
        <div>
          <p className='font-medium text-[13px] text-emerald-900 dark:text-emerald-100'>
            Privacy Enhanced
          </p>
          <p className='mt-0.5 text-[12px] text-emerald-700 leading-relaxed dark:text-emerald-300'>
            All telemetry and tracking has been disabled. Your data stays private and secure.
          </p>
        </div>
      </div>

      {/* ── Data Collection ────────────────────────────────────────── */}
      <SettingSection
        title='Data Collection'
        description='Control what data we collect to improve your experience.'
        icon={<Eye className='h-4 w-4' />}
      >
        <SettingRow
          label='Basic Analytics'
          description='Collect anonymous usage statistics to improve the platform.'
          htmlFor='data-collection'
        >
          <Switch
            id='data-collection'
            checked={dataCollection}
            onCheckedChange={setDataCollection}
            disabled
          />
        </SettingRow>

        <SettingRow
          label='Performance Analytics'
          description='Help us understand app performance and identify issues.'
          htmlFor='analytics'
        >
          <Switch
            id='analytics'
            checked={analyticsEnabled}
            onCheckedChange={setAnalyticsEnabled}
            disabled
          />
        </SettingRow>

        <SettingRow
          label='Crash Reports'
          description='Automatically send crash reports to help us fix bugs.'
          htmlFor='crash-reports'
          bordered={false}
        >
          <Switch id='crash-reports' checked={crashReports} onCheckedChange={setCrashReports} />
        </SettingRow>
      </SettingSection>

      {/* ── Communication ──────────────────────────────────────────── */}
      <SettingSection title='Communication' description='Choose how we communicate with you.'>
        <SettingRow
          label='Marketing Emails'
          description='Receive updates about new features and promotions.'
          htmlFor='marketing-emails'
        >
          <Switch
            id='marketing-emails'
            checked={marketingEmails}
            onCheckedChange={setMarketingEmails}
          />
        </SettingRow>

        <SettingRow
          label='Activity Notifications'
          description='Get notified about important account activity.'
          htmlFor='activity-tracking'
          bordered={false}
        >
          <Switch
            id='activity-tracking'
            checked={activityTracking}
            onCheckedChange={setActivityTracking}
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
          description='Download a copy of all your personal data and settings.'
        >
          <Button
            variant='outline'
            size='sm'
            className='h-8 rounded-lg text-[13px]'
            onClick={handleExportData}
          >
            Export
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
            onClick={handleDeleteAccount}
          >
            Delete
          </Button>
        </SettingRow>
      </SettingSection>

      {/* ── Privacy Info ───────────────────────────────────────────── */}
      <div className='rounded-xl border border-border/40 bg-muted/20 px-5 py-4'>
        <ul className='space-y-2'>
          {[
            'We never sell your personal information to third parties.',
            'Your workflow data is encrypted both in transit and at rest.',
            'You can request deletion of your data at any time.',
            'We comply with GDPR, CCPA, and other privacy regulations.',
          ].map((item) => (
            <li key={item} className='flex items-start gap-2 text-[12px] text-muted-foreground'>
              <span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40' />
              {item}
            </li>
          ))}
        </ul>
        <Button
          variant='link'
          className='mt-3 h-auto gap-1 p-0 text-[12px] text-primary/80 hover:text-primary'
        >
          Read our Privacy Policy <ExternalLink className='h-3 w-3' />
        </Button>
      </div>
    </div>
  )
}
