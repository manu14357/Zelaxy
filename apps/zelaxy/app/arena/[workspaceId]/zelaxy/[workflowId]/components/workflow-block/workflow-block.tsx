import { useEffect, useMemo, useRef, useState } from 'react'
import { Handle, type Node, type NodeProps, Position, useUpdateNodeInternals } from '@xyflow/react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { parseCronToHumanReadable } from '@/lib/schedules/utils'
import { cn, validateName } from '@/lib/utils'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import type { BlockConfig, SubBlockConfig, SubBlockType } from '@/blocks/types'
import { useCollaborativeWorkflow } from '@/hooks/use-collaborative-workflow'
import { useExecutionStore } from '@/stores/execution/store'
import { usePanelStore } from '@/stores/panel/store'
import { useWorkflowDiffStore } from '@/stores/workflow-diff'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useSubBlockStore } from '@/stores/workflows/subblock/store'
import { mergeSubblockState } from '@/stores/workflows/utils'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import { useCurrentWorkflow } from '../../hooks'
import { ActionBar } from './components/action-bar/action-bar'
import { ConnectionBlocks } from './components/connection-blocks/connection-blocks'

interface WorkflowBlockProps {
  [key: string]: unknown
  type: string
  config: BlockConfig
  name: string
  isActive?: boolean
  isPending?: boolean
  isPreview?: boolean
  subBlockValues?: Record<string, any>
  blockState?: any // Block state data passed in preview mode
}

type WorkflowBlockNode = Node<WorkflowBlockProps, 'workflowBlock'>

