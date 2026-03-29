'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bug,
  ChevronLeft,
  Copy,
  Play,
  Redo2,
  RefreshCw,
  SkipForward,
  StepForward,
  Store,
  Trash2,
  Undo2,
  WifiOff,
  X,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'
import { useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import {
  DeploymentControls,
  ExportControls,
  TemplateModal,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components'
import { useWorkflowExecution } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/hooks/use-workflow-execution'
import {
  getKeyboardShortcutText,
  useKeyboardShortcuts,
} from '@/app/arena/[workspaceId]/zelaxy/hooks/use-keyboard-shortcuts'
import { useFolderStore } from '@/stores/folders/store'
import { usePanelStore } from '@/stores/panel/store'
import { useGeneralStore } from '@/stores/settings/general/store'
import { useSubscriptionStore } from '@/stores/subscription/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useSubBlockStore } from '@/stores/workflows/subblock/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

const logger = createLogger('ControlBar')

// Cache for usage data to prevent excessive API calls
let usageDataCache: {
  data: any | null
  timestamp: number
  expirationMs: number
} = {
  data: null,
  timestamp: 0,
  // Cache expires after 1 minute
  expirationMs: 60 * 1000,
}

interface ControlBarProps {
  hasValidationErrors?: boolean
}

/**
 * Control bar for managing workflows - handles editing, deletion, deployment,
 * history, notifications and execution.
 */
export function ControlBar({ hasValidationErrors = false }: ControlBarProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const params = useParams()
  const workspaceId = params.workspaceId as string

  // Store hooks
  const {
    history,
    revertToHistoryState,
    lastSaved,
    setNeedsRedeploymentFlag,
    blocks,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWorkflowStore()
  const {
    workflows,
    updateWorkflow,
    activeWorkflowId,
    removeWorkflow,
    duplicateWorkflow,
    setDeploymentStatus,
    isLoading: isRegistryLoading,
  } = useWorkflowRegistry()
  const { isExecuting, handleRunWorkflow, handleCancelExecution } = useWorkflowExecution()
  const { setActiveTab, togglePanel, isOpen, panelWidth } = usePanelStore()
  const { getFolderTree, expandedFolders } = useFolderStore()

  // Calculate dynamic positioning for bottom control bar
  // When panel is open, shift left to avoid overlap while keeping away from left sidebar
  const bottomControlBarClass = useMemo(() => {
    const baseClasses =
      'fixed bottom-6 z-30 flex items-center gap-3 transition-all duration-300 ease-in-out transform -translate-x-1/2'

    if (isOpen) {
      // When panel is open, position in the remaining workspace area
      // Account for both left sidebar (~200px) and right panel (variable width)
      // Increase left offset to provide more clearance from right panel
      if (panelWidth > 400) {
        // Wide panel: position significantly more to the left
        return `${baseClasses} left-[28%]`
      }
      if (panelWidth > 350) {
        // Medium panel: moderate positioning with more space
        return `${baseClasses} left-[32%]`
      }
      // Default panel: safe positioning with good clearance
      return `${baseClasses} left-[35%]`
    }

    // Panel closed: position in center of available workspace (accounting for left sidebar)
    // Left sidebar is ~200px, so center of remaining space is around 60% of total width
    return `${baseClasses} left-[60%]`
  }, [isOpen, panelWidth])

  // User permissions - use stable activeWorkspaceId from registry instead of deriving from currentWorkflow
  const userPermissions = useUserPermissionsContext()

  // Debug mode state
  const { isDebugModeEnabled, toggleDebugMode } = useGeneralStore()
  const { isDebugging, pendingBlocks, handleStepDebug, handleCancelDebug, handleResumeDebug } =
    useWorkflowExecution()

  // Local state
  const [mounted, setMounted] = useState(false)
  const [, forceUpdate] = useState({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  // Deployed state management
  const [deployedState, setDeployedState] = useState<WorkflowState | null>(null)
  const [isLoadingDeployedState, setIsLoadingDeployedState] = useState<boolean>(false)

  // Change detection state
  const [changeDetected, setChangeDetected] = useState(false)

  // Usage limit state
  const [usageExceeded, setUsageExceeded] = useState(false)
  const [usageData, setUsageData] = useState<{
    percentUsed: number
    isWarning: boolean
    isExceeded: boolean
    currentUsage: number
    limit: number
  } | null>(null)

  // Helper function to open console panel in the left sidebar
  const openConsolePanel = useCallback(() => {
    // Dispatch custom event to open console in left sidebar
    const event = new CustomEvent('open-console-panel')
    window.dispatchEvent(event)
  }, [])

  // Shared condition for keyboard shortcut and button disabled state
  const isWorkflowBlocked = isExecuting || hasValidationErrors

  // Register keyboard shortcuts for running workflow and undo/redo
  useKeyboardShortcuts(
    () => {
      if (!isWorkflowBlocked) {
        openConsolePanel()
        handleRunWorkflow()
      }
    },
    isWorkflowBlocked,
    { onUndo: undo, onRedo: redo }
  )

  // // Check if the current user is the owner of the published workflow
  // const isWorkflowOwner = () => {
  //   const marketplaceData = getMarketplaceData()
  //   return marketplaceData?.status === 'owner'
  // }

  // Get deployment status from registry
  const deploymentStatus = useWorkflowRegistry((state) =>
    state.getWorkflowDeploymentStatus(activeWorkflowId)
  )
  const isDeployed = deploymentStatus?.isDeployed || false

  // Client-side only rendering for the timestamp
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update the time display every minute
  useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 60000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Fetches the deployed state of the workflow from the server
   * This is the single source of truth for deployed workflow state
   */
  const fetchDeployedState = async () => {
    if (!activeWorkflowId || !isDeployed) {
      setDeployedState(null)
      return
    }

    // Store the workflow ID at the start of the request to prevent race conditions
    const requestWorkflowId = activeWorkflowId

    // Helper to get current active workflow ID for race condition checks
    const getCurrentActiveWorkflowId = () => useWorkflowRegistry.getState().activeWorkflowId

    try {
      setIsLoadingDeployedState(true)

      const response = await fetch(`/api/workflows/${requestWorkflowId}/deployed`)

      // Check if the workflow ID changed during the request (user navigated away)
      if (requestWorkflowId !== getCurrentActiveWorkflowId()) {
        logger.debug('Workflow changed during deployed state fetch, ignoring response')
        return
      }

      if (!response.ok) {
        if (response.status === 404) {
          setDeployedState(null)
          return
        }
        throw new Error(`Failed to fetch deployed state: ${response.statusText}`)
      }

      const data = await response.json()

      if (requestWorkflowId === getCurrentActiveWorkflowId()) {
        setDeployedState(data.deployedState || null)
      } else {
        logger.debug('Workflow changed after deployed state response, ignoring result')
      }
    } catch (error) {
      logger.error('Error fetching deployed state:', { error })
      if (requestWorkflowId === getCurrentActiveWorkflowId()) {
        setDeployedState(null)
      }
    } finally {
      if (requestWorkflowId === getCurrentActiveWorkflowId()) {
        setIsLoadingDeployedState(false)
      }
    }
  }

  useEffect(() => {
    if (!activeWorkflowId) {
      setDeployedState(null)
      setIsLoadingDeployedState(false)
      return
    }

    if (isRegistryLoading) {
      setDeployedState(null)
      setIsLoadingDeployedState(false)
      return
    }

    if (isDeployed) {
      setNeedsRedeploymentFlag(false)
      fetchDeployedState()
    } else {
      setDeployedState(null)
      setIsLoadingDeployedState(false)
    }
  }, [activeWorkflowId, isDeployed, setNeedsRedeploymentFlag, isRegistryLoading])

  // Get current store state for change detection
  const currentBlocks = useWorkflowStore((state) => state.blocks)
  const subBlockValues = useSubBlockStore((state) =>
    activeWorkflowId ? state.workflowValues[activeWorkflowId] : null
  )

  useEffect(() => {
    if (!activeWorkflowId || !deployedState) {
      setChangeDetected(false)
      return
    }

    if (isLoadingDeployedState) {
      return
    }

    // Use the workflow status API to get accurate change detection
    // This uses the same logic as the deployment API (reading from normalized tables)
    const checkForChanges = async () => {
      try {
        const response = await fetch(`/api/workflows/${activeWorkflowId}/status`)
        if (response.ok) {
          const data = await response.json()
          setChangeDetected(data.needsRedeployment || false)
        } else {
          logger.error('Failed to fetch workflow status:', response.status, response.statusText)
          setChangeDetected(false)
        }
      } catch (error) {
        logger.error('Error fetching workflow status:', error)
        setChangeDetected(false)
      }
    }

    checkForChanges()
  }, [activeWorkflowId, deployedState, currentBlocks, subBlockValues, isLoadingDeployedState])

  useEffect(() => {
    if (session?.user?.id && !isRegistryLoading) {
      checkUserUsage(session.user.id).then((usage) => {
        if (usage) {
          setUsageExceeded(usage.isExceeded)
          setUsageData(usage)
        }
      })
    }
  }, [session?.user?.id, isRegistryLoading])

  /**
   * Check user usage limits and cache results
   */
  async function checkUserUsage(userId: string, forceRefresh = false): Promise<any | null> {
    const now = Date.now()
    const cacheAge = now - usageDataCache.timestamp

    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && usageDataCache.data && cacheAge < usageDataCache.expirationMs) {
      logger.info('Using cached usage data', {
        cacheAge: `${Math.round(cacheAge / 1000)}s`,
      })
      return usageDataCache.data
    }

    try {
      // Use subscription store to get usage data
      const { getUsage, refresh } = useSubscriptionStore.getState()

      // Force refresh if requested
      if (forceRefresh) {
        await refresh()
      }

      const usage = getUsage()

      // Update cache
      usageDataCache = {
        data: usage,
        timestamp: now,
        expirationMs: usageDataCache.expirationMs,
      }

      return usage
    } catch (error) {
      logger.error('Error checking usage limits:', { error })
      return null
    }
  }

  /**
   * Handle deleting the current workflow
   */
  const handleDeleteWorkflow = () => {
    if (!activeWorkflowId || !userPermissions.canEdit) return

    const sidebarWorkflows = getSidebarOrderedWorkflows()
    const currentIndex = sidebarWorkflows.findIndex((w) => w.id === activeWorkflowId)

    // Find next workflow: try next, then previous
    let nextWorkflowId: string | null = null
    if (sidebarWorkflows.length > 1) {
      if (currentIndex < sidebarWorkflows.length - 1) {
        nextWorkflowId = sidebarWorkflows[currentIndex + 1].id
      } else if (currentIndex > 0) {
        nextWorkflowId = sidebarWorkflows[currentIndex - 1].id
      }
    }

    // Navigate to next workflow or workspace home
    if (nextWorkflowId) {
      router.push(`/arena/${workspaceId}/zelaxy/${nextWorkflowId}`)
    } else {
      router.push(`/arena/${workspaceId}`)
    }

    // Remove the workflow from the registry
    useWorkflowRegistry.getState().removeWorkflow(activeWorkflowId)
  }

  // Helper function to open subscription settings
  const openSubscriptionSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-settings', {
          detail: { tab: 'subscription' },
        })
      )
    }
  }

  /**
   * Handle duplicating the current workflow
   */
  const handleDuplicateWorkflow = async () => {
    if (!activeWorkflowId || !userPermissions.canEdit) return

    try {
      const newWorkflow = await duplicateWorkflow(activeWorkflowId)
      if (newWorkflow) {
        router.push(`/arena/${workspaceId}/zelaxy/${newWorkflow}`)
      }
    } catch (error) {
      logger.error('Error duplicating workflow:', { error })
    }
  }

  /**
   * Render delete workflow button with confirmation dialog
   */
  const renderDeleteButton = () => {
    const canEdit = userPermissions.canEdit
    const hasMultipleWorkflows = Object.keys(workflows).length > 1
    const isDisabled = !canEdit || !hasMultipleWorkflows

    const getTooltipText = () => {
      if (!canEdit) return 'Need admin permission'
      if (!hasMultipleWorkflows) return 'Cannot delete last workflow'
      return 'Delete'
    }

    const buttonClass = cn(
      'h-7 w-7 sm:h-9 sm:w-9 rounded-full border border-gray-300 dark:border-gray-600',
      'bg-transparent hover:border-red-500 dark:hover:border-red-400',
      'text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400',
      'transition-all duration-200'
    )

    if (isDisabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-400 opacity-50 transition-colors sm:h-9 sm:w-9 dark:border-gray-700 dark:text-gray-600'>
              <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
            </div>
          </TooltipTrigger>
          <TooltipContent>{getTooltipText()}</TooltipContent>
        </Tooltip>
      )
    }

    return (
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant='ghost' className={buttonClass}>
                <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='sr-only'>Delete Workflow</span>
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{getTooltipText()}</TooltipContent>
        </Tooltip>

        <AlertDialogContent className='rounded-xl border-0 shadow-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-semibold text-lg'>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription className='text-gray-600 dark:text-gray-400'>
              Deleting this workflow will permanently remove all associated blocks, executions, and
              configuration.{' '}
              <span className='font-medium text-red-500 dark:text-red-400'>
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex gap-3 pt-6'>
            <AlertDialogCancel className='h-10 flex-1 rounded-full border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
              className='h-10 flex-1 rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  /**
   * Render deploy button with tooltip
   */
  const renderDeployButton = () => (
    <DeploymentControls
      activeWorkflowId={activeWorkflowId}
      needsRedeployment={changeDetected}
      setNeedsRedeployment={setChangeDetected}
      deployedState={deployedState}
      isLoadingDeployedState={isLoadingDeployedState}
      refetchDeployedState={fetchDeployedState}
      userPermissions={userPermissions}
    />
  )

  /**
   * Render workflow duplicate button
   */
  const renderDuplicateButton = () => {
    const canEdit = userPermissions.canEdit
    const isDisabled = !canEdit || isDebugging

    const getTooltipText = () => {
      if (!canEdit) return 'Need admin permission'
      if (isDebugging) return 'Cannot duplicate while debugging'
      return 'Duplicate'
    }

    const buttonClass = cn(
      'h-7 w-7 sm:h-9 sm:w-9 rounded-full border border-gray-300 dark:border-gray-600',
      'bg-transparent hover:border-primary dark:hover:border-primary',
      'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary/80',
      'transition-all duration-200'
    )

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {isDisabled ? (
            <div className='inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-400 opacity-50 transition-colors sm:h-9 sm:w-9 dark:border-gray-700 dark:text-gray-600'>
              <Copy className='h-3 w-3 sm:h-4 sm:w-4' />
            </div>
          ) : (
            <Button variant='ghost' onClick={handleDuplicateWorkflow} className={buttonClass}>
              <Copy className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='sr-only'>Duplicate</span>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>{getTooltipText()}</TooltipContent>
      </Tooltip>
    )
  }

  /**
   * Handles debug mode toggle - starts or stops debugging
   */
  const handleDebugToggle = useCallback(() => {
    if (!userPermissions.canRead) return

    if (isDebugging) {
      // Stop debugging
      handleCancelDebug()
    } else {
      // Check if there are executable blocks before starting debug mode
      const hasExecutableBlocks = Object.values(blocks).some(
        (block) => block.type !== 'starter' && block.enabled !== false
      )

      if (!hasExecutableBlocks) {
        return // Do nothing if no executable blocks
      }

      // Start debugging
      if (!isDebugModeEnabled) {
        toggleDebugMode()
      }
      if (usageExceeded) {
        openSubscriptionSettings()
      } else {
        openConsolePanel()
        handleRunWorkflow(undefined, true) // Start in debug mode
      }
    }
  }, [
    userPermissions.canRead,
    isDebugging,
    isDebugModeEnabled,
    usageExceeded,
    blocks,
    handleCancelDebug,
    toggleDebugMode,
    handleRunWorkflow,
    openConsolePanel,
  ])

  /**
   * Render debug controls bar (replaces run button when debugging)
   */
  const renderDebugControlsBar = () => {
    const pendingCount = pendingBlocks.length
    const isControlDisabled = pendingCount === 0

    const debugButtonClass = cn(
      'h-7 w-7 sm:h-9 sm:w-9 font-medium rounded-full border border-gray-300 dark:border-gray-600',
      'bg-transparent hover:border-primary dark:hover:border-primary',
      'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary/80',
      'transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600',
      'flex items-center justify-center'
    )

    return (
      <div className='flex items-center gap-1 sm:gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                // Ensure console panel opens before stepping
                openConsolePanel()
                // Small delay to ensure panel state is updated
                setTimeout(() => handleStepDebug(), 10)
              }}
              className={debugButtonClass}
              disabled={isControlDisabled}
            >
              <StepForward className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='sr-only'>Step</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Step</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                // Ensure console panel opens before resuming
                openConsolePanel()
                // Small delay to ensure panel state is updated
                setTimeout(() => handleResumeDebug(), 10)
              }}
              className={debugButtonClass}
              disabled={isControlDisabled}
            >
              <SkipForward className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='sr-only'>Resume</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Resume</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                handleCancelDebug()
              }}
              className={cn(
                'h-7 w-7 rounded-full border border-gray-300 font-medium sm:h-9 sm:w-9 dark:border-gray-600',
                'bg-transparent hover:border-red-500 dark:hover:border-red-400',
                'text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400',
                'transition-all duration-200',
                'flex items-center justify-center'
              )}
            >
              <X className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='sr-only'>Stop</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  /**
   * Render publish template button
   */
  const renderPublishButton = () => {
    const canEdit = userPermissions.canEdit
    const isDisabled = isExecuting || isDebugging || !canEdit

    const getTooltipText = () => {
      if (!canEdit) return 'Need admin permission'
      if (isDebugging) return 'Cannot publish while debugging'
      if (isExecuting) return 'Cannot publish while running'
      return 'Publish template'
    }

    const buttonClass = cn(
      'h-7 w-7 sm:h-9 sm:w-9 rounded-full border border-gray-300 dark:border-gray-600',
      'bg-transparent hover:border-green-500 dark:hover:border-green-400',
      'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400',
      'transition-all duration-200'
    )

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {isDisabled ? (
            <div className='inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-400 opacity-50 transition-colors sm:h-9 sm:w-9 dark:border-gray-700 dark:text-gray-600'>
              <Store className='h-3 w-3 sm:h-4 sm:w-4' />
            </div>
          ) : (
            <Button
              variant='ghost'
              onClick={() => setIsTemplateModalOpen(true)}
              className={buttonClass}
            >
              <Store className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='sr-only'>Publish Template</span>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>{getTooltipText()}</TooltipContent>
      </Tooltip>
    )
  }

  /**
   * Render debug mode toggle button
   */
  const renderDebugModeToggle = () => {
    const canDebug = userPermissions.canRead

    // Check if there are any meaningful blocks in the workflow (excluding just the starter block)
    const hasExecutableBlocks = Object.values(blocks).some(
      (block) => block.type !== 'starter' && block.enabled !== false
    )

    const isDisabled = isExecuting || !canDebug || !hasExecutableBlocks

    const getTooltipText = () => {
      if (!canDebug) return 'Need read permission'
      if (!hasExecutableBlocks) return 'Add blocks to debug'
      return isDebugging ? 'Stop debugging' : 'Start debugging'
    }

    const buttonClass = cn(
      'h-7 w-7 sm:h-9 sm:w-9 rounded-full border border-gray-300 dark:border-gray-600',
      'bg-transparent hover:border-amber-500 dark:hover:border-amber-400',
      'text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400',
      'transition-all duration-200',
      isDebugging && 'border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400'
    )

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {isDisabled ? (
            <div
              className={cn(
                'inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full sm:h-9 sm:w-9',
                'border border-gray-200 bg-transparent text-gray-400 dark:border-gray-700 dark:text-gray-600',
                'opacity-50 transition-colors'
              )}
            >
              <Bug className='h-3 w-3 sm:h-4 sm:w-4' />
            </div>
          ) : (
            <Button variant='ghost' onClick={handleDebugToggle} className={buttonClass}>
              <Bug className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='sr-only'>{getTooltipText()}</span>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>{getTooltipText()}</TooltipContent>
      </Tooltip>
    )
  }

  /**
   * Render run workflow button or cancel button when executing
   */
  const renderRunButton = () => {
    const canRun = userPermissions.canRead // Running only requires read permissions
    const isLoadingPermissions = userPermissions.isLoading
    const isButtonDisabled =
      !isExecuting && (isWorkflowBlocked || (!canRun && !isLoadingPermissions))

    // If currently executing, show cancel button
    if (isExecuting) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                'h-7 w-7 rounded-full border border-gray-300 font-medium sm:h-9 sm:w-9 dark:border-gray-600',
                'bg-transparent hover:border-red-500 dark:hover:border-red-400',
                'text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400',
                'transition-all duration-200',
                'flex items-center justify-center'
              )}
              onClick={handleCancelExecution}
            >
              <X className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='sr-only'>Cancel</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      )
    }

    const getTooltipContent = () => {
      if (hasValidationErrors) {
        return (
          <div className='text-center'>
            <p className='font-medium text-destructive'>Workflow Has Errors</p>
            <p className='text-xs'>
              Nested subflows are not supported. Remove subflow blocks from inside other subflow
              blocks.
            </p>
          </div>
        )
      }

      if (!canRun && !isLoadingPermissions) {
        return 'Need read permission'
      }

      if (usageExceeded) {
        return (
          <div className='text-center'>
            <p className='font-medium text-destructive'>Usage Limit Exceeded</p>
            <p className='text-xs'>
              You've used {usageData?.currentUsage?.toFixed(2) || 0}$ of{' '}
              {usageData?.limit?.toFixed(2) || 0}$ Upgrade your plan to continue.
            </p>
          </div>
        )
      }

      return 'Run'
    }

    const handleRunClick = () => {
      openConsolePanel()

      if (usageExceeded) {
        openSubscriptionSettings()
      } else {
        handleRunWorkflow()
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'h-7 w-7 rounded-full border border-primary font-medium sm:h-9 sm:w-9 dark:border-primary',
              'bg-transparent hover:bg-primary/100 dark:hover:bg-primary',
              'text-primary hover:border-white hover:text-white dark:text-primary/80 dark:hover:text-white',
              'transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600 dark:disabled:hover:border-gray-600 dark:disabled:hover:text-gray-300',
              'flex items-center justify-center',
              usageExceeded &&
                'border-amber-500 text-amber-600 hover:border-white hover:bg-amber-500 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-400'
            )}
            onClick={handleRunClick}
            disabled={isButtonDisabled}
          >
            <Play className='h-3 w-3 sm:h-4 sm:w-4' />
            <span className='sr-only'>{usageExceeded ? 'Upgrade' : 'Run'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent command={getKeyboardShortcutText('Enter', true)}>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    )
  }

  /**
   * Get workflows in the exact order they appear in the sidebar
   */
  const getSidebarOrderedWorkflows = () => {
    // Get and sort regular workflows by last modified (newest first)
    const regularWorkflows = Object.values(workflows)
      .filter((workflow) => workflow.workspaceId === workspaceId)
      .filter((workflow) => workflow.marketplaceData?.status !== 'temp')
      .sort((a, b) => {
        const dateA =
          a.lastModified instanceof Date
            ? a.lastModified.getTime()
            : new Date(a.lastModified).getTime()
        const dateB =
          b.lastModified instanceof Date
            ? b.lastModified.getTime()
            : new Date(b.lastModified).getTime()
        return dateB - dateA
      })

    // Group workflows by folder
    const workflowsByFolder = regularWorkflows.reduce(
      (acc, workflow) => {
        const folderId = workflow.folderId || 'root'
        if (!acc[folderId]) acc[folderId] = []
        acc[folderId].push(workflow)
        return acc
      },
      {} as Record<string, typeof regularWorkflows>
    )

    const orderedWorkflows: typeof regularWorkflows = []

    // Recursively collect workflows from expanded folders
    const collectFromFolders = (folders: ReturnType<typeof getFolderTree>) => {
      folders.forEach((folder) => {
        if (expandedFolders.has(folder.id)) {
          orderedWorkflows.push(...(workflowsByFolder[folder.id] || []))
          if (folder.children.length > 0) {
            collectFromFolders(folder.children)
          }
        }
      })
    }

    // Get workflows from expanded folders first, then root workflows
    if (workspaceId) collectFromFolders(getFolderTree(workspaceId))
    orderedWorkflows.push(...(workflowsByFolder.root || []))

    return orderedWorkflows
  }

  /**
   * Render disconnection notice
   */
  const renderDisconnectionNotice = () => {
    if (!userPermissions.isOfflineMode) return null

    const handleRefresh = () => {
      window.location.reload()
    }

    return (
      <div className='flex h-10 items-center gap-3 rounded-full border border-red-400/50 bg-red-500/90 px-4 text-white shadow-lg backdrop-blur-xl'>
        <Tooltip>
          <TooltipTrigger asChild>
            <WifiOff className='h-4 w-4 cursor-help' />
          </TooltipTrigger>
          <TooltipContent className='mt-3'>Connection lost</TooltipContent>
        </Tooltip>
        <span className='font-medium text-sm'>Connection lost</span>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRefresh}
          className='h-6 rounded-full bg-white/20 px-2 text-white hover:bg-white/30'
        >
          <RefreshCw className='h-3 w-3' />
        </Button>
      </div>
    )
  }

  /**
   * Render undo/redo buttons
   */
  const renderUndoRedoButtons = () => {
    const undoDisabled = !canUndo()
    const redoDisabled = !canRedo()

    const buttonClass = cn(
      'h-7 w-7 sm:h-9 sm:w-9 rounded-full border border-gray-300 dark:border-gray-600',
      'bg-transparent hover:border-primary dark:hover:border-primary',
      'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary/80',
      'transition-all duration-200'
    )

    const disabledClass =
      'inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-400 opacity-50 transition-colors sm:h-9 sm:w-9 dark:border-gray-700 dark:text-gray-600'

    return (
      <div className='flex items-center gap-1 sm:gap-2'>
        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            {undoDisabled ? (
              <div className={disabledClass}>
                <Undo2 className='h-3 w-3 sm:h-4 sm:w-4' />
              </div>
            ) : (
              <Button variant='ghost' onClick={undo} className={buttonClass}>
                <Undo2 className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='sr-only'>Undo</span>
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent command={getKeyboardShortcutText('Z', true)}>Undo</TooltipContent>
        </Tooltip>

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            {redoDisabled ? (
              <div className={disabledClass}>
                <Redo2 className='h-3 w-3 sm:h-4 sm:w-4' />
              </div>
            ) : (
              <Button variant='ghost' onClick={redo} className={buttonClass}>
                <Redo2 className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='sr-only'>Redo</span>
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent command={getKeyboardShortcutText('Z', true, true)}>Redo</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  /**
   * Render control bar toggle button
   */
  const renderToggleButton = () => {
    const buttonClass = cn(
      'h-7 w-7 sm:h-9 sm:w-9 border border-gray-300 dark:border-gray-600',
      'bg-transparent hover:border-gray-500 dark:hover:border-gray-400',
      'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100',
      'transition-all duration-200'
    )

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            onClick={() => setIsExpanded(!isExpanded)}
            className={buttonClass}
          >
            <ChevronLeft
              className={cn(
                'h-3 w-3 transition-transform duration-200 sm:h-4 sm:w-4',
                isExpanded && 'rotate-180'
              )}
            />
            <span className='sr-only'>{isExpanded ? 'Collapse' : 'Expand'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isExpanded ? 'Collapse' : 'Expand'}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      {/* Primary Control Bar - Top Center on desktop, Left on mobile */}
      <div className='sm:-translate-x-1/2 fixed top-2 left-20 z-30 flex items-center gap-1 sm:top-4 sm:left-1/2 sm:transform sm:gap-3'>
        <div className='flex items-center gap-1 rounded-xl border border-border/40 bg-background/80 px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-xl sm:gap-2 sm:px-4 sm:py-2'>
          {/* Primary Actions - Run/Deploy */}
          <div className='flex items-center gap-1 sm:gap-2'>
            {isDebugging ? renderDebugControlsBar() : renderRunButton()}
            {renderDeployButton()}
          </div>

          {/* Separator */}
          <div className='h-4 w-px bg-border/40 sm:h-5' />

          {/* Debug Toggle */}
          {!isDebugging && <div className='flex items-center'>{renderDebugModeToggle()}</div>}

          {/* Separator */}
          <div className='h-4 w-px bg-border/40 sm:h-5' />

          {/* Undo/Redo */}
          {renderUndoRedoButtons()}

          {/* Separator */}
          <div className='h-4 w-px bg-border/40 sm:h-5' />

          {/* Export YAML */}
          <ExportControls />
        </div>
      </div>

      {/* Template Modal */}
      {activeWorkflowId && (
        <TemplateModal
          open={isTemplateModalOpen}
          onOpenChange={setIsTemplateModalOpen}
          workflowId={activeWorkflowId}
        />
      )}
    </>
  )
}
