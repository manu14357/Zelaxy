'use client'

import { useMemo } from 'react'
import clsx from 'clsx'
import {
  Bird,
  Cat,
  Crown,
  Dog,
  Fish,
  Gem,
  Globe,
  Heart,
  Moon,
  Orbit,
  Rabbit,
  Rocket,
  Sparkles,
  Squirrel,
  Star,
  Sun,
  Turtle,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/lib/auth-client'
import type { WorkflowMetadata } from '@/stores/workflows/registry/types'

// Space/Galaxy themed icons plus animals and birds
const spaceIcons = [
  Star,
  Sparkles,
  Zap,
  Rocket,
  Globe,
  Moon,
  Sun,
  Orbit,
  Heart,
  Crown,
  Gem,
  Bird,
  Fish,
  Rabbit,
  Cat,
  Dog,
  Squirrel,
  Turtle,
]

// Function to get a consistent space icon based on workflow ID
function getSpaceIcon(workflowId: string) {
  // Create a simple hash from the workflow ID to ensure consistency
  let hash = 0
  for (let i = 0; i < workflowId.length; i++) {
    const char = workflowId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % spaceIcons.length
  return spaceIcons[index]
}

// Helper function to lighten a hex color
function lightenColor(hex: string, percent = 30): string {
  // Remove # if present
  const color = hex.replace('#', '')

  // Parse RGB values
  const num = Number.parseInt(color, 16)
  const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent) / 100))
  const g = Math.min(
    255,
    Math.floor(((num >> 8) & 0x00ff) + ((255 - ((num >> 8) & 0x00ff)) * percent) / 100)
  )
  const b = Math.min(255, Math.floor((num & 0x0000ff) + ((255 - (num & 0x0000ff)) * percent) / 100))

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

interface WorkflowItemProps {
  workflow: WorkflowMetadata
  active: boolean
  isMarketplace?: boolean
}

function WorkflowItem({ workflow, active, isMarketplace }: WorkflowItemProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const SpaceIcon = getSpaceIcon(workflow.id)

  return (
    <Link
      href={`/arena/${workspaceId}/zelaxy/${workflow.id}`}
      className={clsx(
        'flex items-center rounded-md px-2 py-1.5 font-medium text-sm',
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
      )}
    >
      <SpaceIcon
        className='mr-2 h-[14px] w-[14px] flex-shrink-0'
        style={{ color: workflow.color }}
      />
      <span className='truncate'>
        {workflow.name}
        {isMarketplace && ' (Preview)'}
      </span>
    </Link>
  )
}

interface WorkflowListProps {
  regularWorkflows: WorkflowMetadata[]
  marketplaceWorkflows: WorkflowMetadata[]
  isLoading?: boolean
}

export function WorkflowList({
  regularWorkflows,
  marketplaceWorkflows,
  isLoading = false,
}: WorkflowListProps) {
  const pathname = usePathname()
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const { data: session } = useSession()

  // Generate skeleton items for loading state
  const skeletonItems = useMemo(() => {
    return Array(4)
      .fill(0)
      .map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className='mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5'
        >
          <Skeleton className='h-[14px] w-[14px] rounded-md' />
          <Skeleton className='h-4 w-20' />
        </div>
      ))
  }, [])

  // Only show empty state when not loading and user is logged in
  const showEmptyState =
    !isLoading &&
    session?.user &&
    regularWorkflows.length === 0 &&
    marketplaceWorkflows.length === 0

  return (
    <div className={`space-y-1 ${isLoading ? 'opacity-60' : ''}`}>
      {isLoading ? (
        // Show skeleton loading state
        skeletonItems
      ) : (
        <>
          {/* Regular workflows */}
          {regularWorkflows.map((workflow) => (
            <WorkflowItem
              key={workflow.id}
              workflow={workflow}
              active={pathname === `/arena/${workspaceId}/zelaxy/${workflow.id}`}
            />
          ))}

          {/* Marketplace Temp Workflows (if any) */}
          {marketplaceWorkflows.length > 0 && (
            <div className='mt-2 border-border/30 border-t pt-2'>
              <h3 className='mb-1 px-2 font-medium text-muted-foreground text-xs'>Marketplace</h3>
              {marketplaceWorkflows.map((workflow) => (
                <WorkflowItem
                  key={workflow.id}
                  workflow={workflow}
                  active={pathname === `/arena/${workspaceId}/zelaxy/${workflow.id}`}
                  isMarketplace
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmptyState && (
            <div className='px-2 py-1.5 text-muted-foreground text-xs'>
              No workflows in {workspaceId ? 'this workspace' : 'your account'}. Create one to get
              started.
            </div>
          )}
        </>
      )}
    </div>
  )
}
