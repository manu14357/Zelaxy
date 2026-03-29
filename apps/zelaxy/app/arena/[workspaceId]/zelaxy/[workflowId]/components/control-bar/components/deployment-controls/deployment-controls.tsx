'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { DeployModal } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components'
import type { WorkspaceUserPermissions } from '@/hooks/use-user-permissions'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

interface DeploymentControlsProps {
  activeWorkflowId: string | null
  needsRedeployment: boolean
  setNeedsRedeployment: (value: boolean) => void
  deployedState: WorkflowState | null
  isLoadingDeployedState: boolean
  refetchDeployedState: () => Promise<void>
  userPermissions: WorkspaceUserPermissions
}

export function DeploymentControls({
  activeWorkflowId,
  needsRedeployment,
  setNeedsRedeployment,
  deployedState,
  isLoadingDeployedState,
  refetchDeployedState,
  userPermissions,
}: DeploymentControlsProps) {
  const deploymentStatus = useWorkflowRegistry((state) =>
    state.getWorkflowDeploymentStatus(activeWorkflowId)
  )
  const isDeployed = deploymentStatus?.isDeployed || false

  const workflowNeedsRedeployment = needsRedeployment

  const [isDeploying, _setIsDeploying] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const lastWorkflowIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (activeWorkflowId !== lastWorkflowIdRef.current) {
      lastWorkflowIdRef.current = activeWorkflowId
    }
  }, [activeWorkflowId])

  const refetchWithErrorHandling = async () => {
    if (!activeWorkflowId) return

    try {
      await refetchDeployedState()
    } catch (error) {}
  }

  const canDeploy = userPermissions.canAdmin
  const isDisabled = isDeploying || !canDeploy

  const handleDeployClick = useCallback(() => {
    if (canDeploy) {
      setIsModalOpen(true)
    }
  }, [canDeploy, setIsModalOpen])

  const getTooltipText = () => {
    if (!canDeploy) {
      return 'Admin permissions required to deploy workflows'
    }
    if (isDeploying) {
      return 'Deploying...'
    }
    if (isDeployed && workflowNeedsRedeployment) {
      return 'Workflow changes detected'
    }
    if (isDeployed) {
      return 'Deployment Settings'
    }
    return 'Deploy as API'
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='relative'>
            <Button
              variant='ghost'
              onClick={handleDeployClick}
              disabled={isDisabled}
              className={cn(
                'h-7 w-7 rounded-lg border sm:h-9 sm:w-9 sm:px-4',
                'border-border/60 bg-transparent',
                'hover:border-foreground/20 hover:bg-muted/60',
                'text-muted-foreground hover:text-foreground',
                'transition-all duration-200 active:scale-95',
                isDeployed &&
                  'border-emerald-500/50 text-emerald-600 hover:border-emerald-500/70 dark:border-emerald-400/40 dark:text-emerald-400 dark:hover:border-emerald-400/60',
                isDisabled &&
                  'cursor-not-allowed opacity-40 hover:border-border/60 hover:bg-transparent hover:text-muted-foreground'
              )}
            >
              <div className='flex items-center justify-center'>
                {isDeploying ? (
                  <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
                ) : (
                  <Rocket className='h-3 w-3 sm:h-4 sm:w-4' />
                )}
                <span className='sr-only'>{isDeploying ? 'Deploying...' : 'Deploy'}</span>
              </div>
              <span className='sr-only'>Deploy API</span>
            </Button>

            {isDeployed && workflowNeedsRedeployment && (
              <div className='-top-1 -right-1 pointer-events-none absolute flex items-center justify-center'>
                <div className='relative'>
                  <div className='absolute inset-0 h-[6px] w-[6px] animate-ping rounded-full bg-amber-500/40' />
                  <div className='zoom-in fade-in relative h-[6px] w-[6px] animate-in rounded-full bg-amber-500 duration-300' />
                </div>
                <span className='sr-only'>Needs Redeployment</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className='rounded-lg text-[12px]'>{getTooltipText()}</TooltipContent>
      </Tooltip>

      <DeployModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        workflowId={activeWorkflowId}
        needsRedeployment={workflowNeedsRedeployment}
        setNeedsRedeployment={setNeedsRedeployment}
        deployedState={deployedState as WorkflowState}
        isLoadingDeployedState={isLoadingDeployedState}
        refetchDeployedState={refetchWithErrorHandling}
      />
    </>
  )
}
