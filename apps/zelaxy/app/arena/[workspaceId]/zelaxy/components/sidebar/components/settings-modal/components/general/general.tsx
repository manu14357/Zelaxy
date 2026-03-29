import { useEffect, useState } from 'react'
import { AlertTriangle, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useGeneralStore } from '@/stores/settings/general/store'
import { SettingPageHeader, SettingRow, SettingSection } from '../shared'

// ── Constants ────────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
  { value: 'Europe/Paris', label: 'CET (Central European Time)' },
  { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export function General() {
  const [retryCount, setRetryCount] = useState(0)
  const [timezone, setTimezone] = useState('UTC')
  const [autoSave, setAutoSave] = useState(true)
  const [confirmations, setConfirmations] = useState(true)

  // Store selectors — each selector subscribes to exactly its slice (perf)
  const isLoading = useGeneralStore((s) => s.isLoading)
  const error = useGeneralStore((s) => s.error)
  const theme = useGeneralStore((s) => s.theme)
  const isAutoConnectEnabled = useGeneralStore((s) => s.isAutoConnectEnabled)
  const isAutoPanEnabled = useGeneralStore((s) => s.isAutoPanEnabled)
  const isConsoleExpandedByDefault = useGeneralStore((s) => s.isConsoleExpandedByDefault)

  const isAutoConnectLoading = useGeneralStore((s) => s.isAutoConnectLoading)
  const isAutoPanLoading = useGeneralStore((s) => s.isAutoPanLoading)
  const isConsoleExpandedByDefaultLoading = useGeneralStore(
    (s) => s.isConsoleExpandedByDefaultLoading
  )
  const isThemeLoading = useGeneralStore((s) => s.isThemeLoading)

  const setTheme = useGeneralStore((s) => s.setTheme)
  const toggleAutoConnect = useGeneralStore((s) => s.toggleAutoConnect)
  const toggleAutoPan = useGeneralStore((s) => s.toggleAutoPan)
  const toggleConsoleExpandedByDefault = useGeneralStore((s) => s.toggleConsoleExpandedByDefault)
  const loadSettings = useGeneralStore((s) => s.loadSettings)

  useEffect(() => {
    loadSettings(retryCount > 0)
  }, [loadSettings, retryCount])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleThemeChange = async (value: 'system' | 'light' | 'dark') => {
    await setTheme(value)
  }

  const handleAutoConnectChange = async (checked: boolean) => {
    if (checked !== isAutoConnectEnabled && !isAutoConnectLoading) await toggleAutoConnect()
  }

  const handleAutoPanChange = async (checked: boolean) => {
    if (checked !== isAutoPanEnabled && !isAutoPanLoading) await toggleAutoPan()
  }

  const handleConsoleExpandedChange = async (checked: boolean) => {
    if (checked !== isConsoleExpandedByDefault && !isConsoleExpandedByDefaultLoading)
      await toggleConsoleExpandedByDefault()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6 px-3 py-6'>
      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription className='flex items-center justify-between'>
            <span className='text-[13px]'>Failed to load settings: {error}</span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setRetryCount((c) => c + 1)}
              disabled={isLoading}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <SettingPageHeader
        title='General'
        description='Manage your preferences, appearance, and workflow behavior.'
      />

      {/* ── Appearance ──────────────────────────────────────────────── */}
      <SettingSection
        title='Appearance'
        description='Customize the look and feel of the interface.'
        icon={<Palette className='h-4 w-4' />}
      >
        {isLoading ? (
          <SettingRowSkeleton />
        ) : (
          <SettingRow label='Theme' bordered={false}>
            <ThemeSegmentedControl
              value={theme}
              onChange={handleThemeChange}
              disabled={isLoading || isThemeLoading}
            />
          </SettingRow>
        )}
      </SettingSection>

      {/* ── Timezone ────────────────────────────────────────────────── */}
      <SettingSection title='Timezone' description='Used for scheduled workflows and timestamps.'>
        <SettingRow label='Timezone' htmlFor='timezone-select' bordered={false}>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id='timezone-select' className='h-8 w-[220px] rounded-lg text-[13px]'>
              <SelectValue placeholder='Select timezone' />
            </SelectTrigger>
            <SelectContent className='rounded-lg'>
              {TIMEZONE_OPTIONS.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingSection>

      {/* ── Workflow Behavior ───────────────────────────────────────── */}
      <SettingSection
        title='Workflow Behavior'
        description='Configure how workflows behave during execution.'
      >
        {isLoading ? (
          <>
            <SettingRowSkeleton />
            <SettingRowSkeleton />
            <SettingRowSkeleton />
          </>
        ) : (
          <>
            <SettingRow
              label='Auto-connect on drop'
              description='Automatically connect nodes when you drop them onto the canvas.'
              htmlFor='auto-connect'
            >
              <Switch
                id='auto-connect'
                checked={isAutoConnectEnabled}
                onCheckedChange={handleAutoConnectChange}
                disabled={isLoading || isAutoConnectLoading}
              />
            </SettingRow>

            <SettingRow
              label='Auto-pan during execution'
              description='Pan the canvas to follow the active block while a workflow runs.'
              htmlFor='auto-pan'
            >
              <Switch
                id='auto-pan'
                checked={isAutoPanEnabled}
                onCheckedChange={handleAutoPanChange}
                disabled={isLoading || isAutoPanLoading}
              />
            </SettingRow>

            <SettingRow
              label='Expand console entries'
              description='Show console log entries expanded by default.'
              htmlFor='console-expanded'
              bordered={false}
            >
              <Switch
                id='console-expanded'
                checked={isConsoleExpandedByDefault}
                onCheckedChange={handleConsoleExpandedChange}
                disabled={isLoading || isConsoleExpandedByDefaultLoading}
              />
            </SettingRow>
          </>
        )}
      </SettingSection>

      {/* ── System ──────────────────────────────────────────────────── */}
      <SettingSection title='System' description='System-wide preferences and safety features.'>
        <SettingRow
          label='Auto-save'
          description='Automatically save your work every few seconds to prevent data loss.'
          htmlFor='auto-save'
        >
          <Switch id='auto-save' checked={autoSave} onCheckedChange={setAutoSave} />
        </SettingRow>

        <SettingRow
          label='Show confirmations'
          description='Display confirmation dialogs for destructive actions like deleting workflows.'
          htmlFor='confirmations'
          bordered={false}
        >
          <Switch id='confirmations' checked={confirmations} onCheckedChange={setConfirmations} />
        </SettingRow>
      </SettingSection>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SettingRowSkeleton() {
  return (
    <div className='flex items-center justify-between py-3'>
      <Skeleton className='h-4 w-32 rounded-md' />
      <Skeleton className='h-5 w-10 rounded-full' />
    </div>
  )
}

// ── Theme Segmented Control ──────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: 'system' as const, icon: Monitor, label: 'System' },
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
]

function ThemeSegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: 'system' | 'light' | 'dark'
  onChange: (value: 'system' | 'light' | 'dark') => void
  disabled?: boolean
}) {
  const activeIndex = THEME_OPTIONS.findIndex((o) => o.value === value)

  return (
    <div
      className={cn(
        'relative inline-flex h-9 items-center rounded-lg bg-muted/60 p-0.5',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      {/* Animated pill background */}
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div
        role='presentation'
        className={cn(
          'absolute inset-y-0.5 rounded-md bg-background shadow-sm transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
          'w-[calc(33.333%-2px)]',
          activeIndex === 0 && 'left-[1px]',
          activeIndex === 1 && 'left-[calc(33.333%+1px)]',
          activeIndex === 2 && 'left-[calc(66.666%+1px)]'
        )}
      />

      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-[12px] transition-colors duration-200',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
            )}
            aria-label={option.label}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-all duration-300',
                isActive && option.value === 'light' && 'rotate-0 scale-100 text-amber-500',
                !isActive && option.value === 'light' && '-rotate-90 scale-75',
                isActive && option.value === 'dark' && 'rotate-0 scale-100 text-primary/80',
                !isActive && option.value === 'dark' && 'rotate-90 scale-75',
                isActive && option.value === 'system' && 'scale-100 text-foreground',
                !isActive && option.value === 'system' && 'scale-90'
              )}
            />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
