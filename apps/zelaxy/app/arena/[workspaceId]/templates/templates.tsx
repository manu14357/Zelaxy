'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Brain,
  DollarSign,
  Flame,
  FolderHeart,
  HeadphonesIcon,
  LayoutGrid,
  Megaphone,
  PieChart,
  Search,
  Shapes,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { createLogger } from '@/lib/logs/console/logger'
import { NavigationTabs } from '@/app/arena/[workspaceId]/templates/components/navigation-tabs'
import {
  TemplateCard,
  TemplateCardSkeleton,
} from '@/app/arena/[workspaceId]/templates/components/template-card'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

const logger = createLogger('TemplatesPage')

// Shared categories definition
export const categories = [
  { value: 'marketing', label: 'Growth & Campaigns' },
  { value: 'sales', label: 'Revenue & Deals' },
  { value: 'finance', label: 'Budget & Analytics' },
  { value: 'support', label: 'Customer Success' },
  { value: 'artificial-intelligence', label: 'AI & Automation' },
  { value: 'other', label: 'Miscellaneous' },
] as const

export type CategoryValue = (typeof categories)[number]['value']

// Template data structure
export interface Template {
  id: string
  workflowId: string
  userId: string
  name: string
  description: string | null
  author: string
  views: number
  stars: number
  color: string
  icon: string
  category: CategoryValue
  state: WorkflowState
  createdAt: Date | string
  updatedAt: Date | string
  isStarred: boolean
}

interface TemplatesProps {
  initialTemplates: Template[]
  currentUserId: string
}

