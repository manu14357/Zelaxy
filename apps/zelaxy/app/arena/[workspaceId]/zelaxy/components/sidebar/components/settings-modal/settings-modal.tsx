'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { isBillingEnabled } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import {
  Account,
  AdminSettings,
  ApiKeys,
  Credentials,
  EnvironmentVariables,
  General,
  MCPServers,
  Privacy,
  SettingsNavigation,
  Shortcuts,
  Subscription,
  TeamManagement,
} from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/settings-modal/components'
import { useOrganizationStore } from '@/stores/organization'
import { useGeneralStore } from '@/stores/settings/general/store'

const logger = createLogger('SettingsModal')

// ── Types ────────────────────────────────────────────────────────────────────

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SettingsSection =
  | 'general'
  | 'account'
  | 'environment'
  | 'credentials'
  | 'apikeys'
  | 'mcp'
  | 'subscription'
  | 'team'
  | 'privacy'
  | 'shortcuts'
  | 'admin'

// ── Section Registry ─────────────────────────────────────────────────────────
// Open/Closed principle: add new sections here without modifying the renderer.

interface SectionEntry {
  id: SettingsSection
  component: React.ComponentType<{ onOpenChange?: (open: boolean) => void }>
  /** When true the section is only rendered if billing is enabled. */
  requiresBilling?: boolean
}

const SECTIONS: SectionEntry[] = [
  { id: 'general', component: General },
  { id: 'account', component: Account },
  { id: 'environment', component: EnvironmentVariables },
  { id: 'credentials', component: Credentials },
  { id: 'apikeys', component: ApiKeys },
  { id: 'mcp', component: MCPServers },
  { id: 'subscription', component: Subscription, requiresBilling: true },
  { id: 'team', component: TeamManagement },
  { id: 'privacy', component: Privacy },
  { id: 'shortcuts', component: Shortcuts },
  { id: 'admin', component: AdminSettings },
]

// ── Component ────────────────────────────────────────────────────────────────

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [isLoading, setIsLoading] = useState(true)
  const loadSettings = useGeneralStore((state) => state.loadSettings)
  const { activeOrganization } = useOrganizationStore()
  const hasLoadedInitialData = useRef(false)

  // ── Data Loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadAllSettings() {
      if (!open || hasLoadedInitialData.current) return
      setIsLoading(true)
      try {
        await loadSettings()
        hasLoadedInitialData.current = true
      } catch (error) {
        logger.error('Error loading settings data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadAllSettings()
    } else {
      hasLoadedInitialData.current = false
    }
  }, [open, loadSettings])

  // ── External Open Event ──────────────────────────────────────────────────

  useEffect(() => {
    const handleOpenSettings = (event: CustomEvent<{ tab: SettingsSection }>) => {
      setActiveSection(event.detail.tab)
      onOpenChange(true)
    }
    window.addEventListener('open-settings', handleOpenSettings as EventListener)
    return () => window.removeEventListener('open-settings', handleOpenSettings as EventListener)
  }, [onOpenChange])

  // ── Guard: redirect away from billing tabs when disabled ─────────────────

  useEffect(() => {
    if (!isBillingEnabled && activeSection === 'subscription') {
      setActiveSection('general')
    }
  }, [activeSection])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSectionChange = useCallback((section: SettingsSection) => {
    setActiveSection(section)
  }, [])

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  // ── Derived ──────────────────────────────────────────────────────────────

  const visibleSections = SECTIONS.filter((s) => !s.requiresBilling || isBillingEnabled)

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 overflow-hidden border-border/50 p-0 shadow-2xl',
          'h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] rounded-none',
          'sm:h-[85vh] sm:max-h-[85vh] sm:w-[90vw] sm:max-w-[900px] sm:rounded-2xl',
          'lg:h-[80vh] lg:max-w-[1000px]'
        )}
        hideCloseButton
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <DialogHeader className='flex-shrink-0 border-border/40 border-b bg-background/80 px-3 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:px-6 sm:py-3.5'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='font-semibold text-[14px] text-foreground tracking-tight sm:text-[15px]'>
              Settings
            </DialogTitle>

            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 rounded-md transition-colors duration-150 hover:bg-muted/60'
              onClick={handleClose}
              aria-label='Close settings'
            >
              <X className='h-3.5 w-3.5 text-muted-foreground' />
            </Button>
          </div>
        </DialogHeader>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className='relative flex min-h-0 flex-1'>
          {/* Sidebar — always visible */}
          <aside className='flex w-[52px] flex-shrink-0 flex-col border-border/40 border-r bg-muted/30 sm:w-[200px] lg:w-[220px]'>
            <div className='flex-1 overflow-y-auto'>
              <SettingsNavigation
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                hasOrganization={!!activeOrganization?.id}
              />
            </div>
          </aside>

          {/* Content Area */}
          <main className='min-h-0 flex-1 overflow-y-auto bg-background'>
            <div className='min-h-full'>
              {visibleSections.map(({ id, component: SectionComponent }) => (
                <div key={id} className={cn('h-full', activeSection === id ? 'block' : 'hidden')}>
                  <SectionComponent onOpenChange={onOpenChange} />
                </div>
              ))}
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}
