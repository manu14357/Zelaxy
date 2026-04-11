'use client'

import { useEffect, useState } from 'react'
import { Loader2, Rocket, X, Zap } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { getEnv } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import {
  DeployForm,
  DeploymentInfo,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components'
import { ChatDeploy } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/chat-deploy/chat-deploy'
import { useOperationQueueStore } from '@/stores/operation-queue/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useSubBlockStore } from '@/stores/workflows/subblock/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

const logger = createLogger('DeployModal')

interface DeployModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string | null
  needsRedeployment: boolean
  setNeedsRedeployment: (value: boolean) => void
  deployedState: WorkflowState
  isLoadingDeployedState: boolean
  refetchDeployedState: () => Promise<void>
}

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsed?: string
  createdAt: string
  expiresAt?: string
}

interface WorkflowDeploymentInfo {
  isDeployed: boolean
  deployedAt?: string
  apiKey: string
  endpoint: string
  exampleCommand: string
  needsRedeployment: boolean
}

interface DeployFormValues {
  apiKey: string
  newKeyName?: string
}

type TabView = 'api' | 'chat'

export function DeployModal({
  open,
  onOpenChange,
  workflowId,
  needsRedeployment,
  setNeedsRedeployment,
  deployedState,
  isLoadingDeployedState,
  refetchDeployedState,
}: DeployModalProps) {
  const deploymentStatus = useWorkflowRegistry((state) =>
    state.getWorkflowDeploymentStatus(workflowId)
  )
  const isDeployed = deploymentStatus?.isDeployed || false
  const setDeploymentStatus = useWorkflowRegistry((state) => state.setDeploymentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUndeploying, setIsUndeploying] = useState(false)
  const [deploymentInfo, setDeploymentInfo] = useState<WorkflowDeploymentInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [keysLoaded, setKeysLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabView>('api')
  const [chatSubmitting, setChatSubmitting] = useState(false)
  const [apiDeployError, setApiDeployError] = useState<string | null>(null)
  const [chatExists, setChatExists] = useState(false)
  const [isChatFormValid, setIsChatFormValid] = useState(false)

  const getInputFormatExample = () => {
    let inputFormatExample = ''
    try {
      const blocks = Object.values(useWorkflowStore.getState().blocks)
      const starterBlock = blocks.find((block) => block.type === 'starter')

      if (starterBlock) {
        const inputFormat = useSubBlockStore.getState().getValue(starterBlock.id, 'inputFormat')

        if (inputFormat && Array.isArray(inputFormat) && inputFormat.length > 0) {
          const exampleData: Record<string, any> = {}
          inputFormat.forEach((field: any) => {
            if (field.name) {
              switch (field.type) {
                case 'string':
                  exampleData[field.name] = 'example'
                  break
                case 'number':
                  exampleData[field.name] = 42
                  break
                case 'boolean':
                  exampleData[field.name] = true
                  break
                case 'object':
                  exampleData[field.name] = { key: 'value' }
                  break
                case 'array':
                  exampleData[field.name] = [1, 2, 3]
                  break
              }
            }
          })

          inputFormatExample = ` -d '${JSON.stringify(exampleData)}'`
        }
      }
    } catch (error) {
      logger.error('Error generating input format example:', error)
    }

    return inputFormatExample
  }

  const fetchApiKeys = async () => {
    if (!open) return

    try {
      setKeysLoaded(false)
      const response = await fetch('/api/users/me/api-keys')

      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys || [])
        setKeysLoaded(true)
      }
    } catch (error) {
      logger.error('Error fetching API keys:', { error })
      setKeysLoaded(true)
    }
  }

  const fetchChatDeploymentInfo = async () => {
    if (!open || !workflowId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/workflows/${workflowId}/chat/status`)

      if (response.ok) {
        const data = await response.json()
        if (data.isDeployed && data.deployment) {
          setChatExists(true)
        } else {
          setChatExists(false)
        }
      } else {
        setChatExists(false)
      }
    } catch (error) {
      logger.error('Error fetching chat deployment info:', { error })
      setChatExists(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      fetchApiKeys()
      fetchChatDeploymentInfo()
      setActiveTab('api')
    }
  }, [open, workflowId])

  useEffect(() => {
    async function fetchDeploymentInfo() {
      // If not open or not deployed, clear info and stop
      if (!open || !workflowId || !isDeployed) {
        setDeploymentInfo(null)
        if (!open) {
          setIsLoading(false)
        }
        return
      }

      // If we already have deploymentInfo (e.g., just deployed and set locally), avoid overriding it
      if (deploymentInfo?.isDeployed && !needsRedeployment) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        const response = await fetch(`/api/workflows/${workflowId}/deploy`)

        if (!response.ok) {
          throw new Error('Failed to fetch deployment information')
        }

        const data = await response.json()
        const endpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`
        const inputFormatExample = getInputFormatExample()

        setDeploymentInfo({
          isDeployed: data.isDeployed,
          deployedAt: data.deployedAt,
          apiKey: data.apiKey,
          endpoint,
          exampleCommand: `curl -X POST -H "X-API-Key: ${data.apiKey}" -H "Content-Type: application/json"${inputFormatExample} ${endpoint}`,
          needsRedeployment,
        })
      } catch (error) {
        logger.error('Error fetching deployment info:', { error })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeploymentInfo()
  }, [open, workflowId, isDeployed, needsRedeployment, deploymentInfo?.isDeployed])

  const onDeploy = async (data: DeployFormValues) => {
    setApiDeployError(null)

    try {
      setIsSubmitting(true)

      // Flush any pending subblock edits to the DB before snapshotting the deploy state.
      // This prevents a race where the user edits a value but the socket confirmation
      // hasn't arrived yet when the deploy API reads the DB.
      if (workflowId) {
        await useOperationQueueStore.getState().flushPendingSubblockOperations(workflowId)
      }

      const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: data.apiKey,
          deployChatEnabled: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deploy workflow')
      }

      const { isDeployed: newDeployStatus, deployedAt, apiKey } = await response.json()

      setDeploymentStatus(
        workflowId,
        newDeployStatus,
        deployedAt ? new Date(deployedAt) : undefined,
        apiKey || data.apiKey
      )

      setNeedsRedeployment(false)
      if (workflowId) {
        useWorkflowRegistry.getState().setWorkflowNeedsRedeployment(workflowId, false)
      }
      const endpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`
      const inputFormatExample = getInputFormatExample()

      const newDeploymentInfo = {
        isDeployed: true,
        deployedAt: deployedAt,
        apiKey: apiKey || data.apiKey,
        endpoint,
        exampleCommand: `curl -X POST -H "X-API-Key: ${apiKey || data.apiKey}" -H "Content-Type: application/json"${inputFormatExample} ${endpoint}`,
        needsRedeployment: false,
      }

      setDeploymentInfo(newDeploymentInfo)

      await refetchDeployedState()
    } catch (error: any) {
      logger.error('Error deploying workflow:', { error })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUndeploy = async () => {
    try {
      setIsUndeploying(true)

      const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to undeploy workflow')
      }

      setDeploymentStatus(workflowId, false)
      setChatExists(false)
      onOpenChange(false)
    } catch (error: any) {
      logger.error('Error undeploying workflow:', { error })
    } finally {
      setIsUndeploying(false)
    }
  }

  const handleRedeploy = async () => {
    try {
      setIsSubmitting(true)

      // Flush any pending subblock edits before snapshotting the deployed state.
      if (workflowId) {
        await useOperationQueueStore.getState().flushPendingSubblockOperations(workflowId)
      }

      const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployChatEnabled: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to redeploy workflow')
      }

      const { isDeployed: newDeployStatus, deployedAt, apiKey } = await response.json()

      setDeploymentStatus(
        workflowId,
        newDeployStatus,
        deployedAt ? new Date(deployedAt) : undefined,
        apiKey
      )

      setNeedsRedeployment(false)
      if (workflowId) {
        useWorkflowRegistry.getState().setWorkflowNeedsRedeployment(workflowId, false)
      }

      await refetchDeployedState()

      // Ensure modal status updates immediately
      setDeploymentInfo((prev) => (prev ? { ...prev, needsRedeployment: false } : prev))
    } catch (error: any) {
      logger.error('Error redeploying workflow:', { error })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsSubmitting(false)
    setChatSubmitting(false)
    onOpenChange(false)
  }

  const handleWorkflowPreDeploy = async () => {
    if (!isDeployed) {
      const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployApiEnabled: true,
          deployChatEnabled: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deploy workflow')
      }

      const { isDeployed: newDeployStatus, deployedAt, apiKey } = await response.json()

      setDeploymentStatus(
        workflowId,
        newDeployStatus,
        deployedAt ? new Date(deployedAt) : undefined,
        apiKey
      )

      setDeploymentInfo((prev) => (prev ? { ...prev, apiKey } : null))
    }
  }

  const handleChatFormSubmit = () => {
    const form = document.getElementById('chat-deploy-form') as HTMLFormElement
    if (form) {
      // Check if we're in success view and need to trigger update
      const updateTrigger = form.querySelector('[data-update-trigger]') as HTMLButtonElement
      if (updateTrigger) {
        updateTrigger.click()
      } else {
        form.requestSubmit()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent
        className='flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl border border-border/40 p-0 shadow-[0_25px_65px_-15px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:max-w-[620px] dark:shadow-[0_25px_65px_-15px_rgba(0,0,0,0.5)]'
        hideCloseButton
      >
        {/* Header */}
        <DialogHeader className='flex-shrink-0 px-6 pt-6 pb-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 shadow-sm'>
                <Rocket className='h-5 w-5 text-background' />
              </div>
              <div>
                <DialogTitle className='font-semibold text-[17px] text-foreground tracking-tight'>
                  Deploy
                </DialogTitle>
                <p className='text-[13px] text-muted-foreground'>Launch your agent to the world</p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className='flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-95'
            >
              <X className='h-4 w-4' />
              <span className='sr-only'>Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Content */}
          <div className='flex-1 overflow-y-auto'>
            <div className='p-6'>
              {activeTab === 'api' && (
                <>
                  {isDeployed ? (
                    <DeploymentInfo
                      isLoading={isLoading}
                      deploymentInfo={
                        deploymentInfo ? { ...deploymentInfo, needsRedeployment } : null
                      }
                      onRedeploy={handleRedeploy}
                      onUndeploy={handleUndeploy}
                      isSubmitting={isSubmitting}
                      isUndeploying={isUndeploying}
                      workflowId={workflowId}
                      deployedState={deployedState}
                      isLoadingDeployedState={isLoadingDeployedState}
                      getInputFormatExample={getInputFormatExample}
                    />
                  ) : (
                    <>
                      {apiDeployError && (
                        <div className='mb-5 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4'>
                          <div className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10'>
                            <X className='h-3 w-3 text-destructive' />
                          </div>
                          <div>
                            <div className='font-medium text-[13px] text-destructive'>
                              Deployment Failed
                            </div>
                            <div className='mt-0.5 text-[13px] text-destructive/80'>
                              {apiDeployError}
                            </div>
                          </div>
                        </div>
                      )}
                      <DeployForm
                        apiKeys={apiKeys}
                        keysLoaded={keysLoaded}
                        endpointUrl={`${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`}
                        workflowId={workflowId || ''}
                        onSubmit={onDeploy}
                        getInputFormatExample={getInputFormatExample}
                        onApiKeyCreated={fetchApiKeys}
                        formId='deploy-api-form'
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === 'chat' && (
                <ChatDeploy
                  workflowId={workflowId || ''}
                  deploymentInfo={deploymentInfo}
                  onChatExistsChange={setChatExists}
                  chatSubmitting={chatSubmitting}
                  setChatSubmitting={setChatSubmitting}
                  onValidationChange={setIsChatFormValid}
                  onPreDeployWorkflow={handleWorkflowPreDeploy}
                  onDeploymentComplete={handleCloseModal}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {activeTab === 'api' && !isDeployed && (
          <div className='flex flex-shrink-0 items-center justify-between border-border/40 border-t bg-muted/20 px-6 py-4'>
            <button
              onClick={handleCloseModal}
              className='rounded-lg px-4 py-2 font-medium text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-[0.98]'
            >
              Cancel
            </button>

            <Button
              type='submit'
              form='deploy-api-form'
              disabled={isSubmitting || (!keysLoaded && !apiKeys.length)}
              className={cn(
                'h-9 gap-2 rounded-lg px-5 font-medium text-[13px]',
                'bg-foreground text-background hover:bg-foreground/90',
                'shadow-sm transition-all duration-150',
                'active:scale-[0.98]',
                'disabled:opacity-40'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  Deploying...
                </>
              ) : (
                <>
                  <Zap className='h-3.5 w-3.5' />
                  Deploy
                </>
              )}
            </Button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className='flex flex-shrink-0 items-center justify-between border-border/40 border-t bg-muted/20 px-6 py-4'>
            <button
              onClick={handleCloseModal}
              className='rounded-lg px-4 py-2 font-medium text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-[0.98]'
            >
              Cancel
            </button>

            <div className='flex items-center gap-2'>
              {chatExists && (
                <button
                  type='button'
                  onClick={() => {
                    const form = document.getElementById('chat-deploy-form') as HTMLFormElement
                    if (form) {
                      const deleteButton = form.querySelector(
                        '[data-delete-trigger]'
                      ) as HTMLButtonElement
                      if (deleteButton) {
                        deleteButton.click()
                      }
                    }
                  }}
                  disabled={chatSubmitting}
                  className={cn(
                    'h-9 rounded-lg border border-destructive/30 px-4 font-medium text-[13px] text-destructive',
                    'transition-all duration-150 hover:bg-destructive/10',
                    'active:scale-[0.98] disabled:opacity-40'
                  )}
                >
                  Remove
                </button>
              )}
              <Button
                type='button'
                onClick={handleChatFormSubmit}
                disabled={chatSubmitting || !isChatFormValid}
                className={cn(
                  'h-9 gap-2 rounded-lg px-5 font-medium text-[13px]',
                  'bg-foreground text-background hover:bg-foreground/90',
                  'shadow-sm transition-all duration-150',
                  'active:scale-[0.98]',
                  'disabled:opacity-40'
                )}
              >
                {chatSubmitting ? (
                  <>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    Deploying...
                  </>
                ) : chatExists ? (
                  'Update Chat'
                ) : (
                  <>
                    <Zap className='h-3.5 w-3.5' />
                    Deploy Chat
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
