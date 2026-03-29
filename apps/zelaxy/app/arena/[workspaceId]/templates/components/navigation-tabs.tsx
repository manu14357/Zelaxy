import { cn } from '@/lib/utils'

interface NavigationTab {
  id: string
  label: string
  count?: number
}

interface NavigationTabsProps {
  tabs: NavigationTab[]
  activeTab?: string
  onTabClick?: (tabId: string) => void
  className?: string
}

export function NavigationTabs({ tabs, activeTab, onTabClick, className }: NavigationTabsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick?.(tab.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-[12px] transition-all duration-150',
            activeTab === tab.id
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums leading-none',
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted/60 text-muted-foreground'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