// Section configuration with icons and accent colors
const sectionConfig = {
  your: {
    icon: FolderHeart,
    title: 'My Collection',
    description: 'Your saved and created blueprints',
    accent: 'text-primary',
    accentBg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  recent: {
    icon: Flame,
    title: 'Trending Now',
    description: 'Most popular blueprints this week',
    accent: 'text-emerald-500',
    accentBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  marketing: {
    icon: Megaphone,
    title: 'Growth & Campaigns',
    description: 'Marketing automation and growth strategies',
    accent: 'text-purple-500',
    accentBg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  sales: {
    icon: DollarSign,
    title: 'Revenue & Deals',
    description: 'Sales automation and revenue optimization',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-600/10',
    border: 'border-emerald-600/20',
  },
  finance: {
    icon: PieChart,
    title: 'Budget & Analytics',
    description: 'Financial tracking and business intelligence',
    accent: 'text-orange-500',
    accentBg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  support: {
    icon: HeadphonesIcon,
    title: 'Customer Success',
    description: 'Support workflows and customer satisfaction',
    accent: 'text-cyan-500',
    accentBg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  'artificial-intelligence': {
    icon: Brain,
    title: 'AI & Automation',
    description: 'Intelligent workflows and automated processes',
    accent: 'text-violet-500',
    accentBg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  other: {
    icon: LayoutGrid,
    title: 'Miscellaneous',
    description: 'General purpose and utility blueprints',
    accent: 'text-slate-500',
    accentBg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
} as const

export default function Templates({ initialTemplates, currentUserId }: TemplatesProps) {
  const router = useRouter()
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('your')
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [loading, setLoading] = useState(false)

  // Refs for scrolling to sections
  const sectionRefs = {
    your: useRef<HTMLDivElement>(null),
    recent: useRef<HTMLDivElement>(null),
    marketing: useRef<HTMLDivElement>(null),
    sales: useRef<HTMLDivElement>(null),
    finance: useRef<HTMLDivElement>(null),
    support: useRef<HTMLDivElement>(null),
    'artificial-intelligence': useRef<HTMLDivElement>(null),
    other: useRef<HTMLDivElement>(null),
  }

  // Get your blueprints count (created by user OR favorited by user)
  const yourTemplatesCount = templates.filter(
    (template) => template.userId === currentUserId || template.isStarred === true
  ).length

  // Handle case where active tab is "your" but user has no blueprints
  useEffect(() => {
    if (!loading && activeTab === 'your' && yourTemplatesCount === 0) {
      setActiveTab('recent') // Switch to trending tab
    }
  }, [loading, activeTab, yourTemplatesCount])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    const sectionRef = sectionRefs[tabId as keyof typeof sectionRefs]
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  // Handle favorite change callback from blueprint card
  const handleStarChange = (templateId: string, isStarred: boolean, newStarCount: number) => {
    setTemplates((prevTemplates) =>
      prevTemplates.map((template) =>
        template.id === templateId ? { ...template, isStarred, stars: newStarCount } : template
      )
    )
  }

  const filteredTemplates = (category: CategoryValue | 'your' | 'recent') => {
    let filteredByCategory = templates

    if (category === 'your') {
      filteredByCategory = templates.filter(
        (template) => template.userId === currentUserId || template.isStarred === true
      )
    } else if (category === 'recent') {
      filteredByCategory = templates
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)
    } else {
      filteredByCategory = templates.filter((template) => template.category === category)
    }

    if (!searchQuery) return filteredByCategory

    return filteredByCategory.filter(
      (template) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Helper function to render blueprint cards with proper type handling
  const renderTemplateCard = (template: Template) => (
    <TemplateCard
      key={template.id}
      id={template.id}
      title={template.name}
      description={template.description || ''}
      author={template.author}
      usageCount={template.views.toString()}
      stars={template.stars}
      icon={template.icon}
      iconColor={template.color}
      state={template.state as { blocks?: Record<string, { type: string; name?: string }> }}
      isStarred={template.isStarred}
      onStarChange={handleStarChange}
    />
  )

  // Group blueprints by category for display
  const getTemplatesByCategory = (category: CategoryValue | 'your' | 'recent') => {
    return filteredTemplates(category)
  }

  // Render placeholder cards for loading state
  const renderSkeletonCards = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <TemplateCardSkeleton key={`skeleton-${index}`} />
    ))
  }

  // Stats
  const totalTemplates = templates.length
  const totalStarred = templates.filter((t) => t.isStarred).length
  const totalViews = templates.reduce((sum, t) => sum + t.views, 0)

  // Calculate navigation tabs with real counts or placeholder counts
  const navigationTabs = [
    ...(yourTemplatesCount > 0 || loading
      ? [
          {
            id: 'your',
            label: 'My Library',
            count: loading ? 8 : getTemplatesByCategory('your').length,
          },
        ]
      : []),
    {
      id: 'recent',
      label: 'Trending',
      count: loading ? 8 : getTemplatesByCategory('recent').length,
    },
    {
      id: 'marketing',
      label: 'Growth & Campaigns',
      count: loading ? 8 : getTemplatesByCategory('marketing').length,
    },
    {
      id: 'sales',
      label: 'Revenue & Deals',
      count: loading ? 8 : getTemplatesByCategory('sales').length,
    },
    {
      id: 'finance',
      label: 'Budget & Analytics',
      count: loading ? 8 : getTemplatesByCategory('finance').length,
    },
    {
      id: 'support',
      label: 'Customer Success',
      count: loading ? 8 : getTemplatesByCategory('support').length,
    },
    {
      id: 'artificial-intelligence',
      label: 'AI & Automation',
      count: loading ? 8 : getTemplatesByCategory('artificial-intelligence').length,
    },
    {
      id: 'other',
      label: 'Miscellaneous',
      count: loading ? 8 : getTemplatesByCategory('other').length,
    },
  ]

  // Render a section
  const renderSection = (
    key: keyof typeof sectionConfig,
    ref: React.RefObject<HTMLDivElement | null>,
    templates: Template[]
  ) => {
    const config = sectionConfig[key]
    const SectionIcon = config.icon
    const items = loading ? [] : templates

    if (!loading && items.length === 0 && !searchQuery) return null

    return (
      <div ref={ref} className='mb-8'>
        {/* Section Header */}
        <div className='mb-4 flex items-center gap-3'>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.accentBg}`}>
            <SectionIcon className={`h-4 w-4 ${config.accent}`} />
          </div>
          <div>
            <h2 className='font-semibold text-[14px] text-foreground leading-none'>
              {config.title}
            </h2>
            <p className='mt-0.5 text-[11px] text-muted-foreground'>{config.description}</p>
          </div>
          <div className='ml-auto'>
            <span className='rounded-full bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums'>
              {loading ? '...' : items.length}
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className={`rounded-xl border ${config.border} bg-card/30 p-2 sm:p-4`}>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4'>
            {loading ? (
              renderSkeletonCards()
            ) : items.length > 0 ? (
              items.map((template) => renderTemplateCard(template))
            ) : (
              <div className='col-span-full flex flex-col items-center py-8'>
                <Search className='mb-2 h-5 w-5 text-muted-foreground/40' />
                <p className='text-[12px] text-muted-foreground'>No blueprints match your search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Compact Header */}
      <div className='border-border/50 border-b bg-card/30 px-3 py-3 sm:px-6 sm:py-4'>
        <div className='flex items-center gap-2 sm:gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
            <Shapes className='h-4 w-4 text-primary' />
          </div>
          <div>
            <h1 className='font-semibold text-[15px] text-foreground leading-none'>
              Blueprint Gallery
            </h1>
            <p className='mt-1 hidden text-[12px] text-muted-foreground sm:block'>
              Discover powerful workflow blueprints to accelerate your projects
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-auto'>
        <div className='px-3 py-4 sm:px-6 sm:py-5'>
          {/* Stats Strip */}
          {!loading && totalTemplates > 0 && (
            <div className='mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3'>
              <div className='rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                    <Shapes className='h-3.5 w-3.5 text-primary' />
                  </div>
                  <div>
                    <div className='font-semibold text-[16px] text-foreground tabular-nums leading-none'>
                      {totalTemplates}
                    </div>
                    <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
                      Blueprints
                    </div>
                  </div>
                </div>
              </div>

              <div className='rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10'>
                    <Sparkles className='h-3.5 w-3.5 text-yellow-500' />
                  </div>
                  <div>
                    <div className='font-semibold text-[16px] text-foreground tabular-nums leading-none'>
                      {totalStarred}
                    </div>
                    <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
                      Starred
                    </div>
                  </div>
                </div>
              </div>

              <div className='rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10'>
                    <TrendingUp className='h-3.5 w-3.5 text-blue-500' />
                  </div>
                  <div>
                    <div className='font-semibold text-[16px] text-foreground tabular-nums leading-none'>
                      {totalViews.toLocaleString()}
                    </div>
                    <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
                      Total Views
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className='mb-5'>
            <div className='relative'>
              <Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search blueprints by name, description, or author...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-9 w-full border-border/50 bg-card/50 pl-9 text-[13px] transition-colors focus:border-border focus:bg-card'
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className='mb-5'>
            <NavigationTabs
              tabs={navigationTabs}
              activeTab={activeTab}
              onTabClick={handleTabClick}
            />
          </div>

          {/* Sections */}
          {(yourTemplatesCount > 0 || loading) &&
            renderSection('your', sectionRefs.your, getTemplatesByCategory('your'))}
          {renderSection('recent', sectionRefs.recent, getTemplatesByCategory('recent'))}
          {renderSection('marketing', sectionRefs.marketing, getTemplatesByCategory('marketing'))}
          {renderSection('sales', sectionRefs.sales, getTemplatesByCategory('sales'))}
          {renderSection('finance', sectionRefs.finance, getTemplatesByCategory('finance'))}
          {renderSection('support', sectionRefs.support, getTemplatesByCategory('support'))}
          {renderSection(
            'artificial-intelligence',
            sectionRefs['artificial-intelligence'],
            getTemplatesByCategory('artificial-intelligence')
          )}
          {renderSection('other', sectionRefs.other, getTemplatesByCategory('other'))}
        </div>
      </div>
    </div>
  )
}
