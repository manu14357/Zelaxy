'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, LayoutDashboard, ScrollText, Settings, Shapes } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isBillingEnabled } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { Knowledge } from '@/app/arena/[workspaceId]/knowledge/knowledge'
import Logs from '@/app/arena/[workspaceId]/logs/logs'
import type { Template } from '@/app/arena/[workspaceId]/templates/templates'
import Templates from '@/app/arena/[workspaceId]/templates/templates'
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

const logger = createLogger('Hub')

// ── Settings Section Registry ────────────────────────────────────────────────

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

interface SectionEntry {
  id: SettingsSection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
  requiresBilling?: boolean
}

const SETTINGS_SECTIONS: SectionEntry[] = [
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

// ── Hub Props ────────────────────────────────────────────────────────────────

interface HubProps {
  initialTemplates: Template[]
  currentUserId: string
}

// ── Tab Definitions ──────────────────────────────────────────────────────────

const tabs = [
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'templates', label: 'Templates', icon: Shapes },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type TabId = (typeof tabs)[number]['id']

// ── Component ────────────────────────────────────────────────────────────────

export function Hub({ initialTemplates, currentUserId }: HubProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(
    tabFromUrl && tabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'logs'
  )
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('general')
  const [isSettingsLoading, setIsSettingsLoading] = useState(true)
  const loadSettings = useGeneralStore((state) => state.loadSettings)
  const { activeOrganization } = useOrganizationStore()
  const hasLoadedSettings = useRef(false)

  // Sync tab from URL query parameter
  useEffect(() => {
    if (tabFromUrl && tabs.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // Update URL when tab changes so back/forward navigation works
  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  // Load settings data when settings tab is first activated
  useEffect(() => {
    if (activeTab !== 'settings' || hasLoadedSettings.current) return

    async function load() {
      setIsSettingsLoading(true)
      try {
        await loadSettings()
        hasLoadedSettings.current = true
      } catch (error) {
        logger.error('Error loading settings:', error)
      } finally {
        setIsSettingsLoading(false)
      }
    }

    load()
  }, [activeTab, loadSettings])

  // Listen for external open-settings events
  useEffect(() => {
    const handleOpenSettings = (event: CustomEvent<{ tab: SettingsSection }>) => {
      handleTabChange('settings')
      setActiveSettingsSection(event.detail.tab)
    }
    window.addEventListener('open-settings', handleOpenSettings as EventListener)
    return () => window.removeEventListener('open-settings', handleOpenSettings as EventListener)
  }, [])

  // Guard: redirect away from billing section when disabled
  useEffect(() => {
    if (!isBillingEnabled && activeSettingsSection === 'subscription') {
      setActiveSettingsSection('general')
    }
  }, [activeSettingsSection])

  const handleSettingsChange = useCallback((section: SettingsSection) => {
    setActiveSettingsSection(section)
  }, [])

  const visibleSettingsSections = SETTINGS_SECTIONS.filter(
    (s) => !s.requiresBilling || isBillingEnabled
  )

  return (
    <div className='flex h-screen flex-col bg-background'>
      {/* Header */}
      <div className='flex-shrink-0 border-border/40 border-b bg-background/80 px-6 py-4 backdrop-blur-sm'>
        <div className='flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
            <LayoutDashboard className='h-4 w-4 text-primary' />
          </div>
          <div>
            <h1 className='font-semibold text-lg tracking-tight'>Hub</h1>
            <p className='text-muted-foreground text-xs'>
              Manage your workspace logs, knowledge, templates, and settings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as TabId)}
        className='flex min-h-0 flex-1 flex-col'
      >
        <div className='flex-shrink-0 border-border/40 border-b bg-background/60 px-6'>
          <TabsList className='h-auto gap-1 rounded-none border-none bg-transparent p-0'>
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'relative gap-2 rounded-none border-transparent border-b-2 px-4 py-2.5 font-medium text-sm shadow-none transition-all',
                    'text-muted-foreground hover:text-foreground',
                    'data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  {tab.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value='logs' className='mt-0 min-h-0 flex-1 overflow-auto'>
          <Logs />
        </TabsContent>

        <TabsContent value='knowledge' className='mt-0 min-h-0 flex-1 overflow-auto'>
          <Knowledge />
        </TabsContent>

        <TabsContent value='templates' className='mt-0 min-h-0 flex-1 overflow-auto'>
          <Templates initialTemplates={initialTemplates} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value='settings' className='mt-0 min-h-0 flex-1'>
          <div className='flex h-full min-h-0'>
            {/* Settings Sidebar */}
            <aside className='hidden w-[200px] flex-shrink-0 flex-col border-border/40 border-r bg-muted/30 sm:flex lg:w-[220px]'>
              <div className='flex-1 overflow-y-auto'>
                <SettingsNavigation
                  activeSection={activeSettingsSection}
                  onSectionChange={handleSettingsChange}
                  hasOrganization={!!activeOrganization?.id}
                />
              </div>
            </aside>

            {/* Settings Content */}
            <main className='flex-1 overflow-y-auto bg-background'>
              <div className='min-h-full'>
                {visibleSettingsSections.map(({ id, component: SectionComponent }) => (
                  <div
                    key={id}
                    className={cn('h-full', activeSettingsSection === id ? 'block' : 'hidden')}
                  >
                    <SectionComponent onOpenChange={() => {}} />
                  </div>
                ))}
              </div>
            </main>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
