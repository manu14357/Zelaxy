'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, RefreshCw, Trash2 } from 'lucide-react'
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
  Skeleton,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  ApiEndpoint,
  ApiKey,
  DeployStatus,
  ExampleCommand,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/deployment-info/components'
import { DeployedWorkflowModal } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deployment-controls/components/deployed-workflow-modal'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

interface WorkflowDeploymentInfo {
  isDeployed: boolean
  deployedAt?: string
  apiKey: string
  endpoint: string
  exampleCommand: string
  needsRedeployment: boolean
}

interface DeploymentInfoProps {
  isLoading: boolean
  deploymentInfo: WorkflowDeploymentInfo | null
  onRedeploy: () => void
  onUndeploy: () => void
  isSubmitting: boolean
  isUndeploying: boolean
  workflowId: string | null
  deployedState: WorkflowState
  isLoadingDeployedState: boolean
  getInputFormatExample?: () => string
}

export function DeploymentInfo({
  isLoading,
  deploymentInfo,
  onRedeploy,
  onUndeploy,
  isSubmitting,
  isUndeploying,
  workflowId,
  deployedState,
  isLoadingDeployedState,
  getInputFormatExample,
}: DeploymentInfoProps) {
  const [isViewingDeployed, setIsViewingDeployed] = useState(false)

  const handleViewDeployed = async () => {
    if (!workflowId) {
      return
    }

    if (deployedState) {
      setIsViewingDeployed(true)
      return
    }
  }

  if (isLoading || !deploymentInfo) {
    return (
      <div className='space-y-5'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-20 rounded-md' />
          <Skeleton className='h-12 w-full rounded-xl' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-16 rounded-md' />
          <Skeleton className='h-12 w-full rounded-xl' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-20 rounded-md' />
          <Skeleton className='h-[120px] w-full rounded-xl' />
        </div>
        <div className='flex items-center justify-between pt-2'>
          <Skeleton className='h-8 w-32 rounded-full' />
          <div className='flex gap-2'>
            <Skeleton className='h-9 w-28 rounded-lg' />
            <Skeleton className='h-9 w-28 rounded-lg' />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='space-y-5'>
        <div className='space-y-5'>
          <ApiEndpoint endpoint={deploymentInfo.endpoint} />
          <ApiKey apiKey={deploymentInfo.apiKey} />
          <ExampleCommand
            command={deploymentInfo.exampleCommand}
            apiKey={deploymentInfo.apiKey}
            endpoint={deploymentInfo.endpoint}
            getInputFormatExample={getInputFormatExample}
          />
        </div>

        {/* Separator */}
        <div className='h-px bg-border/50' />

        {/* Status & Actions */}
        <div className='flex items-center justify-between'>
          <DeployStatus needsRedeployment={deploymentInfo.needsRedeployment} />

          <div className='flex items-center gap-2'>
            <button
              onClick={handleViewDeployed}
              className='flex h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-[13px] text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-[0.98]'
            >
              <ExternalLink className='h-3.5 w-3.5' />
              View
            </button>

            {deploymentInfo.needsRedeployment && (
              <button
                onClick={onRedeploy}
                disabled={isSubmitting}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-[13px] transition-all duration-150',
                  'bg-muted/60 text-foreground hover:bg-muted active:scale-[0.98]',
                  'disabled:opacity-50'
                )}
              >
                {isSubmitting ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <RefreshCw className='h-3.5 w-3.5' />
                )}
                {isSubmitting ? 'Redeploying...' : 'Redeploy'}
              </button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isUndeploying}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-lg border border-destructive/30 px-3 font-medium text-[13px] text-destructive',
                    'transition-all duration-150 hover:bg-destructive/10 active:scale-[0.98]',
                    'disabled:opacity-50'
                  )}
                >
                  {isUndeploying ? (
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <Trash2 className='h-3.5 w-3.5' />
                  )}
                  {isUndeploying ? 'Removing...' : 'Undeploy'}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className='rounded-2xl'>
                <AlertDialogHeader>
                  <AlertDialogTitle className='text-[17px]'>Undeploy API</AlertDialogTitle>
                  <AlertDialogDescription className='text-[14px] leading-relaxed'>
                    Are you sure you want to undeploy this workflow? This will remove the API
                    endpoint and make it unavailable to external users.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className='gap-2'>
                  <AlertDialogCancel className='rounded-lg'>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onUndeploy}
                    className='rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Undeploy
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {deployedState && (
        <DeployedWorkflowModal
          isOpen={isViewingDeployed}
          onClose={() => setIsViewingDeployed(false)}
          needsRedeployment={deploymentInfo.needsRedeployment}
          deployedWorkflowState={deployedState}
        />
      )}
    </>
  )
}
