import { useMemo } from 'react'
import {
  CreditCard,
  Keyboard,
  KeyRound,
  KeySquare,
  Lock,
  Settings,
  Shield,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react'
import { McpIcon } from '@/components/icons'
import { isBillingEnabled } from '@/lib/environment'
import { cn } from '@/lib/utils'
import { useSubscriptionStore } from '@/stores/subscription/store'

// ── Types ────────────────────────────────────────────────────────────────────

type SectionId =
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

interface SettingsNavigationProps {
  activeSection: string
  onSectionChange: (section: SectionId) => void
  hasOrganization: boolean
}

interface NavigationItem {
  id: SectionId
  label: string
  icon: React.ComponentType<{ className?: string }>
  hideWhenBillingDisabled?: boolean
  requiresTeam?: boolean
}

interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

// ── Data ─────────────────────────────────────────────────────────────────────

const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    label: 'Personal',
    items: [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'account', label: 'Account', icon: UserCircle },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'environment', label: 'Environment', icon: KeyRound },
      { id: 'credentials', label: 'Credentials', icon: Lock },
      { id: 'apikeys', label: 'API Keys', icon: KeySquare },
      { id: 'mcp', label: 'MCP Servers', icon: McpIcon },
    ],
  },
  {
    label: 'Organization',
    items: [
      {
        id: 'subscription',
        label: 'Subscription',
        icon: CreditCard,
        hideWhenBillingDisabled: true,
      },
      { id: 'team', label: 'Team', icon: Users },
    ],
  },
  {
    label: 'Security',
    items: [
      { id: 'privacy', label: 'Privacy', icon: Shield },
      { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
      { id: 'admin', label: 'Admin', icon: ShieldCheck },
    ],
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export function SettingsNavigation({
  activeSection,
  onSectionChange,
  hasOrganization,
}: SettingsNavigationProps) {
  const { getSubscriptionStatus } = useSubscriptionStore()
  const subscription = getSubscriptionStatus()

  /** Filter out items that should be hidden based on feature flags. */
  const visibleGroups = useMemo(() => {
    return NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.hideWhenBillingDisabled && !isBillingEnabled) return false
        if (item.requiresTeam && !subscription.isTeam && !subscription.isEnterprise) return false
        return true
      }),
    })).filter((group) => group.items.length > 0)
  }, [subscription.isTeam, subscription.isEnterprise])

  return (
    <nav className='flex flex-col gap-5 px-3 py-4' aria-label='Settings navigation'>
      {visibleGroups.map((group) => (
        <div key={group.label} role='group' aria-label={group.label}>
          <span className='mb-1.5 block select-none px-2 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-wider'>
            {group.label}
          </span>
          <div className='space-y-0.5'>
            {group.items.map((item) => {
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] font-medium text-[13px]',
                    'transition-all duration-150 ease-out',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/15'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={cn(
                      'h-[15px] w-[15px] shrink-0 transition-colors duration-150',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground/70 group-hover:text-foreground/70'
                    )}
                  />
                  <span className='truncate'>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
