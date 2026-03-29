'use client'

import { useEffect, useRef, useState } from 'react'
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
  Pencil,
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
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import { useFolderStore, useIsWorkflowSelected } from '@/stores/folders/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import type { WorkflowMetadata } from '@/stores/workflows/registry/types'

const logger = createLogger('WorkflowItem')

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

interface WorkflowItemProps {
  workflow: WorkflowMetadata
  active: boolean
  isMarketplace?: boolean
  level: number
  isDragOver?: boolean
  isFirstItem?: boolean
}

export function WorkflowItem({
  workflow,
  active,
  isMarketplace,
  level,
  isDragOver = false,
  isFirstItem = false,
}: WorkflowItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(workflow.name)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragStartedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const { selectedWorkflows, selectOnly, toggleWorkflowSelection } = useFolderStore()
  const isSelected = useIsWorkflowSelected(workflow.id)
  const { updateWorkflow } = useWorkflowRegistry()
  const userPermissions = useUserPermissionsContext()

  // Update editValue when workflow name changes
  useEffect(() => {
    setEditValue(workflow.name)
  }, [workflow.name])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    if (isMarketplace) return
    setIsEditing(true)
    setEditValue(workflow.name)
  }

  const handleSaveEdit = async () => {
    if (!editValue.trim() || editValue.trim() === workflow.name) {
      setIsEditing(false)
      setEditValue(workflow.name)
      return
    }

    setIsRenaming(true)
    try {
      await updateWorkflow(workflow.id, { name: editValue.trim() })
      logger.info(`Successfully renamed workflow from "${workflow.name}" to "${editValue.trim()}"`)
      setIsEditing(false)
    } catch (error) {
      logger.error('Failed to rename workflow:', {
        error,
        workflowId: workflow.id,
        oldName: workflow.name,
        newName: editValue.trim(),
      })
      // Reset to original name on error
      setEditValue(workflow.name)
    } finally {
      setIsRenaming(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue(workflow.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleInputBlur = () => {
    handleSaveEdit()
  }

  const handleClick = (e: React.MouseEvent) => {
    if (dragStartedRef.current || isEditing) {
      e.preventDefault()
      return
    }

    if (e.shiftKey) {
      e.preventDefault()
      toggleWorkflowSelection(workflow.id)
    } else {
      if (!isSelected || selectedWorkflows.size > 1) {
        selectOnly(workflow.id)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (isMarketplace || isEditing) return

    dragStartedRef.current = true
    setIsDragging(true)

    let workflowIds: string[]
    if (isSelected && selectedWorkflows.size > 1) {
      workflowIds = Array.from(selectedWorkflows)
    } else {
      workflowIds = [workflow.id]
    }

    e.dataTransfer.setData('workflow-ids', JSON.stringify(workflowIds))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    requestAnimationFrame(() => {
      dragStartedRef.current = false
    })
  }

  return (
    <div className='mb-1'>
      <div
        className={clsx(
          'group flex h-8 cursor-pointer items-center rounded-[8px] px-2 py-2 font-medium font-sans text-sm transition-colors',
          active && !isDragOver ? 'bg-muted' : 'hover:bg-muted',
          isSelected && selectedWorkflows.size > 1 && !active && !isDragOver ? 'bg-muted' : '',
          isDragging ? 'opacity-50' : '',
          isFirstItem ? 'mr-[36px]' : ''
        )}
        style={{
          maxWidth: isFirstItem
            ? `${166 - (level >= 0 ? (level + 1) * 20 + 8 : 0) - (level > 0 ? 8 : 0)}px`
            : `${206 - (level >= 0 ? (level + 1) * 20 + 8 : 0) - (level > 0 ? 8 : 0)}px`,
        }}
        draggable={!isMarketplace && !isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-workflow-id={workflow.id}
      >
        <Link
          href={`/arena/${workspaceId}/zelaxy/${workflow.id}`}
          className='flex min-w-0 flex-1 items-center'
          onClick={handleClick}
        >
          {(() => {
            const SpaceIcon = getSpaceIcon(workflow.id)
            return (
              <SpaceIcon
                className='mr-2 h-[14px] w-[14px] flex-shrink-0'
                style={{ color: workflow.color }}
              />
            )
          })()}
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              className={clsx(
                'min-w-0 flex-1 border-0 bg-transparent p-0 font-medium font-sans text-sm outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
                active && !isDragOver
                  ? 'text-foreground'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
              maxLength={100}
              disabled={isRenaming}
              onClick={(e) => e.preventDefault()} // Prevent navigation when clicking input
              autoComplete='off'
              autoCorrect='off'
              autoCapitalize='off'
              spellCheck='false'
            />
          ) : !isDragging ? (
            <Tooltip delayDuration={1000}>
              <TooltipTrigger asChild>
                <span
                  className={clsx(
                    'min-w-0 flex-1 select-none truncate pr-1 font-medium font-sans text-sm',
                    active && !isDragOver
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {workflow.name}
                  {isMarketplace && ' (Preview)'}
                </span>
              </TooltipTrigger>
              <TooltipContent side='top' align='start' sideOffset={10}>
                <p>
                  {workflow.name}
                  {isMarketplace && ' (Preview)'}
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span
              className={clsx(
                'min-w-0 flex-1 select-none truncate pr-1 font-medium font-sans text-sm',
                active && !isDragOver
                  ? 'text-foreground'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              {workflow.name}
              {isMarketplace && ' (Preview)'}
            </span>
          )}
        </Link>

        {!isMarketplace && !isEditing && isHovered && userPermissions.canEdit && (
          <div className='flex items-center justify-center' onClick={(e) => e.stopPropagation()}>
            <Button
              variant='ghost'
              size='icon'
              className='h-4 w-4 p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground'
              onClick={(e) => {
                e.stopPropagation()
                handleStartEdit()
              }}
            >
              <Pencil className='!h-3.5 !w-3.5' />
              <span className='sr-only'>Rename workflow</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
