import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Monitor, Moon, Palette, Sun } from 'lucide-react'
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
          <ThemeCardsSkeleton />
        ) : (
          <ThemeSegmentedControl
            value={theme}
            onChange={handleThemeChange}
            disabled={isLoading || isThemeLoading}
          />
        )}
      </SettingSection>

      {/* ── Timezone ────────────────────────────────────────────────── */}
      <SettingSection title='Timezone' description='Used for scheduled workflows and timestamps.'>
        <SettingRow label='Timezone' htmlFor='timezone-select' bordered={false}>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger
              id='timezone-select'
              className='h-8 w-full rounded-lg text-[13px] sm:w-[220px]'
            >
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

function ThemeCardsSkeleton() {
  return (
    <div className='grid w-full grid-cols-3 gap-2.5 pb-1'>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className='flex flex-col items-center gap-2 rounded-xl border-2 border-border/40 bg-muted/20 p-2'
        >
          <Skeleton className='h-12 w-full rounded-md' />
          <Skeleton className='h-3 w-10 rounded-full' />
        </div>
      ))}
    </div>
  )
}

// ── Theme Card Control ────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: 'system' as const, icon: Monitor, label: 'System' },
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
]

function ThemePreview({ theme }: { theme: 'system' | 'light' | 'dark' }) {
  if (theme === 'light') {
    return (
      <div className='h-full w-full overflow-hidden bg-white'>
        {/* Titlebar */}
        <div className='flex h-2 items-center gap-0.5 border-slate-100 border-b bg-slate-50 px-1.5'>
          <div className='h-0.5 w-0.5 rounded-full bg-slate-300' />
          <div className='h-0.5 w-0.5 rounded-full bg-slate-300' />
          <div className='h-0.5 w-0.5 rounded-full bg-slate-300' />
          <div className='ml-1 h-0.5 w-5 rounded-full bg-slate-200' />
        </div>
        {/* Sidebar + content */}
        <div className='flex h-[calc(100%-8px)]'>
          <div className='w-4 shrink-0 border-slate-100 border-r bg-slate-50'>
            <div className='mx-0.5 mt-0.5 h-0.5 w-2 rounded-full bg-orange-300' />
            <div className='mx-0.5 mt-0.5 h-0.5 w-2 rounded-full bg-slate-200' />
            <div className='mx-0.5 mt-0.5 h-0.5 w-2 rounded-full bg-slate-200' />
          </div>
          <div className='flex-1 space-y-0.5 p-1'>
            <div className='h-0.5 w-9 rounded-full bg-slate-200' />
            <div className='h-0.5 w-6 rounded-full bg-slate-100' />
            <div className='mt-0.5 h-0.5 w-11 rounded-full bg-slate-200' />
            <div className='h-0.5 w-7 rounded-full bg-slate-100' />
          </div>
        </div>
      </div>
    )
  }
  if (theme === 'dark') {
    return (
      <div className='h-full w-full overflow-hidden bg-zinc-950'>
        {/* Titlebar */}
        <div className='flex h-2 items-center gap-0.5 border-zinc-700/60 border-b bg-zinc-900 px-1.5'>
          <div className='h-0.5 w-0.5 rounded-full bg-zinc-600' />
          <div className='h-0.5 w-0.5 rounded-full bg-zinc-600' />
          <div className='h-0.5 w-0.5 rounded-full bg-zinc-600' />
          <div className='ml-1 h-0.5 w-5 rounded-full bg-zinc-700' />
        </div>
        {/* Sidebar + content */}
        <div className='flex h-[calc(100%-8px)]'>
          <div className='w-4 shrink-0 border-zinc-700/60 border-r bg-zinc-900'>
            <div className='mx-0.5 mt-0.5 h-0.5 w-2 rounded-full bg-orange-500/70' />
            <div className='mx-0.5 mt-0.5 h-0.5 w-2 rounded-full bg-zinc-700' />
            <div className='mx-0.5 mt-0.5 h-0.5 w-2 rounded-full bg-zinc-700' />
          </div>
          <div className='flex-1 space-y-0.5 p-1'>
            <div className='h-0.5 w-9 rounded-full bg-zinc-700' />
            <div className='h-0.5 w-6 rounded-full bg-zinc-800' />
            <div className='mt-0.5 h-0.5 w-11 rounded-full bg-zinc-700' />
            <div className='h-0.5 w-7 rounded-full bg-zinc-800' />
          </div>
        </div>
      </div>
    )
  }
  // System: vertically split light / dark
  return (
    <div className='relative h-full w-full overflow-hidden'>
      <div className='absolute inset-0 bg-white' />
      <div className='absolute inset-y-0 right-0 w-[49%] bg-zinc-950' />
      <div className='absolute inset-y-0 left-1/2 z-10 w-px bg-border/80' />
      {/* Titlebar */}
      <div className='relative z-20 flex h-2 items-center gap-0.5 px-1.5'>
        <div className='h-0.5 w-0.5 rounded-full bg-slate-300' />
        <div className='h-0.5 w-0.5 rounded-full bg-zinc-600' />
      </div>
      {/* Content rows — left half (light) and right half (dark) */}
      <div className='relative z-20 h-[calc(100%-8px)]'>
        <div className='absolute inset-y-0 left-0 w-1/2 space-y-0.5 p-1'>
          <div className='h-0.5 rounded-full bg-slate-200' />
          <div className='h-0.5 rounded-full bg-slate-100' />
          <div className='h-0.5 rounded-full bg-slate-200' />
        </div>
        <div className='absolute inset-y-0 right-0 w-1/2 space-y-0.5 p-1'>
          <div className='h-0.5 rounded-full bg-zinc-700' />
          <div className='h-0.5 rounded-full bg-zinc-800' />
          <div className='h-0.5 rounded-full bg-zinc-700' />
        </div>
      </div>
    </div>
  )
}

function ThemeSegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: 'system' | 'light' | 'dark'
  onChange: (value: 'system' | 'light' | 'dark') => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-3 gap-2.5 pb-1',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            disabled={disabled}
            aria-label={`Set ${option.label} theme`}
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isActive
                ? 'border-primary/60 bg-primary/5 shadow-sm'
                : 'border-border/50 bg-muted/30 hover:border-border hover:bg-muted/60'
            )}
          >
            {/* Mini app preview */}
            <div className='h-12 w-full overflow-hidden rounded-md border border-border/40 shadow-sm'>
              <ThemePreview theme={option.value} />
            </div>

            {/* Icon + label */}
            <div className='flex items-center gap-1'>
              <Icon
                className={cn(
                  'h-3 w-3 transition-colors duration-200',
                  isActive && option.value === 'light' && 'text-amber-500',
                  isActive && option.value === 'dark' && 'text-indigo-400',
                  isActive && option.value === 'system' && 'text-foreground',
                  !isActive && 'text-muted-foreground group-hover:text-foreground/60'
                )}
              />
              <span
                className={cn(
                  'font-medium text-[11px] transition-colors duration-200',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground group-hover:text-foreground/60'
                )}
              >
                {option.label}
              </span>
            </div>

            {/* Active checkmark badge */}
            {isActive && (
              <div className='-right-1 -top-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm'>
                <Check className='h-2.5 w-2.5 text-primary-foreground' />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
