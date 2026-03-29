import type React from 'react'
import { memo, useMemo, useRef } from 'react'
import { Handle, type NodeProps, Position, useReactFlow } from '@xyflow/react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { LoopIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCurrentWorkflow } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/hooks'
import { useCollaborativeWorkflow } from '@/hooks/use-collaborative-workflow'
import { usePanelStore } from '@/stores/panel/store'

// Add these styles to your existing global CSS file or create a separate CSS module
const LoopNodeStyles: React.FC = () => {
  return (
    <style jsx global>{`
      @keyframes loop-node-pulse {
        0% { box-shadow: 0 0 0 0 rgba(64, 224, 208, 0.3); }
        70% { box-shadow: 0 0 0 6px rgba(64, 224, 208, 0); }
        100% { box-shadow: 0 0 0 0 rgba(64, 224, 208, 0); }
      }
      
      .loop-node-drag-over {
        animation: loop-node-pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        border-style: solid !important;
        background-color: rgba(47, 179, 255, 0.08) !important;
        box-shadow: 0 0 0 8px rgba(47, 179, 255, 0.1);
      }
      
      /* Ensure parent borders are visible when hovering over resize controls */
      .react-flow__node-group:hover,
      .hover-highlight {
        border-color: #1e293b !important;
      }
      
      /* Ensure hover effects work well */
      .group-node-container:hover .react-flow__resize-control.bottom-right {
        opacity: 1 !important;
        visibility: visible !important;
      }
    
      
      /* Prevent jumpy drag behavior */
      .loop-drop-container .react-flow__node {
        transform-origin: center;
        position: absolute;
      }
      
      /* Remove default border from React Flow group nodes */
      .react-flow__node-group {
        border: none !important;
        background-color: transparent !important;
        outline: none !important;
        box-shadow: none !important;
        border-radius: 16px !important;
      }
      
      /* Ensure child nodes stay within parent bounds */
      .react-flow__node[data-parent-node-id] .react-flow__handle {
        z-index: 30;
      }
      
      /* Enhanced drag detection */
      .react-flow__node-group.dragging-over {
        background-color: rgba(34,197,94,0.05);
        transition: all 0.2s ease-in-out;
      }
    `}</style>
  )
}

