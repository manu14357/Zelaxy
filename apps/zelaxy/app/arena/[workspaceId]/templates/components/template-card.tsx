import { useState } from 'react'
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Calculator,
  Cloud,
  Code,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Edit,
  FileText,
  Folder,
  Globe,
  HeadphonesIcon,
  Layers,
  Lightbulb,
  LineChart,
  Mail,
  Megaphone,
  MessageSquare,
  NotebookPen,
  Phone,
  Play,
  Search,
  Server,
  Settings,
  ShoppingCart,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { getBlock } from '@/blocks/registry'

const logger = createLogger('TemplateCard')

// Icon mapping for template icons
const iconMap = {
  // Content & Documentation
  FileText,
  NotebookPen,
  BookOpen,
  Edit,

  // Analytics & Charts
  BarChart3,
  LineChart,
  TrendingUp,
  Target,

  // Database & Storage
  Database,
  Server,
  Cloud,
  Folder,

  // Marketing & Communication
  Megaphone,
  Mail,
  MessageSquare,
  Phone,
  Bell,

  // Sales & Finance
  DollarSign,
  CreditCard,
  Calculator,
  ShoppingCart,
  Briefcase,

  // Support & Service
  HeadphonesIcon,
  User,
  Users,
  Settings,
  Wrench,

  // AI & Technology
  Bot,
  Brain,
  Cpu,
  Code,
  Zap,

  // Workflow & Process
  Workflow,
  Search,
  Play,
  Layers,

  // General
  Lightbulb,
  Star,
  Globe,
  Award,
}

interface TemplateCardProps {
  id: string
  title: string
  description: string
  author: string
  usageCount: string
  stars?: number
  icon?: React.ReactNode | string
  iconColor?: string
  blocks?: string[]
  onClick?: () => void
  className?: string
  // Add state prop to extract block types
  state?: {
    blocks?: Record<string, { type: string; name?: string }>
  }
  isStarred?: boolean
  // Optional callback when template is successfully used (for closing modals, etc.)
  onTemplateUsed?: () => void
  // Callback when star state changes (for parent state updates)
  onStarChange?: (templateId: string, isStarred: boolean, newStarCount: number) => void
}

// Skeleton component for loading states
export function TemplateCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-[140px] rounded-xl border border-border/40 bg-card/50', className)}>
      {/* Left side - Info skeleton */}
      <div className='flex min-w-0 flex-1 flex-col justify-between p-4'>
        <div className='space-y-2.5'>
          <div className='flex min-w-0 items-center gap-2.5'>
            <div className='h-8 w-8 animate-pulse rounded-lg bg-muted/60' />
            <div className='h-4 w-28 animate-pulse rounded-md bg-muted/60' />
          </div>
          <div className='space-y-1.5'>
            <div className='h-3 w-full animate-pulse rounded bg-muted/40' />
            <div className='h-3 w-3/4 animate-pulse rounded bg-muted/40' />
          </div>
        </div>
        <div className='flex items-center gap-2 pt-1'>
          <div className='h-3 w-20 animate-pulse rounded bg-muted/40' />
          <div className='h-3 w-12 animate-pulse rounded bg-muted/40' />
        </div>
      </div>
      {/* Right side skeleton */}
      <div className='flex w-14 flex-col items-center justify-center gap-2 border-border/30 border-l bg-muted/20 p-2'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='h-7 w-7 animate-pulse rounded-md bg-muted/40' />
        ))}
      </div>
    </div>
  )
}

// Utility function to extract block types from workflow state
const extractBlockTypesFromState = (state?: {
  blocks?: Record<string, { type: string; name?: string }>
}): string[] => {
  if (!state?.blocks) return []

  // Get unique block types from the state, excluding starter blocks
  // Sort the keys to ensure consistent ordering between server and client
  const blockTypes = Object.keys(state.blocks)
    .sort() // Sort keys to ensure consistent order
    .map((key) => state.blocks![key].type)
    .filter((type) => type !== 'starter')
  return [...new Set(blockTypes)]
}

