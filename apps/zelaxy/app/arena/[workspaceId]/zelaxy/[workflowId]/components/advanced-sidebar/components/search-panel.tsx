'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Building2, LibraryBig, ScrollText, Search, Shapes, Workflow } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBrandConfig } from '@/lib/branding/branding'
import { cn } from '@/lib/utils'

// Utility function to get icon text color based on background color
const getIconTextClass = (bgColor: string) => {
  // Light colors that need dark text
  const lightColors = [
    '#E0E0E0',
    '#FFFFFF',
    '#F8F9FA',
    '#E9ECEF',
    '#DEE2E6',
    '#D6D3C7',
    '#FFEAA7',
    '#FEE12B',
    '#FFC83C',
  ]
  return lightColors.includes(bgColor) ? 'text-gray-800' : 'text-white'
}

// Utility function to get icon background class based on color
const getIconBgClass = (bgColor: string) => {
  // Comprehensive color map to handle all block/tool color variations
  const colorMap: Record<string, string> = {
    // Standard colors
    '#6B7280': 'bg-gray-500',
    '#EF4444': 'bg-red-500',
    '#F97316': 'bg-orange-500',
    '#EA580C': 'bg-orange-600',
    '#C2410C': 'bg-orange-700',
    '#FB923C': 'bg-orange-400',
    '#D97706': 'bg-amber-600',
    '#EAB308': 'bg-yellow-500',
    '#22C55E': 'bg-green-500',
    '#06B6D4': 'bg-cyan-500',
    '#8B5CF6': 'bg-violet-500',
    '#EC4899': 'bg-pink-500',
    '#F59E0B': 'bg-amber-500',
    '#10B981': 'bg-emerald-500',
    '#14B8A6': 'bg-teal-500',
    '#8B5A2B': 'bg-amber-700',
    '#DC2626': 'bg-red-600',
    '#059669': 'bg-emerald-600',

    // Special block colors
    '#FEE12B': 'bg-yellow-400',
    '#FF6B6B': 'bg-red-400',
    '#4ECDC4': 'bg-teal-400',
    '#45B7D1': 'bg-teal-400',
    '#96CEB4': 'bg-green-400',
    '#FFEAA7': 'bg-yellow-300',
    '#DDA0DD': 'bg-purple-400',
    '#98D8C8': 'bg-emerald-300',
    '#F7DC6F': 'bg-yellow-300',
    '#BB8FCE': 'bg-purple-300',
    '#85C1E9': 'bg-teal-300',

    // Brand-specific colors from blocks
    '#FF4B4B': 'bg-red-500',
    '#FFC83C': 'bg-yellow-400',
    '#FF0000': 'bg-red-600',
    '#25D366': 'bg-green-500',
    '#E0E0E0': 'bg-gray-300',
    '#1C1C1C': 'bg-gray-900',
    '#1A223F': 'bg-slate-800',
    '#F64F9E': 'bg-pink-500',
    '#2B3543': 'bg-slate-700',
    '#5E6AD2': 'bg-violet-500',
    '#262627': 'bg-gray-800',
    '#0D1117': 'bg-gray-900',
    '#333333': 'bg-gray-700',
    '#D6D3C7': 'bg-stone-300',
    '#20808D': 'bg-teal-600',
    '#611f69': 'bg-purple-800',
    '#181C1E': 'bg-gray-900',
    '#000000': 'bg-black',
    '#40916C': 'bg-green-600',
    '#10a37f': 'bg-emerald-600',
    '#FF752F': 'bg-orange-500',
    '#0B0F19': 'bg-slate-900',

    // Legacy blue values (backward compat)
    '#2FB3FF': 'bg-orange-500',
    '#6366F1': 'bg-orange-500',
    '#6366f1': 'bg-orange-500',
    '#3B82F6': 'bg-orange-500',
    '#4D5FFF': 'bg-orange-700',
    '#2F55FF': 'bg-orange-600',
    '#1F40ED': 'bg-amber-600',
    '#0066FF': 'bg-amber-500',
    '#4A90D9': 'bg-orange-400',

    // Additional common colors
    '#FFFFFF': 'bg-white',
    '#F8F9FA': 'bg-gray-50',
    '#E9ECEF': 'bg-gray-200',
    '#DEE2E6': 'bg-gray-300',
    '#CED4DA': 'bg-gray-400',
    '#ADB5BD': 'bg-gray-500',
    '#868E96': 'bg-gray-600',
    '#495057': 'bg-gray-700',
    '#343A40': 'bg-gray-800',
    '#212529': 'bg-gray-900',
  }

  // Fallback: try to match similar colors for unknown hex values
  if (!colorMap[bgColor]) {
    const hex = bgColor.replace('#', '').toLowerCase()

    // Convert hex to RGB for color matching
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)

    // Simple color matching algorithm
    if (r > 200 && g > 200 && b > 200) return 'bg-gray-200' // Light colors
    if (r < 50 && g < 50 && b < 50) return 'bg-gray-800' // Dark colors
    if (r > g && r > b) return 'bg-red-500' // Reddish
    if (g > r && g > b) return 'bg-green-500' // Greenish
    if (b > r && b > g) return 'bg-primary/100' // Blueish
    if (r > 150 && g > 150) return 'bg-yellow-500' // Yellowish
    if (r > 150 && b > 150) return 'bg-purple-500' // Purplish
    if (g > 150 && b > 150) return 'bg-cyan-500' // Cyanish
  }

  return colorMap[bgColor] || 'bg-gray-500'
}