export const LoopNodeComponent = memo(({ data, selected, id }: NodeProps) => {
  const { getNodes } = useReactFlow()
  const { collaborativeRemoveBlock } = useCollaborativeWorkflow()
  const blockRef = useRef<HTMLDivElement>(null)

  // Panel store for node selection
  const setSelectedNodeId = usePanelStore((state) => state.setSelectedNodeId)
  const setActiveTab = usePanelStore((state) => state.setActiveTab)
  const togglePanel = usePanelStore((state) => state.togglePanel)
  const isOpen = usePanelStore((state) => state.isOpen)

  // Use the clean abstraction for current workflow state
  const currentWorkflow = useCurrentWorkflow()
  const currentBlock = currentWorkflow.getBlockById(id)
  const diffStatus =
    currentWorkflow.isDiffMode && currentBlock ? (currentBlock as any).is_diff : undefined

  // Check if this is preview mode
  const isPreview = data?.isPreview || false

  // Determine nesting level by counting parents
  const nestingLevel = useMemo(() => {
    let level = 0
    let currentParentId = data?.parentId

    while (currentParentId) {
      level++
      const parentNode = getNodes().find((n) => n.id === currentParentId)
      if (!parentNode) break
      currentParentId = parentNode.data?.parentId
    }

    return level
  }, [id, data?.parentId, getNodes])

  // Generate different background styles based on nesting level
  const getNestedStyles = () => {
    // Base styles
    const styles: Record<string, string> = {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    }

    // Apply nested styles
    if (nestingLevel > 0) {
      // Each nesting level gets a different color
      const colors = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569']
      const colorIndex = (nestingLevel - 1) % colors.length

      styles.backgroundColor = `${colors[colorIndex]}30` // Slightly more visible background
    }

    return styles
  }

  const nestedStyles = getNestedStyles()

  // Handle click to show properties
  const handleLoopClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
      return
    }

    // Don't trigger if clicking on drag handles or resize controls
    if ((e.target as HTMLElement).closest('.workflow-drag-handle, .react-flow__resize-control')) {
      return
    }

    setSelectedNodeId(id)
    setActiveTab('properties')
    if (!isOpen) {
      togglePanel()
    }
  }

  return (
    <>
      <LoopNodeStyles />
      <div className='group relative'>
        <Card
          ref={blockRef}
          onClick={handleLoopClick}
          className={cn(
            'relative cursor-default select-none',
            'transition-block-bg transition-ring',
            'z-[20]',
            '!rounded-2xl',
            data?.state === 'valid',
            nestingLevel > 0 &&
              `border border-[0.5px] ${nestingLevel % 2 === 0 ? 'border-slate-300/60 dark:border-slate-700/60' : 'border-slate-400/60 dark:border-slate-600/60'}`,
            !!data?.hasNestedError && 'border-2 border-red-500 bg-red-50/50 dark:bg-red-900/20',
            // Diff highlighting
            diffStatus === 'new' && 'bg-green-50/50 ring-2 ring-green-500 dark:bg-green-900/10',
            diffStatus === 'edited' &&
              'bg-orange-50/50 ring-2 ring-orange-500 dark:bg-orange-900/10'
          )}
          style={{
            width: (data.width as number) || 500,
            height: (data.height as number) || 300,
            position: 'relative',
            overflow: 'visible',
            ...nestedStyles,
            borderRadius: '16px',
            pointerEvents: isPreview ? 'none' : 'all',
          }}
          data-node-id={id}
          data-type='loopNode'
          data-nesting-level={nestingLevel}
        >
          {/* Custom visible resize handle */}
          {!isPreview && (
            <div
              className='absolute right-2 bottom-2 z-20 flex h-8 w-8 cursor-se-resize items-center justify-center text-muted-foreground'
              style={{ pointerEvents: 'auto' }}
            />
          )}

          {/* Loop Header - styled like WorkflowBlock */}
          <div className='workflow-drag-handle absolute top-0 right-0 left-0 z-10 flex cursor-grab items-center justify-between overflow-hidden rounded-t-2xl border-border/40 border-b bg-background/90 p-3 backdrop-blur-xl dark:bg-background/80'>
            <div className='flex min-w-0 flex-1 items-center gap-2.5'>
              <div
                className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg'
                style={{ backgroundColor: '#F97316' }}
              >
                <LoopIcon className='h-3.5 w-3.5 text-white' />
              </div>
              <div className='min-w-0 flex-1'>
                <span className='block select-none truncate font-semibold text-[13px] text-foreground tracking-tight'>
                  Loop
                </span>
              </div>
            </div>

            {/* Delete button */}
            {!isPreview && (
              <Button
                variant='ghost'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  collaborativeRemoveBlock(id)
                }}
                className='h-6 w-6 p-0 text-muted-foreground opacity-0 transition-opacity duration-150 hover:text-destructive group-hover:opacity-100'
                style={{ pointerEvents: 'auto' }}
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            )}
          </div>

          {/* Nested subflow error banner */}
          {!!data?.hasNestedError && (
            <div className='absolute top-[52px] right-0 left-0 z-20 flex items-center gap-2 bg-red-500 px-3 py-1.5 text-white text-xs'>
              <AlertTriangle className='h-3.5 w-3.5 flex-shrink-0' />
              <span className='font-medium'>
                Nested subflows not supported - Remove this block to run workflow
              </span>
            </div>
          )}

          {/* Child nodes container */}
          <div
            className='mt-[60px] h-[calc(100%-60px)] p-4'
            data-dragarea='true'
            style={{
              position: 'relative',
              minHeight: 'calc(100% - 60px)',
              pointerEvents: isPreview ? 'none' : 'auto',
            }}
          />

          {/* Inner left source handle — connects to child blocks inside the loop */}
          <Handle
            type='source'
            position={Position.Right}
            id='loop-start-source'
            className='!w-3 !h-5 !bg-primary dark:!bg-primary !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.15)] !z-[30] !pointer-events-auto hover:!w-3.5 hover:!h-6 hover:!bg-primary/90 !cursor-crosshair transition-all duration-150 ease-out'
            style={{
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'auto',
            }}
            data-parent-id={id}
          />

          {/* Input handle on left middle — receives edge from outside */}
          <Handle
            type='target'
            position={Position.Left}
            className='!w-3 !h-5 !bg-emerald-400 dark:!bg-emerald-400 !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.15)] !z-[30] !pointer-events-auto hover:!w-3.5 hover:!h-6 hover:!bg-emerald-500 !cursor-crosshair transition-all duration-150 ease-out'
            style={{
              left: '-7px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'auto',
            }}
          />

          {/* Output handle on right middle */}
          <Handle
            type='source'
            position={Position.Right}
            className='!w-3 !h-5 !bg-orange-300 dark:!bg-orange-400/80 !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.15)] !z-[30] !pointer-events-auto hover:!w-3.5 hover:!h-6 hover:!bg-primary !cursor-crosshair transition-all duration-150 ease-out'
            style={{
              right: '-7px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'auto',
            }}
            id='loop-end-source'
          />
        </Card>
      </div>
    </>
  )
})

LoopNodeComponent.displayName = 'LoopNodeComponent'