// Utility function to get icon component from string or return the component directly
const getIconComponent = (icon: React.ReactNode | string | undefined): React.ReactNode => {
  if (typeof icon === 'string') {
    const IconComponent = iconMap[icon as keyof typeof iconMap]
    return IconComponent ? <IconComponent /> : <FileText />
  }
  if (icon) {
    return icon
  }
  // Default fallback icon
  return <FileText />
}

// Utility function to get block display name
const getBlockDisplayName = (blockType: string): string => {
  const block = getBlock(blockType)
  return block?.name || blockType
}

// Utility function to get the full block config for colored icon display
const getBlockConfig = (blockType: string) => {
  const block = getBlock(blockType)
  return block
}

export function TemplateCard({
  id,
  title,
  description,
  author,
  usageCount,
  stars = 0,
  icon,
  iconColor = 'bg-primary/100',
  blocks = [],
  onClick,
  className,
  state,
  isStarred = false,
  onTemplateUsed,
  onStarChange,
}: TemplateCardProps) {
  const router = useRouter()
  const params = useParams()

  // Local state for optimistic updates
  const [localIsStarred, setLocalIsStarred] = useState(isStarred)
  const [localStarCount, setLocalStarCount] = useState(stars)
  const [isStarLoading, setIsStarLoading] = useState(false)

  // Extract block types from state if provided, otherwise use the blocks prop
  // Filter out starter blocks in both cases and sort for consistent rendering
  const blockTypes = state
    ? extractBlockTypesFromState(state)
    : blocks.filter((blockType) => blockType !== 'starter').sort()

  // Get the icon component
  const iconComponent = getIconComponent(icon)

  // Handle star toggle with optimistic updates
  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Prevent multiple clicks while loading
    if (isStarLoading) return

    setIsStarLoading(true)

    // Optimistic update - update UI immediately
    const newIsStarred = !localIsStarred
    const newStarCount = newIsStarred ? localStarCount + 1 : localStarCount - 1

    setLocalIsStarred(newIsStarred)
    setLocalStarCount(newStarCount)

    // Notify parent component immediately for optimistic update
    if (onStarChange) {
      onStarChange(id, newIsStarred, newStarCount)
    }

    try {
      const method = localIsStarred ? 'DELETE' : 'POST'
      const response = await fetch(`/api/templates/${id}/star`, { method })

      if (!response.ok) {
        // Rollback on error
        setLocalIsStarred(localIsStarred)
        setLocalStarCount(localStarCount)

        // Rollback parent state too
        if (onStarChange) {
          onStarChange(id, localIsStarred, localStarCount)
        }

        logger.error('Failed to toggle star:', response.statusText)
      }
    } catch (error) {
      // Rollback on error
      setLocalIsStarred(localIsStarred)
      setLocalStarCount(localStarCount)

      // Rollback parent state too
      if (onStarChange) {
        onStarChange(id, localIsStarred, localStarCount)
      }

      logger.error('Error toggling star:', error)
    } finally {
      setIsStarLoading(false)
    }
  }

  // Handle use template
  const handleUseClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/templates/${id}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: params.workspaceId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        logger.info('Template use API response:', data)

        if (!data.workflowId) {
          logger.error('No workflowId returned from API:', data)
          return
        }

        const workflowUrl = `/arena/${params.workspaceId}/zelaxy/${data.workflowId}`
        logger.info('Template used successfully, navigating to:', workflowUrl)

        // Call the callback if provided (for closing modals, etc.)
        if (onTemplateUsed) {
          onTemplateUsed()
        }

        // Use window.location.href for more reliable navigation
        window.location.href = workflowUrl
      } else {
        const errorText = await response.text()
        logger.error('Failed to use template:', response.statusText, errorText)
      }
    } catch (error) {
      logger.error('Error using template:', error)
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border/40 bg-card/50 transition-all duration-200 hover:border-border/70 hover:bg-card/80 hover:shadow-md',
        'flex h-[140px]',
        className
      )}
    >
      {/* Left side - Info */}
      <div className='flex min-w-0 flex-1 flex-col justify-between p-4'>
        {/* Top section */}
        <div className='space-y-2'>
          <div className='flex min-w-0 items-center justify-between gap-2'>
            <div className='flex min-w-0 items-center gap-2.5'>
              {/* Icon container */}
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                  iconColor?.startsWith('#') ? '' : iconColor || 'bg-primary/100'
                )}
                style={{
                  backgroundColor: iconColor?.startsWith('#') ? iconColor : undefined,
                }}
              >
                <div className='h-3.5 w-3.5 text-white [&>svg]:h-3.5 [&>svg]:w-3.5'>
                  {iconComponent}
                </div>
              </div>
              {/* Template name */}
              <h3 className='truncate font-semibold text-[13px] text-foreground leading-tight'>
                {title}
              </h3>
            </div>

            {/* Star and Use button */}
            <div className='flex flex-shrink-0 items-center gap-2'>
              <Star
                onClick={handleStarClick}
                className={cn(
                  'h-3.5 w-3.5 cursor-pointer transition-colors duration-50',
                  localIsStarred
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/40 hover:fill-yellow-400 hover:text-yellow-400',
                  isStarLoading && 'opacity-50'
                )}
              />
              <button
                onClick={handleUseClick}
                className='rounded-md bg-primary px-2.5 py-1 font-medium text-[11px] text-primary-foreground transition-all duration-150 hover:bg-primary/90 hover:shadow-sm'
              >
                Use
              </button>
            </div>
          </div>

          {/* Description */}
          <p className='line-clamp-2 text-[11px] text-muted-foreground/80 leading-relaxed'>
            {description}
          </p>
        </div>

        {/* Bottom section */}
        <div className='flex min-w-0 items-center gap-1.5 border-border/30 border-t pt-2 text-[10px] text-muted-foreground/60'>
          <span className='flex-shrink-0'>by</span>
          <span className='min-w-0 truncate font-medium text-muted-foreground/80'>{author}</span>
          <span className='flex-shrink-0'>·</span>
          <User className='h-2.5 w-2.5 flex-shrink-0' />
          <span className='flex-shrink-0 tabular-nums'>{usageCount}</span>
          <div className='hidden flex-shrink-0 items-center gap-1 sm:flex'>
            <span>·</span>
            <Star className='h-2.5 w-2.5' />
            <span className='tabular-nums'>{localStarCount}</span>
          </div>
        </div>
      </div>

      {/* Right side - Block Icons */}
      <div className='flex w-14 flex-col items-center justify-center gap-1.5 border-border/30 border-l bg-muted/20 p-2'>
        {blockTypes.length > 3 ? (
          <>
            {blockTypes.slice(0, 2).map((blockType, index) => {
              const blockConfig = getBlockConfig(blockType)
              if (!blockConfig) return null

              return (
                <div key={index} className='flex items-center justify-center'>
                  <div
                    className='flex flex-shrink-0 items-center justify-center rounded-md'
                    style={{
                      backgroundColor: blockConfig.bgColor || 'gray',
                      width: '28px',
                      height: '28px',
                    }}
                  >
                    <blockConfig.icon className='h-3.5 w-3.5 text-white' />
                  </div>
                </div>
              )
            })}
            <div className='flex items-center justify-center'>
              <div
                className='flex flex-shrink-0 items-center justify-center rounded-md bg-muted-foreground/60'
                style={{ width: '28px', height: '28px' }}
              >
                <span className='font-medium text-[10px] text-white'>+{blockTypes.length - 2}</span>
              </div>
            </div>
          </>
        ) : (
          blockTypes.map((blockType, index) => {
            const blockConfig = getBlockConfig(blockType)
            if (!blockConfig) return null

            return (
              <div key={index} className='flex items-center justify-center'>
                <div
                  className='flex flex-shrink-0 items-center justify-center rounded-md'
                  style={{
                    backgroundColor: blockConfig.bgColor || 'gray',
                    width: '28px',
                    height: '28px',
                  }}
                >
                  <blockConfig.icon className='h-3.5 w-3.5 text-white' />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