// Combine both interfaces into a single component
export function WorkflowBlock({ id, data }: NodeProps<WorkflowBlockNode>) {
  const { type, config, name, isActive: dataIsActive, isPending } = data

  // State management
  const [isConnecting, setIsConnecting] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isLoadingScheduleInfo, setIsLoadingScheduleInfo] = useState(false)
  const [scheduleInfo, setScheduleInfo] = useState<{
    scheduleTiming: string
    nextRunAt: string | null
    lastRanAt: string | null
    timezone: string
    status?: string
    isDisabled?: boolean
    id?: string
  } | null>(null)
  const [webhookInfo, setWebhookInfo] = useState<{
    webhookPath: string
    provider: string
  } | null>(null)

  // Refs
  const blockRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const updateNodeInternals = useUpdateNodeInternals()

  // Workflow store selectors
  const lastUpdate = useWorkflowStore((state) => state.lastUpdate)

  // Use the clean abstraction for current workflow state
  const currentWorkflow = useCurrentWorkflow()
  const currentBlock = currentWorkflow.getBlockById(id)

  // In preview mode, use the blockState provided; otherwise use current workflow state
  const isEnabled = data.isPreview
    ? (data.blockState?.enabled ?? true)
    : (currentBlock?.enabled ?? true)

  // Get diff status from the block itself (set by diff engine)
  const diffStatus =
    currentWorkflow.isDiffMode && currentBlock ? (currentBlock as any).is_diff : undefined

  // Get field-level diff information
  const fieldDiff =
    currentWorkflow.isDiffMode && currentBlock ? (currentBlock as any).field_diffs : undefined

  // Debug: Log diff status for this block
  useEffect(() => {
    if (currentWorkflow.isDiffMode) {
      console.log(`[WorkflowBlock ${id}] Diff status:`, {
        blockId: id,
        blockName: currentBlock?.name,
        isDiffMode: currentWorkflow.isDiffMode,
        diffStatus,
        hasFieldDiff: !!fieldDiff,
        timestamp: Date.now(),
      })
    }
  }, [id, currentWorkflow.isDiffMode, diffStatus, fieldDiff, currentBlock?.name])

  // Check if this block is marked for deletion (in original workflow, not diff)
  const diffAnalysis = useWorkflowDiffStore((state) => state.diffAnalysis)
  const isShowingDiff = useWorkflowDiffStore((state) => state.isShowingDiff)
  const isDeletedBlock = !isShowingDiff && diffAnalysis?.deleted_blocks?.includes(id)

  // Debug: Log when in diff mode or when blocks are marked for deletion
  useEffect(() => {
    if (currentWorkflow.isDiffMode) {
      console.log(
        `[WorkflowBlock ${id}] Diff mode active, block exists: ${!!currentBlock}, diff status: ${diffStatus}`
      )
      if (fieldDiff) {
        console.log(`[WorkflowBlock ${id}] Field diff:`, fieldDiff)
      }
    }
    if (diffAnalysis && !isShowingDiff) {
      console.log(`[WorkflowBlock ${id}] Diff analysis available in original workflow:`, {
        deleted_blocks: diffAnalysis.deleted_blocks,
        isDeletedBlock,
        isShowingDiff,
      })
    }
    if (isDeletedBlock) {
      console.log(`[WorkflowBlock ${id}] Block marked for deletion in original workflow`)
    }
  }, [
    currentWorkflow.isDiffMode,
    currentBlock,
    diffStatus,
    fieldDiff || null,
    isDeletedBlock,
    diffAnalysis,
    isShowingDiff,
    id,
  ])
  const horizontalHandles = data.isPreview
    ? (data.blockState?.horizontalHandles ?? true) // In preview mode, use blockState and default to horizontal
    : useWorkflowStore((state) => state.blocks[id]?.horizontalHandles ?? true) // Changed default to true for consistency
  const isWide = useWorkflowStore((state) => state.blocks[id]?.isWide ?? false)
  const blockHeight = useWorkflowStore((state) => state.blocks[id]?.height ?? 0)
  // Get per-block webhook status by checking if webhook is configured
  const activeWorkflowId = useWorkflowRegistry((state) => state.activeWorkflowId)

  const hasWebhookProvider = useSubBlockStore(
    (state) => state.workflowValues[activeWorkflowId || '']?.[id]?.webhookProvider
  )
  const hasWebhookPath = useSubBlockStore(
    (state) => state.workflowValues[activeWorkflowId || '']?.[id]?.webhookPath
  )
  const blockWebhookStatus = !!(hasWebhookProvider && hasWebhookPath)

  // Read switch cases from sub-block store for rendering dynamic handles
  const switchCasesRaw = useSubBlockStore((state) =>
    type === 'switch' ? state.workflowValues[activeWorkflowId || '']?.[id]?.cases : null
  )
  const switchCases = useMemo(() => {
    if (!switchCasesRaw || typeof switchCasesRaw !== 'string') return []
    try {
      const parsed = JSON.parse(switchCasesRaw)
      if (Array.isArray(parsed) && parsed.length > 0 && 'id' in parsed[0])
        return parsed as { id: string; title: string; value: string }[]
    } catch {}
    return []
  }, [switchCasesRaw])

  const blockAdvancedMode = useWorkflowStore((state) => state.blocks[id]?.advancedMode ?? false)
  const blockTriggerMode = useWorkflowStore((state) => state.blocks[id]?.triggerMode ?? false)

  // Collaborative workflow actions
  const {
    collaborativeUpdateBlockName,
    collaborativeToggleBlockWide,
    collaborativeToggleBlockAdvancedMode,
    collaborativeToggleBlockTriggerMode,
  } = useCollaborativeWorkflow()

  // Workflow store actions
  const updateBlockHeight = useWorkflowStore((state) => state.updateBlockHeight)

  // Execution store
  const isActiveBlock = useExecutionStore((state) => state.activeBlockIds.has(id))
  const isActive = dataIsActive || isActiveBlock

  // Panel store for node selection
  const setSelectedNodeId = usePanelStore((state) => state.setSelectedNodeId)
  const setActiveTab = usePanelStore((state) => state.setActiveTab)
  const togglePanel = usePanelStore((state) => state.togglePanel)
  const isOpen = usePanelStore((state) => state.isOpen)

  // Get the current workflow ID from URL params instead of global state
  // This prevents race conditions when switching workflows rapidly
  const params = useParams()
  const currentWorkflowId = params.workflowId as string

  // Check if this is a starter block or trigger block
  const isStarterBlock = type === 'starter'
  const isTriggerBlock = config.category === 'triggers'
  const isWebhookTriggerBlock = type === 'webhook'

  const reactivateSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reactivate' }),
      })

      if (response.ok) {
        // Use the current workflow ID from params instead of global state
        if (currentWorkflowId) {
          fetchScheduleInfo(currentWorkflowId)
        }
      } else {
        console.error('Failed to reactivate schedule')
      }
    } catch (error) {
      console.error('Error reactivating schedule:', error)
    }
  }

  const disableSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disable' }),
      })

      if (response.ok) {
        // Refresh schedule info to show updated status
        if (currentWorkflowId) {
          fetchScheduleInfo(currentWorkflowId)
        }
      } else {
        console.error('Failed to disable schedule')
      }
    } catch (error) {
      console.error('Error disabling schedule:', error)
    }
  }

  const fetchScheduleInfo = async (workflowId: string) => {
    if (!workflowId) return

    try {
      setIsLoadingScheduleInfo(true)

      // For schedule trigger blocks, always include the blockId parameter
      const url = new URL('/api/schedules', window.location.origin)
      url.searchParams.set('workflowId', workflowId)
      url.searchParams.set('mode', 'schedule')
      url.searchParams.set('blockId', id) // Always include blockId for schedule blocks

      const response = await fetch(url.toString(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        setScheduleInfo(null)
        return
      }

      const data = await response.json()

      if (!data.schedule) {
        setScheduleInfo(null)
        return
      }

      let scheduleTiming = 'Unknown schedule'
      if (data.schedule.cronExpression) {
        scheduleTiming = parseCronToHumanReadable(data.schedule.cronExpression)
      }

      const baseInfo = {
        scheduleTiming,
        nextRunAt: data.schedule.nextRunAt as string | null,
        lastRanAt: data.schedule.lastRanAt as string | null,
        timezone: data.schedule.timezone || 'UTC',
        status: data.schedule.status as string,
        isDisabled: data.schedule.status === 'disabled',
        id: data.schedule.id as string,
      }

      try {
        const statusRes = await fetch(`/api/schedules/${baseInfo.id}/status`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })

        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setScheduleInfo({
            scheduleTiming: baseInfo.scheduleTiming,
            nextRunAt: statusData.nextRunAt ?? baseInfo.nextRunAt,
            lastRanAt: statusData.lastRanAt ?? baseInfo.lastRanAt,
            timezone: baseInfo.timezone,
            status: statusData.status ?? baseInfo.status,
            isDisabled: statusData.isDisabled ?? baseInfo.isDisabled,
            id: baseInfo.id,
          })
          return
        }
      } catch (err) {
        console.error('Error fetching schedule status:', err)
      }

      setScheduleInfo(baseInfo)
    } catch (error) {
      console.error('Error fetching schedule info:', error)
      setScheduleInfo(null)
    } finally {
      setIsLoadingScheduleInfo(false)
    }
  }

  useEffect(() => {
    if (type === 'schedule' && currentWorkflowId) {
      fetchScheduleInfo(currentWorkflowId)
    } else {
      setScheduleInfo(null)
      setIsLoadingScheduleInfo(false) // Reset loading state when not a schedule block
    }

    // Cleanup function to reset loading state when component unmounts or workflow changes
    return () => {
      setIsLoadingScheduleInfo(false)
    }
  }, [isStarterBlock, isTriggerBlock, type, currentWorkflowId, lastUpdate])

  // Get webhook information for the tooltip
  useEffect(() => {
    if (!blockWebhookStatus) {
      setWebhookInfo(null)
    }
  }, [blockWebhookStatus])

  // Update node internals when handles change
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, horizontalHandles, updateNodeInternals, switchCases])

  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Add effect to observe size changes with debounced updates
  useEffect(() => {
    if (!contentRef.current) return

    let rafId: number
    const debouncedUpdate = debounce((height: number) => {
      if (height !== blockHeight) {
        updateBlockHeight(id, height)
        updateNodeInternals(id)
      }
    }, 100)

    const resizeObserver = new ResizeObserver((entries) => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      // Schedule the update on the next animation frame
      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          const height =
            entry.borderBoxSize[0]?.blockSize ?? entry.target.getBoundingClientRect().height
          debouncedUpdate(height)
        }
      })
    })

    resizeObserver.observe(contentRef.current)

    return () => {
      resizeObserver.disconnect()
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [id, blockHeight, updateBlockHeight, updateNodeInternals, lastUpdate])

  // SubBlock layout management
  function groupSubBlocks(subBlocks: SubBlockConfig[], blockId: string) {
    const rows: SubBlockConfig[][] = []
    let currentRow: SubBlockConfig[] = []
    let currentRowWidth = 0

    // Get the appropriate state for conditional evaluation
    let stateToUse: Record<string, any> = {}

    if (data.isPreview && data.subBlockValues) {
      // In preview mode, use the preview values
      stateToUse = data.subBlockValues
    } else if (currentWorkflow.isDiffMode && currentBlock) {
      // In diff mode, use the diff workflow's subblock values
      stateToUse = currentBlock.subBlocks || {}
    } else {
      // In normal mode, use merged state
      const blocks = useWorkflowStore.getState().blocks
      const activeWorkflowId = useWorkflowRegistry.getState().activeWorkflowId || undefined
      const mergedState = mergeSubblockState(blocks, activeWorkflowId, blockId)[blockId]
      stateToUse = mergedState?.subBlocks || {}
    }

    const isAdvancedMode = useWorkflowStore.getState().blocks[blockId]?.advancedMode ?? false
    const isTriggerMode = useWorkflowStore.getState().blocks[blockId]?.triggerMode ?? false

    // Filter visible blocks and those that meet their conditions
    const visibleSubBlocks = subBlocks.filter((block) => {
      if (block.hidden) return false

      // Special handling for trigger mode
      if (block.type === ('trigger-config' as SubBlockType)) {
        // Show trigger-config blocks when in trigger mode OR for pure trigger blocks
        const isPureTriggerBlock = config?.triggers?.enabled && config.category === 'triggers'
        return isTriggerMode || isPureTriggerBlock
      }

      if (isTriggerMode && block.type !== ('trigger-config' as SubBlockType)) {
        // In trigger mode, hide all non-trigger-config blocks
        return false
      }

      // Filter by mode if specified
      if (block.mode) {
        if (block.mode === 'basic' && isAdvancedMode) return false
        if (block.mode === 'advanced' && !isAdvancedMode) return false
      }

      // If there's no condition, the block should be shown
      if (!block.condition) return true

      // If condition is a function, call it to get the actual condition object
      const actualCondition =
        typeof block.condition === 'function' ? block.condition() : block.condition

      // Get the values of the fields this block depends on from the appropriate state
      const rawFieldValue = stateToUse[actualCondition.field]?.value
      // Treat null/undefined as false for boolean conditions (switches initialize with null)
      const fieldValue =
        rawFieldValue === null || rawFieldValue === undefined
          ? typeof actualCondition.value === 'boolean'
            ? false
            : rawFieldValue
          : rawFieldValue
      const rawAndFieldValue = actualCondition.and
        ? stateToUse[actualCondition.and.field]?.value
        : undefined
      const andFieldValue =
        rawAndFieldValue === null || rawAndFieldValue === undefined
          ? actualCondition.and && typeof actualCondition.and.value === 'boolean'
            ? false
            : rawAndFieldValue
          : rawAndFieldValue

      // Check if the condition value is an array
      const isValueMatch = Array.isArray(actualCondition.value)
        ? fieldValue != null &&
          (actualCondition.not
            ? !actualCondition.value.includes(fieldValue as string | number | boolean)
            : actualCondition.value.includes(fieldValue as string | number | boolean))
        : actualCondition.not
          ? fieldValue !== actualCondition.value
          : fieldValue === actualCondition.value

      // Check both conditions if 'and' is present
      const isAndValueMatch =
        !actualCondition.and ||
        (Array.isArray(actualCondition.and.value)
          ? andFieldValue != null &&
            (actualCondition.and.not
              ? !actualCondition.and.value.includes(andFieldValue as string | number | boolean)
              : actualCondition.and.value.includes(andFieldValue as string | number | boolean))
          : actualCondition.and.not
            ? andFieldValue !== actualCondition.and.value
            : andFieldValue === actualCondition.and.value)

      return isValueMatch && isAndValueMatch
    })

    visibleSubBlocks.forEach((block) => {
      const blockWidth = block.layout === 'half' ? 0.5 : 1
      if (currentRowWidth + blockWidth > 1) {
        if (currentRow.length > 0) {
          rows.push([...currentRow])
        }
        currentRow = [block]
        currentRowWidth = blockWidth
      } else {
        currentRow.push(block)
        currentRowWidth += blockWidth
      }
    })

    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    return rows
  }

  const subBlockRows = groupSubBlocks(config.subBlocks, id)

  // Name editing handlers
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent drag handler from interfering
    setEditedName(name)
    setIsEditing(true)
  }

  // Auto-focus the input when edit mode is activated
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isEditing])

  // Handle node name change with validation
  const handleNodeNameChange = (newName: string) => {
    const validatedName = validateName(newName)
    setEditedName(validatedName.slice(0, 18))
  }

  const handleNameSubmit = () => {
    const trimmedName = editedName.trim().slice(0, 18)
    if (trimmedName && trimmedName !== name) {
      collaborativeUpdateBlockName(id, trimmedName)
    }
    setIsEditing(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  // Check webhook indicator
  const showWebhookIndicator = (isStarterBlock || isWebhookTriggerBlock) && blockWebhookStatus

  const getProviderName = (providerId: string): string => {
    const providers: Record<string, string> = {
      whatsapp: 'WhatsApp',
      github: 'GitHub',
      discord: 'Discord',
      stripe: 'Stripe',
      generic: 'General',
      slack: 'Slack',
      airtable: 'Airtable',
      gmail: 'Gmail',
    }
    return providers[providerId] || 'Webhook'
  }

  const shouldShowScheduleBadge =
    type === 'schedule' && !isLoadingScheduleInfo && scheduleInfo !== null
  const userPermissions = useUserPermissionsContext()

  // Handle block selection - open Properties tab in panel
  const handleBlockClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
      return
    }

    setSelectedNodeId(id)
    setActiveTab('properties')
    if (!isOpen) {
      togglePanel()
    }
  }

  return (
    <div className='group relative'>
      <Card
        ref={blockRef}
        onClick={handleBlockClick}
        className={cn(
          'relative cursor-pointer select-none',
          'transition-all duration-200 ease-out',
          isWide ? 'w-[240px]' : 'w-[180px]',
          type !== 'switch' && 'h-[80px]',
          !isEnabled && 'opacity-50 grayscale-[30%]',
          isActive && 'shadow-[0_0_12px_-2px_rgba(249,115,22,0.25)] ring-[2px] ring-primary/80',
          isPending && 'shadow-[0_0_12px_-2px_rgba(245,158,11,0.25)] ring-[2px] ring-amber-400/80',
          // Diff highlighting
          diffStatus === 'new' &&
            'bg-emerald-50/30 ring-[2px] ring-emerald-500 dark:bg-emerald-950/20',
          diffStatus === 'edited' &&
            'bg-orange-50/30 ring-[2px] ring-orange-400 dark:bg-orange-950/20',
          // Deleted block highlighting
          isDeletedBlock && 'bg-red-50/30 ring-[2px] ring-red-400 dark:bg-red-950/20',
          'z-[20] rounded-2xl border border-[hsl(var(--block-border))]',
          'bg-background/98 backdrop-blur-sm',
          'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.04)]',
          'hover:border-[hsl(var(--block-border-hover))] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.05)]',
          'hover:-translate-y-[1px]'
        )}
        style={
          type === 'switch'
            ? { height: `${Math.max(80, 40 + switchCases.length * 28)}px` }
            : undefined
        }
      >
        {/* Show debug indicator for pending blocks */}
        {isPending && (
          <div className='-top-6 -translate-x-1/2 absolute left-1/2 z-10 transform rounded-full bg-amber-500 px-2.5 py-0.5 text-white text-xs'>
            Next Step
          </div>
        )}

        <ActionBar blockId={id} blockType={type} disabled={!userPermissions.canEdit} />
        {/* Connection Blocks - Don't show for trigger blocks, starter blocks, or blocks in trigger mode */}
        {config.category !== 'triggers' && type !== 'starter' && !blockTriggerMode && (
          <ConnectionBlocks
            blockId={id}
            setIsConnecting={setIsConnecting}
            isDisabled={!userPermissions.canEdit}
            horizontalHandles={horizontalHandles}
          />
        )}

        {/* Input Handle - Don't show for trigger blocks, starter blocks, or blocks in trigger mode */}
        {config.category !== 'triggers' && type !== 'starter' && !blockTriggerMode && (
          <Handle
            type='target'
            position={horizontalHandles ? Position.Left : Position.Top}
            id='target'
            className={cn(
              horizontalHandles ? '!w-3 !h-5' : '!w-5 !h-3',
              '!bg-orange-300 dark:!bg-orange-400/80 !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.12)]',
              '!z-[30]',
              '!pointer-events-auto',
              'group-hover:!bg-primary group-hover:!shadow-[0_0_10px_rgba(249,115,22,0.4)]',
              horizontalHandles
                ? 'hover:!w-3.5 hover:!h-6 hover:!bg-primary'
                : 'hover:!w-6 hover:!h-3.5 hover:!bg-primary',
              '!cursor-crosshair',
              'transition-all duration-200 ease-out'
            )}
            style={{
              ...(horizontalHandles
                ? { left: '-6px', top: '50%', transform: 'translateY(-50%)' }
                : { top: '-6px', left: '50%', transform: 'translateX(-50%)' }),
            }}
            data-nodeid={id}
            data-handleid='target'
            isConnectableStart={false}
            isConnectableEnd={true}
            isValidConnection={(connection) => connection.source !== id}
          />
        )}

        {/* Block Header */}
        <div
          className='workflow-drag-handle flex h-full cursor-grab items-center justify-between p-3'
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
        >
          <div className='flex min-w-0 flex-1 items-center gap-2.5'>
            <div
              className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm',
                !isEnabled && 'bg-muted-foreground/30'
              )}
              {...(isEnabled && { style: { backgroundColor: config.bgColor } })}
            >
              <config.icon className='h-4.5 w-4.5 text-white drop-shadow-sm' />
            </div>
            <div className='min-w-0 flex-1'>
              {isEditing ? (
                <input
                  ref={nameInputRef}
                  type='text'
                  value={editedName}
                  onChange={(e) => handleNodeNameChange(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={handleNameKeyDown}
                  className='w-full border-none bg-transparent p-0 font-semibold text-[13px] text-foreground leading-normal antialiased outline-none'
                  maxLength={20}
                  placeholder='Node name'
                  title='Enter node name'
                />
              ) : (
                <span
                  className={cn(
                    'block cursor-text truncate font-semibold text-[13px] tracking-tight',
                    'leading-normal antialiased',
                    !isEnabled ? 'text-muted-foreground' : 'text-foreground',
                    'select-none'
                  )}
                  onClick={handleNameClick}
                  title={name}
                >
                  {name}
                </span>
              )}
            </div>
          </div>
          <div className='flex flex-shrink-0 items-center gap-1.5'>
            {!isEnabled && (
              <Badge
                variant='secondary'
                className='bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground antialiased hover:bg-muted'
              >
                Off
              </Badge>
            )}
            {/* Schedule indicator badge - displayed for starter blocks with active schedules */}
            {shouldShowScheduleBadge && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className={cn(
                      'flex cursor-pointer items-center gap-1 px-2 py-0.5 font-medium text-xs antialiased',
                      scheduleInfo?.isDisabled
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
                        : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                    )}
                    onClick={
                      scheduleInfo?.id
                        ? scheduleInfo.isDisabled
                          ? () => reactivateSchedule(scheduleInfo.id!)
                          : () => disableSchedule(scheduleInfo.id!)
                        : undefined
                    }
                  >
                    <div className='relative flex items-center justify-center'>
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          scheduleInfo?.isDisabled ? 'bg-amber-500' : 'bg-green-500'
                        )}
                      />
                    </div>
                    {scheduleInfo?.isDisabled ? 'Disabled' : 'Scheduled'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-[300px] p-4'>
                  {scheduleInfo?.isDisabled ? (
                    <p className='text-sm'>
                      This schedule is currently disabled. Click the badge to reactivate it.
                    </p>
                  ) : (
                    <p className='text-sm'>Click the badge to disable this schedule.</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            {/* Webhook indicator badge - displayed for starter blocks with active webhooks */}
            {showWebhookIndicator && (
              <Badge
                variant='outline'
                className='flex items-center gap-1 border-green-200 bg-green-50 px-2 py-0.5 font-medium text-green-700 text-xs antialiased hover:bg-green-50 dark:bg-green-900/20 dark:text-green-400'
              >
                <div className='relative flex items-center justify-center'>
                  <div className='h-1.5 w-1.5 rounded-full bg-green-500' />
                </div>
              </Badge>
            )}
            {/* Removed Advanced Mode, Documentation, Info, and Expand icons for cleaner UI */}
          </div>
        </div>

        {/* Output Handle */}
        {type !== 'response' && (
          <>
            {/* Switch blocks have dynamic case handles */}
            {type === 'switch' ? (
              <>
                {switchCases.map((c, index) => {
                  const isDefault = c.title?.toLowerCase() === 'default'
                  const total = switchCases.length
                  const handleTopPercent = total <= 1 ? 50 : 15 + (index / (total - 1)) * 70
                  return (
                    <Handle
                      key={`case-${c.id}`}
                      type='source'
                      position={horizontalHandles ? Position.Right : Position.Bottom}
                      id={`case-${c.id}`}
                      className={cn(
                        horizontalHandles ? '!w-3 !h-5' : '!w-5 !h-3',
                        isDefault
                          ? '!bg-slate-500 dark:!bg-slate-400'
                          : '!bg-violet-500 dark:!bg-violet-400',
                        '!rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.12)]',
                        '!z-[30]',
                        '!pointer-events-auto',
                        isDefault
                          ? 'group-hover:!bg-slate-600 group-hover:!shadow-[0_0_8px_rgba(100,116,139,0.35)]'
                          : 'group-hover:!bg-violet-600 group-hover:!shadow-[0_0_8px_rgba(139,92,246,0.35)]',
                        horizontalHandles ? 'hover:!w-3.5 hover:!h-6' : 'hover:!w-6 hover:!h-3.5',
                        '!cursor-crosshair',
                        'transition-all duration-150 ease-out'
                      )}
                      style={{
                        ...(horizontalHandles
                          ? {
                              right: '-6px',
                              top: `${handleTopPercent}%`,
                              transform: 'translateY(-50%)',
                            }
                          : {
                              bottom: '-6px',
                              left: `${handleTopPercent}%`,
                              transform: 'translateX(-50%)',
                            }),
                      }}
                      data-nodeid={id}
                      data-handleid={`case-${c.id}`}
                      isConnectableStart={true}
                      isConnectableEnd={false}
                      isValidConnection={(connection) => connection.target !== id}
                    />
                  )
                })}
              </>
            ) : type === 'condition' ? (
              <>
                {/* True Handle */}
                <Handle
                  type='source'
                  position={horizontalHandles ? Position.Right : Position.Bottom}
                  id='true'
                  className={cn(
                    horizontalHandles ? '!w-3 !h-5' : '!w-5 !h-3',
                    '!bg-emerald-500 dark:!bg-emerald-400 !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.12)]',
                    '!z-[30]',
                    '!pointer-events-auto',
                    'group-hover:!bg-emerald-600 group-hover:!shadow-[0_0_8px_rgba(16,185,129,0.35)]',
                    horizontalHandles
                      ? 'hover:!w-3.5 hover:!h-6 hover:!bg-emerald-600'
                      : 'hover:!w-6 hover:!h-3.5 hover:!bg-emerald-600',
                    '!cursor-crosshair',
                    'transition-all duration-150 ease-out'
                  )}
                  style={{
                    ...(horizontalHandles
                      ? {
                          right: '-6px',
                          top: '35%',
                          transform: 'translateY(-50%)',
                        }
                      : {
                          bottom: '-6px',
                          left: '35%',
                          transform: 'translateX(-50%)',
                        }),
                  }}
                  data-nodeid={id}
                  data-handleid='true'
                  isConnectableStart={true}
                  isConnectableEnd={false}
                  isValidConnection={(connection) => connection.target !== id}
                />

                {/* False Handle */}
                <Handle
                  type='source'
                  position={horizontalHandles ? Position.Right : Position.Bottom}
                  id='false'
                  className={cn(
                    horizontalHandles ? '!w-3 !h-5' : '!w-5 !h-3',
                    '!bg-rose-500 dark:!bg-rose-400 !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.12)]',
                    '!z-[30]',
                    '!pointer-events-auto',
                    'group-hover:!bg-rose-600 group-hover:!shadow-[0_0_8px_rgba(244,63,94,0.35)]',
                    horizontalHandles
                      ? 'hover:!w-3.5 hover:!h-6 hover:!bg-rose-600'
                      : 'hover:!w-6 hover:!h-3.5 hover:!bg-rose-600',
                    '!cursor-crosshair',
                    'transition-all duration-150 ease-out'
                  )}
                  style={{
                    position: 'absolute',
                    ...(horizontalHandles
                      ? {
                          right: '-6px',
                          top: '65%',
                          transform: 'translateY(-50%)',
                        }
                      : {
                          bottom: '-6px',
                          left: 'auto',
                          right: '65%',
                          transform: 'translateX(50%)',
                        }),
                  }}
                  data-nodeid={id}
                  data-handleid='false'
                  isConnectableStart={true}
                  isConnectableEnd={false}
                  isValidConnection={(connection) => connection.target !== id}
                />
              </>
            ) : (
              <>
                {/* Regular blocks with source and error handles */}
                <Handle
                  type='source'
                  position={horizontalHandles ? Position.Right : Position.Bottom}
                  id='source'
                  className={cn(
                    // Smaller size when error handle is also present
                    config.category !== 'triggers' && type !== 'starter' && !blockTriggerMode
                      ? horizontalHandles
                        ? '!w-2.5 !h-4'
                        : '!w-4 !h-2.5'
                      : horizontalHandles
                        ? '!w-3 !h-5'
                        : '!w-5 !h-3',
                    '!bg-orange-300 dark:!bg-orange-400/80 !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.12)]',
                    '!z-[30]',
                    '!pointer-events-auto',
                    'group-hover:!bg-primary group-hover:!shadow-[0_0_10px_rgba(249,115,22,0.4)]',
                    horizontalHandles
                      ? 'hover:!w-3.5 hover:!h-6 hover:!bg-primary'
                      : 'hover:!w-6 hover:!h-3.5 hover:!bg-primary',
                    '!cursor-crosshair',
                    'transition-all duration-200 ease-out'
                  )}
                  style={{
                    ...(horizontalHandles
                      ? {
                          right: '-6px',
                          top:
                            config.category !== 'triggers' &&
                            type !== 'starter' &&
                            !blockTriggerMode
                              ? '35%'
                              : '50%',
                          transform: 'translateY(-50%)',
                        }
                      : {
                          bottom: '-6px',
                          left:
                            config.category !== 'triggers' &&
                            type !== 'starter' &&
                            !blockTriggerMode
                              ? '35%'
                              : '50%',
                          transform: 'translateX(-50%)',
                        }),
                  }}
                  data-nodeid={id}
                  data-handleid='source'
                  isConnectableStart={true}
                  isConnectableEnd={false}
                  isValidConnection={(connection) => connection.target !== id}
                />

                {/* Error Handle - Don't show for trigger blocks, starter blocks, or blocks in trigger mode */}
                {config.category !== 'triggers' && type !== 'starter' && !blockTriggerMode && (
                  <Handle
                    type='source'
                    position={horizontalHandles ? Position.Right : Position.Bottom}
                    id='error'
                    className={cn(
                      horizontalHandles ? '!w-2.5 !h-4' : '!w-4 !h-2.5',
                      '!bg-amber-500 dark:!bg-amber-400 !rounded-full !border-2 !border-background !shadow-[0_1px_4px_rgba(0,0,0,0.12)]',
                      '!z-[30]',
                      '!pointer-events-auto',
                      'group-hover:!bg-amber-600 group-hover:!shadow-[0_0_8px_rgba(245,158,11,0.35)]',
                      horizontalHandles
                        ? 'hover:!w-3 hover:!h-5 hover:!bg-amber-600'
                        : 'hover:!w-5 hover:!h-3 hover:!bg-amber-600',
                      '!cursor-crosshair',
                      'transition-all duration-150 ease-out'
                    )}
                    style={{
                      position: 'absolute',
                      ...(horizontalHandles
                        ? {
                            right: '-6px',
                            top: '65%',
                            transform: 'translateY(-50%)',
                          }
                        : {
                            bottom: '-6px',
                            left: 'auto',
                            right: '65%',
                            transform: 'translateX(50%)',
                          }),
                    }}
                    data-nodeid={id}
                    data-handleid='error'
                    isConnectableStart={true}
                    isConnectableEnd={false}
                    isValidConnection={(connection) => connection.target !== id}
                  />
                )}
              </>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