// Component for expandable description text
interface ExpandableDescriptionProps {
  text: string
  maxLines?: number
  className?: string
}

const ExpandableDescription = ({ text, maxLines = 2, className }: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = Number.parseInt(getComputedStyle(textRef.current).lineHeight)
      const height = textRef.current.scrollHeight
      const lines = Math.ceil(height / lineHeight)
      setShowButton(lines > maxLines)
    }
  }, [text, maxLines])

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={className}>
      <div
        ref={textRef}
        className={cn('text-muted-foreground text-xs leading-tight', !isExpanded && 'line-clamp-2')}
      >
        {text}
        {showButton && (
          <>
            {' '}
            <div
              onMouseDown={handleToggle}
              className='inline-block cursor-pointer select-none font-medium text-primary text-xs hover:text-primary/80'
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import {
  TemplateCard,
  TemplateCardSkeleton,
} from '@/app/arena/[workspaceId]/templates/components/template-card'
import { getKeyboardShortcutText } from '@/app/arena/[workspaceId]/zelaxy/hooks/use-keyboard-shortcuts'
import { getAllBlocks } from '@/blocks'

interface SearchPanelProps {
  templates?: TemplateData[]
  workflows?: WorkflowItem[]
  workspaces?: WorkspaceItem[]
  loading?: boolean
  isOnWorkflowPage?: boolean
  onItemClick?: () => void
}

interface TemplateData {
  id: string
  title: string
  description: string
  author: string
  usageCount: string
  stars: number
  icon: string
  iconColor: string
  state?: {
    blocks?: Record<string, { type: string; name?: string }>
  }
  isStarred?: boolean
}

interface WorkflowItem {
  id: string
  name: string
  href: string
  isCurrent?: boolean
}

interface WorkspaceItem {
  id: string
  name: string
  href: string
  isCurrent?: boolean
}

interface BlockItem {
  id: string
  name: string
  description: string
  longDescription?: string
  icon: React.ComponentType<any>
  bgColor: string
  type: string
}

interface ToolItem {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  bgColor: string
  type: string
}

interface PageItem {
  id: string
  name: string
  icon: React.ComponentType<any>
  href: string
  shortcut?: string
}

interface DocItem {
  id: string
  name: string
  icon: React.ComponentType<any>
  href: string
  type: 'main' | 'block' | 'tool'
}

export function SearchPanel({
  templates = [],
  workflows = [],
  workspaces = [],
  loading = false,
  isOnWorkflowPage = false,
  onItemClick,
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [localTemplates, setLocalTemplates] = useState<TemplateData[]>(templates)
  const [showAllBlocks, setShowAllBlocks] = useState(false)
  const [showAllTools, setShowAllTools] = useState(false)
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const brand = useBrandConfig()

  // Update local templates when props change
  useEffect(() => {
    setLocalTemplates(templates)
  }, [templates])

  // Get all available blocks - only when on workflow page
  const blocks = useMemo(() => {
    if (!isOnWorkflowPage) return []

    const allBlocks = getAllBlocks()
    return allBlocks
      .filter(
        (block) =>
          block.type !== 'starter' &&
          !block.hideFromToolbar &&
          (block.category === 'blocks' || block.category === 'triggers')
      )
      .map(
        (block): BlockItem => ({
          id: block.type,
          name: block.name,
          description: block.description || '',
          longDescription: block.longDescription,
          icon: block.icon,
          bgColor: block.bgColor || '#6B7280',
          type: block.type,
        })
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [isOnWorkflowPage])

  // Get all available tools - only when on workflow page
  const tools = useMemo(() => {
    if (!isOnWorkflowPage) return []

    const allBlocks = getAllBlocks()
    return allBlocks
      .filter((block) => block.category === 'tools')
      .map(
        (block): ToolItem => ({
          id: block.type,
          name: block.name,
          description: block.description || '',
          icon: block.icon,
          bgColor: block.bgColor || '#6B7280',
          type: block.type,
        })
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [isOnWorkflowPage])

  // Define pages
  const pages = useMemo(
    (): PageItem[] => [
      {
        id: 'logs',
        name: 'Logs',
        icon: ScrollText,
        href: `/arena/${workspaceId}/hub?tab=logs`,
        shortcut: getKeyboardShortcutText('L', true, true),
      },
      {
        id: 'knowledge',
        name: 'Knowledge',
        icon: LibraryBig,
        href: `/arena/${workspaceId}/hub?tab=knowledge`,
        shortcut: getKeyboardShortcutText('K', true, true),
      },
      {
        id: 'templates',
        name: 'Templates',
        icon: Shapes,
        href: `/arena/${workspaceId}/hub?tab=templates`,
      },
      {
        id: 'docs',
        name: 'Docs',
        icon: BookOpen,
        href: brand.documentationUrl || '#',
      },
    ],
    [workspaceId, brand.documentationUrl]
  )

  // Define docs
  const docs = useMemo((): DocItem[] => {
    const allBlocks = getAllBlocks()
    const docsItems: DocItem[] = []

    // Add individual block/tool docs
    allBlocks.forEach((block) => {
      if (block.docsLink) {
        docsItems.push({
          id: `docs-${block.type}`,
          name: block.name,
          icon: block.icon,
          href: block.docsLink,
          type: block.category === 'blocks' || block.category === 'triggers' ? 'block' : 'tool',
        })
      }
    })

    return docsItems.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  // Filter all items based on search query
  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show all blocks when no search, but allow toggling to show more
      return showAllBlocks ? blocks : blocks.slice(0, 12)
    }
    const query = searchQuery.toLowerCase()
    return blocks.filter(
      (block) =>
        block.name.toLowerCase().includes(query) ||
        block.description.toLowerCase().includes(query) ||
        block.longDescription?.toLowerCase().includes(query)
    )
  }, [blocks, searchQuery, showAllBlocks])

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show all tools when no search, but allow toggling to show more
      return showAllTools ? tools : tools.slice(0, 12)
    }
    const query = searchQuery.toLowerCase()
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query)
    )
  }, [tools, searchQuery, showAllTools])

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return localTemplates.slice(0, 6) // Show more templates when no search
    const query = searchQuery.toLowerCase()
    return localTemplates.filter(
      (template) =>
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
    )
  }, [localTemplates, searchQuery])

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows.slice(0, 8) // Show more workflows when no search
    const query = searchQuery.toLowerCase()
    return workflows.filter((workflow) => workflow.name.toLowerCase().includes(query))
  }, [workflows, searchQuery])

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces.slice(0, 5) // Show more workspaces when no search
    const query = searchQuery.toLowerCase()
    return workspaces.filter((workspace) => workspace.name.toLowerCase().includes(query))
  }, [workspaces, searchQuery])

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages
    const query = searchQuery.toLowerCase()
    return pages.filter((page) => page.name.toLowerCase().includes(query))
  }, [pages, searchQuery])

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs.slice(0, 8) // Show more docs when no search
    const query = searchQuery.toLowerCase()
    return docs.filter((doc) => doc.name.toLowerCase().includes(query))
  }, [docs, searchQuery])

  // Handle block/tool click
  const handleBlockClick = useCallback(
    (blockType: string) => {
      // Dispatch a custom event to be caught by the workflow component
      const event = new CustomEvent('add-block-from-toolbar', {
        detail: {
          type: blockType,
        },
      })
      window.dispatchEvent(event)
      onItemClick?.()
    },
    [onItemClick]
  )

  // Handle page navigation
  const handlePageClick = useCallback(
    (href: string) => {
      // External links open in new tab
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        router.push(href)
      }
      onItemClick?.()
    },
    [router, onItemClick]
  )

  // Handle navigation click
  const handleNavigationClick = useCallback(
    (href: string) => {
      router.push(href)
      onItemClick?.()
    },
    [router, onItemClick]
  )

  // Handle docs navigation
  const handleDocsClick = useCallback(
    (href: string) => {
      // External links open in new tab
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        router.push(href)
      }
      onItemClick?.()
    },
    [router, onItemClick]
  )

  // Handle template usage callback (closes modal after template is used)
  const handleTemplateUsed = useCallback(() => {
    onItemClick?.()
  }, [onItemClick])

  // Handle star change callback from template card
  const handleStarChange = useCallback(
    (templateId: string, isStarred: boolean, newStarCount: number) => {
      setLocalTemplates((prevTemplates) =>
        prevTemplates.map((template) =>
          template.id === templateId ? { ...template, isStarred, stars: newStarCount } : template
        )
      )
    },
    []
  )

  // Render skeleton cards for loading state
  const renderSkeletonCards = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <div key={`skeleton-${index}`} className='flex-shrink-0'>
        <TemplateCardSkeleton />
      </div>
    ))
  }

  return (
    <div className='relative z-10 flex h-full w-full flex-col'>
      {/* Search Input */}
      <div className='relative z-20 flex-shrink-0 border-b p-3'>
        <div className='relative'>
          <Search className='-translate-y-1/2 absolute top-1/2 left-3 z-30 h-4 w-4 transform text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search anything...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='relative z-30 h-9 w-full pl-10'
          />
        </div>
      </div>

      {/* Search Results */}
      <ScrollArea className='relative z-20 w-full flex-1'>
        <div className='relative z-30 w-full space-y-6 p-3'>
          {/* Blocks */}
          {filteredBlocks.length > 0 && (
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <h4 className='font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                  Blocks ({filteredBlocks.length}
                  {!searchQuery.trim() && blocks.length > filteredBlocks.length
                    ? ` of ${blocks.length}`
                    : ''}
                  )
                </h4>
                {!searchQuery.trim() && blocks.length > 12 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowAllBlocks(!showAllBlocks)}
                    className='h-5 px-2 text-muted-foreground text-xs hover:text-foreground'
                  >
                    {showAllBlocks ? 'Show Less' : 'Show All'}
                  </Button>
                )}
              </div>
              <div className='relative z-40 w-full space-y-1'>
                {filteredBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => handleBlockClick(block.type)}
                    className='pointer-events-auto relative z-40 flex w-full items-start gap-3 rounded-md border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-accent'
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10',
                        getIconBgClass(block.bgColor)
                      )}
                      data-bg-color={block.bgColor}
                    >
                      <block.icon
                        className={cn('h-4 w-4 drop-shadow-sm', getIconTextClass(block.bgColor))}
                      />
                    </div>
                    <div className='min-w-0 flex-1 overflow-hidden'>
                      <div className='mb-1 truncate font-medium text-sm'>{block.name}</div>
                      <div className='line-clamp-2 break-words text-muted-foreground text-xs leading-tight'>
                        {block.longDescription || block.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {filteredTools.length > 0 && (
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <h4 className='font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                  Tools ({filteredTools.length}
                  {!searchQuery.trim() && tools.length > filteredTools.length
                    ? ` of ${tools.length}`
                    : ''}
                  )
                </h4>
                {!searchQuery.trim() && tools.length > 12 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowAllTools(!showAllTools)}
                    className='h-5 px-2 text-muted-foreground text-xs hover:text-foreground'
                  >
                    {showAllTools ? 'Show Less' : 'Show All'}
                  </Button>
                )}
              </div>
              <div className='relative z-40 w-full space-y-1'>
                {filteredTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleBlockClick(tool.type)}
                    className='pointer-events-auto relative z-40 flex w-full items-start gap-3 rounded-md border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-accent'
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10',
                        getIconBgClass(tool.bgColor)
                      )}
                      data-bg-color={tool.bgColor}
                    >
                      <tool.icon
                        className={cn('h-4 w-4 drop-shadow-sm', getIconTextClass(tool.bgColor))}
                      />
                    </div>
                    <div className='min-w-0 flex-1 overflow-hidden'>
                      <div className='mb-1 truncate font-medium text-sm'>{tool.name}</div>
                      <div className='line-clamp-2 break-words text-muted-foreground text-xs leading-tight'>
                        {tool.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Templates */}
          {(loading || filteredTemplates.length > 0) && (
            <div>
              <h4 className='mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                Templates ({loading ? '...' : filteredTemplates.length})
              </h4>
              <div className='space-y-2'>
                {loading
                  ? renderSkeletonCards()
                  : filteredTemplates.map((template) => (
                      <div key={template.id} className='origin-top-left scale-75'>
                        <TemplateCard
                          id={template.id}
                          title={template.title}
                          description={template.description}
                          author={template.author}
                          usageCount={template.usageCount}
                          stars={template.stars}
                          icon={template.icon}
                          iconColor={template.iconColor}
                          state={template.state}
                          isStarred={template.isStarred}
                          onTemplateUsed={handleTemplateUsed}
                          onStarChange={handleStarChange}
                        />
                      </div>
                    ))}
              </div>
            </div>
          )}

          {/* Workflows */}
          {filteredWorkflows.length > 0 && (
            <div>
              <h4 className='mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                Workflows ({filteredWorkflows.length})
              </h4>
              <div className='space-y-1'>
                {filteredWorkflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() =>
                      workflow.isCurrent ? onItemClick?.() : handleNavigationClick(workflow.href)
                    }
                    className='flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent'
                  >
                    <Workflow className='h-5 w-5 flex-shrink-0 text-muted-foreground' />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium text-sm'>
                        {workflow.name}
                        {workflow.isCurrent && ' (current)'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces */}
          {filteredWorkspaces.length > 0 && (
            <div>
              <h4 className='mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                Workspaces ({filteredWorkspaces.length})
              </h4>
              <div className='space-y-1'>
                {filteredWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() =>
                      workspace.isCurrent ? onItemClick?.() : handleNavigationClick(workspace.href)
                    }
                    className='flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent'
                  >
                    <Building2 className='h-5 w-5 flex-shrink-0 text-muted-foreground' />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium text-sm'>
                        {workspace.name}
                        {workspace.isCurrent && ' (current)'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pages */}
          {filteredPages.length > 0 && (
            <div>
              <h4 className='mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                Pages ({filteredPages.length})
              </h4>
              <div className='space-y-1'>
                {filteredPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handlePageClick(page.href)}
                    className='flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent'
                  >
                    <page.icon className='h-5 w-5 flex-shrink-0 text-muted-foreground' />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium text-sm'>{page.name}</div>
                    </div>
                    {page.shortcut && <KeyboardShortcut shortcut={page.shortcut} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Docs */}
          {filteredDocs.length > 0 && (
            <div>
              <h4 className='mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                Docs ({filteredDocs.length})
              </h4>
              <div className='space-y-1'>
                {filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocsClick(doc.href)}
                    className='flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent'
                  >
                    <doc.icon className='h-5 w-5 flex-shrink-0 text-muted-foreground' />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium text-sm'>{doc.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {searchQuery &&
            filteredBlocks.length === 0 &&
            filteredTools.length === 0 &&
            filteredWorkflows.length === 0 &&
            filteredWorkspaces.length === 0 &&
            filteredPages.length === 0 &&
            filteredDocs.length === 0 &&
            filteredTemplates.length === 0 && (
              <div className='py-8 text-center'>
                <Search className='mx-auto mb-2 h-8 w-8 text-muted-foreground' />
                <p className='text-muted-foreground text-sm'>
                  No results found for "{searchQuery}"
                </p>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSearchQuery('')}
                  className='mt-2'
                >
                  Clear search
                </Button>
              </div>
            )}

          {/* No search query state */}
          {!searchQuery && (filteredBlocks.length > 0 || filteredTools.length > 0) && (
            <div className='border-t py-4 text-center'>
              <Search className='mx-auto mb-2 h-6 w-6 text-muted-foreground' />
              <p className='text-muted-foreground text-xs'>
                Search for blocks, tools, workflows, and more...
              </p>
              <p className='mt-1 text-muted-foreground text-xs'>
                Showing {filteredBlocks.length + filteredTools.length} of{' '}
                {blocks.length + tools.length} available items
              </p>
              {(blocks.length > 12 || tools.length > 12) && (
                <p className='mt-1 text-muted-foreground text-xs'>
                  Use "Show All" buttons to see more items
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Keyboard Shortcut Component
interface KeyboardShortcutProps {
  shortcut: string
  className?: string
}

const KeyboardShortcut = ({ shortcut, className }: KeyboardShortcutProps) => {
  const parts = shortcut.split('+')

  // Helper function to determine if a part is a symbol that should be larger
  const isSymbol = (part: string) => {
    return ['⌘', '⇧', '⌥', '⌃'].includes(part)
  }

  return (
    <kbd
      className={cn(
        'flex h-4 w-6 items-center justify-center border border-border bg-background font-mono text-muted-foreground text-xs dark:text-muted-foreground',
        className
      )}
    >
      <span className='flex items-center justify-center gap-[1px] pt-[1px]'>
        {parts.map((part, index) => (
          <span key={index} className={cn(isSymbol(part) ? 'text-[10px]' : 'text-[9px]')}>
            {part}
          </span>
        ))}
      </span>
    </kbd>
  )
}
