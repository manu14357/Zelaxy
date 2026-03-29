'use client'

import { useMemo } from 'react'
import { Command, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingPageHeader, SettingSection } from '../shared'

// ── Types ────────────────────────────────────────────────────────────────────

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  description?: string
  shortcuts: ShortcutItem[]
}

// ── Platform Detection ───────────────────────────────────────────────────────

const isMac =
  typeof navigator !== 'undefined' &&
  (navigator.platform?.toUpperCase().indexOf('MAC') >= 0 ||
    // @ts-expect-error - userAgentData is not yet in all TS lib definitions
    navigator.userAgentData?.platform === 'macOS')

const mod = isMac ? '⌘' : 'Ctrl'
const shift = isMac ? '⇧' : 'Shift'

// ── Shortcut Data ────────────────────────────────────────────────────────────

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    description: 'Available anywhere in the application.',
    shortcuts: [
      { keys: [mod, 'K'], description: 'Open search / command palette' },
      { keys: [mod, shift, 'L'], description: 'Navigate to Logs' },
      { keys: [mod, shift, 'K'], description: 'Navigate to Knowledge' },
      { keys: [mod, 'Enter'], description: 'Run workflow' },
    ],
  },
  {
    title: 'Workflow Editor',
    description: 'Shortcuts available on the workflow canvas.',
    shortcuts: [
      { keys: [shift, 'L'], description: 'Auto-layout workflow' },
      { keys: ['Delete'], description: 'Delete selected block' },
      { keys: ['Backspace'], description: 'Delete selected block' },
    ],
  },
  {
    title: 'Logs',
    description: 'Keyboard navigation in the logs viewer.',
    shortcuts: [
      { keys: ['↑'], description: 'Previous log entry' },
      { keys: ['↓'], description: 'Next log entry' },
      { keys: ['Enter'], description: 'Open / toggle log details' },
      { keys: ['Escape'], description: 'Close log sidebar or filter panel' },
    ],
  },
  {
    title: 'Chat & Copilot',
    description: 'Shortcuts inside the chat and copilot panels.',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: [shift, 'Enter'], description: 'New line' },
      { keys: ['↑'], description: 'Recall previous message (empty input)' },
      { keys: ['↓'], description: 'Recall next message (empty input)' },
    ],
  },
  {
    title: 'Folder & Workflow Management',
    description: 'Shortcuts while renaming or managing items in the sidebar.',
    shortcuts: [
      { keys: ['Enter'], description: 'Save name' },
      { keys: ['Escape'], description: 'Cancel rename' },
    ],
  },
]

// ── Key Badge Component ──────────────────────────────────────────────────────

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md px-1.5',
        'border border-border/60 bg-muted/50 font-medium text-[11px] text-muted-foreground',
        'shadow-[0_1px_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_1px_rgba(255,255,255,0.04)]'
      )}
    >
      {children}
    </kbd>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

interface ShortcutsProps {
  onOpenChange?: (open: boolean) => void
}

export function Shortcuts({ onOpenChange }: ShortcutsProps) {
  const groups = useMemo(() => SHORTCUT_GROUPS, [])

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Keyboard Shortcuts'
        description='All available keyboard shortcuts for faster navigation and actions.'
      />

      {/* Platform indicator */}
      <div className='flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-2'>
        <Command className='h-3.5 w-3.5 text-muted-foreground' />
        <span className='text-[12px] text-muted-foreground'>
          Showing shortcuts for{' '}
          <span className='font-medium text-foreground'>{isMac ? 'macOS' : 'Windows / Linux'}</span>
        </span>
      </div>

      {groups.map((group) => (
        <SettingSection
          key={group.title}
          title={group.title}
          description={group.description}
          icon={<Keyboard className='h-4 w-4' />}
        >
          <div className='divide-y divide-border/40'>
            {group.shortcuts.map((shortcut, idx) => (
              <div
                key={`${group.title}-${idx}`}
                className='flex items-center justify-between px-4 py-2.5'
              >
                <span className='text-[13px] text-foreground'>{shortcut.description}</span>
                <div className='flex items-center gap-1'>
                  {shortcut.keys.map((key, keyIdx) => (
                    <span key={keyIdx} className='flex items-center gap-1'>
                      {keyIdx > 0 && (
                        <span className='text-[10px] text-muted-foreground/50'>+</span>
                      )}
                      <KeyBadge>{key}</KeyBadge>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SettingSection>
      ))}
    </div>
  )
}
