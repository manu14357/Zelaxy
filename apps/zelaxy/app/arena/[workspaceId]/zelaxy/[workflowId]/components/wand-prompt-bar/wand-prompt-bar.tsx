import { useCallback, useEffect, useRef, useState } from 'react'
import { KeyRoundIcon, SendIcon, Settings2Icon, XIcon } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ZelaxyLogo } from '@/components/ui/zelaxy-logo'
import { cn } from '@/lib/utils'
import { useEnvironmentStore } from '@/stores/settings/environment/store'

const AGIE_API_KEY = 'AGIE_API_KEY'
const AGIE_MODEL = 'AGIE_MODEL'

const AVAILABLE_MODELS = [
  { value: 'gpt-5.4', label: 'GPT-5.4' },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
  { value: 'gpt-5.4-nano', label: 'GPT-5.4 Nano' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
  { value: 'o4-mini', label: 'o4 Mini' },
  { value: 'o3', label: 'o3' },
] as const

interface WandPromptBarProps {
  isVisible: boolean
  isLoading: boolean
  isStreaming: boolean
  promptValue: string
  onSubmit: (prompt: string) => void
  onCancel: () => void
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function WandPromptBar({
  isVisible,
  isLoading,
  isStreaming,
  promptValue,
  onSubmit,
  onCancel,
  onChange,
  placeholder = 'Describe what you want to generate...',
  className,
}: WandPromptBarProps) {
  const promptBarRef = useRef<HTMLDivElement>(null)
  const [isExiting, setIsExiting] = useState(false)
  const [portalMounted, setPortalMounted] = useState(false)

  // Setup screen state
  const [showSetup, setShowSetup] = useState(false)
  const [setupApiKey, setSetupApiKey] = useState('')
  const [setupModel, setSetupModel] = useState('gpt-4o')
  const [setupSaving, setSetupSaving] = useState(false)
  const [setupChecked, setSetupChecked] = useState(false)

  const { getVariable, loadEnvironmentVariables, variables } = useEnvironmentStore()

  // Check if API key is configured when the dialog becomes visible
  useEffect(() => {
    if (isVisible && !setupChecked) {
      loadEnvironmentVariables().then(() => {
        setSetupChecked(true)
      })
    }
  }, [isVisible, setupChecked, loadEnvironmentVariables])

  // Determine if we need the setup screen after variables load
  useEffect(() => {
    if (isVisible && setupChecked) {
      const existingKey = getVariable(AGIE_API_KEY)
      if (!existingKey) {
        setShowSetup(true)
      } else {
        setShowSetup(false)
      }
    }
  }, [isVisible, setupChecked, getVariable, variables])

  // Reset setup state when dialog closes
  useEffect(() => {
    if (!isVisible) {
      setSetupChecked(false)
      setSetupApiKey('')
      setSetupModel('gpt-4o')
      setSetupSaving(false)
    }
  }, [isVisible])

  const handleSaveSetup = useCallback(async () => {
    if (!setupApiKey.trim()) return

    setSetupSaving(true)
    try {
      // Get existing variables and add AGIE keys
      const allVars = useEnvironmentStore.getState().getAllVariables()
      const flatVars: Record<string, string> = {}
      for (const [key, envVar] of Object.entries(allVars)) {
        flatVars[key] = envVar.value
      }
      flatVars[AGIE_API_KEY] = setupApiKey.trim()
      flatVars[AGIE_MODEL] = setupModel

      await useEnvironmentStore.getState().saveEnvironmentVariables(flatVars)
      await loadEnvironmentVariables()
      setShowSetup(false)
    } finally {
      setSetupSaving(false)
    }
  }, [setupApiKey, setupModel, loadEnvironmentVariables])

  // Handle the fade-out animation
  const handleCancel = () => {
    if (!isLoading && !isStreaming) {
      setIsExiting(true)
      // Wait for animation to complete before actual cancellation
      setTimeout(() => {
        setIsExiting(false)
        onCancel()
      }, 200) // Slightly longer for modal animation
    } else if (isStreaming) {
      onCancel() // Allow canceling during streaming
    }
  }

  useEffect(() => {
    // Handle Escape key globally
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible && !isExiting) {
        handleCancel()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isVisible, isExiting])

  // Reset the exit state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setIsExiting(false)
    }
  }, [isVisible])

  // Portal mount guard — must be above early returns to satisfy Rules of Hooks
  useEffect(() => {
    setPortalMounted(true)
  }, [])

  if (!isVisible && !isStreaming && !isExiting) {
    return null
  }

  const modalContent = (
    <>
      {/* Modal Backdrop */}
      <div
        className={cn(
          'modal-backdrop fixed inset-0 z-[99998] bg-black/10 transition-all duration-200',
          isExiting ? 'opacity-0' : 'opacity-100'
        )}
        onClick={handleCancel}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'modal-container fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-200',
          isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        )}
      >
        <div
          ref={promptBarRef}
          className={cn(
            'w-full max-w-lg rounded-lg border-2 border-primary/20 bg-background/95 shadow-2xl backdrop-blur-md',
            'min-h-[4rem]',
            className
          )}
          onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
        >
          {/* Header */}
          <div className='flex items-center justify-between border-border/50 border-b px-4 py-3'>
            <div className='flex items-center gap-3'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className='flex cursor-pointer items-center'>
                      <ZelaxyLogo
                        size={24}
                        variant='blue'
                        className='text-primary dark:text-primary/80'
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Agie — Your AI Writer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className='font-medium text-foreground text-sm leading-none'>
                {showSetup
                  ? 'Agie - Setup'
                  : isStreaming
                    ? 'Generating Content...'
                    : 'Agie - AI Content Generator'}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              {!showSetup && !isStreaming && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          const existingKey = getVariable(AGIE_API_KEY)
                          const existingModel = getVariable(AGIE_MODEL)
                          if (existingKey) setSetupApiKey(existingKey)
                          if (existingModel) setSetupModel(existingModel)
                          setShowSetup(true)
                        }}
                        className='h-8 w-8 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      >
                        <Settings2Icon className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit API Key & Model</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                variant='ghost'
                size='icon'
                onClick={handleCancel}
                className='h-8 w-8 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              >
                <XIcon className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Setup Screen */}
          {showSetup ? (
            <div className='p-4'>
              <div className='mb-4 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3'>
                <KeyRoundIcon className='h-5 w-5 flex-shrink-0 text-primary' />
                <p className='text-muted-foreground text-sm'>
                  Enter your OpenAI API key and select a model to use Agie AI. Your key will be
                  securely stored in your Environment Variables.
                </p>
              </div>

              <div className='space-y-4'>
                <div>
                  <label
                    htmlFor='agie-api-key'
                    className='mb-1.5 block font-medium text-foreground text-sm'
                  >
                    API Key <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    id='agie-api-key'
                    type='password'
                    value={setupApiKey}
                    onChange={(e) => setSetupApiKey(e.target.value)}
                    placeholder='sk-...'
                    className='h-10 border-2 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/20'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && setupApiKey.trim()) {
                        handleSaveSetup()
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor='agie-model'
                    className='mb-1.5 block font-medium text-foreground text-sm'
                  >
                    Model
                  </label>
                  <Select value={setupModel} onValueChange={setSetupModel}>
                    <SelectTrigger id='agie-model' className='h-10 border-2'>
                      <SelectValue placeholder='Select a model' />
                    </SelectTrigger>
                    <SelectContent className='z-[100000]'>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='mt-4 flex justify-end gap-2'>
                <Button variant='outline' onClick={handleCancel} className='px-4'>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSetup}
                  disabled={setupSaving || !setupApiKey.trim()}
                  className='px-6'
                >
                  {setupSaving ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRoundIcon className='mr-2 h-4 w-4' />
                      Save & Continue
                    </>
                  )}
                </Button>
              </div>

              <p className='mt-2 text-muted-foreground text-xs'>
                You can update your API key anytime via the{' '}
                <Settings2Icon className='inline h-3 w-3' /> icon or in Settings → Environment
                Variables.
              </p>
            </div>
          ) : (
            /* Prompt Content */
            <div className='p-4'>
              <div className='relative'>
                <Input
                  value={isStreaming ? 'Generating amazing content...' : promptValue}
                  onChange={(e) => !isStreaming && onChange(e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    'h-12 border-2 text-base placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/20',
                    isStreaming && 'border-primary/30 text-primary',
                    (isLoading || isStreaming) && 'loading-placeholder'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading && !isStreaming && promptValue.trim()) {
                      onSubmit(promptValue)
                    }
                  }}
                  disabled={isLoading || isStreaming}
                  autoFocus={!isStreaming}
                />
                {isStreaming && (
                  <div className='pointer-events-none absolute inset-0 h-full w-full overflow-hidden'>
                    <div className='shimmer-effect' />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='mt-4 flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={handleCancel}
                  disabled={isLoading}
                  className='px-4'
                >
                  {isStreaming ? 'Cancel' : 'Close'}
                </Button>

                {!isStreaming && (
                  <Button
                    onClick={() => onSubmit(promptValue)}
                    disabled={isLoading || !promptValue.trim()}
                    className='px-6'
                  >
                    {isLoading ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SendIcon className='mr-2 h-4 w-4' />
                        Generate
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Helper Text */}
              {!isStreaming && (
                <p className='mt-2 text-muted-foreground text-xs'>
                  Press <kbd className='bg-muted px-1 py-0.5 text-xs'>Enter</kbd> to generate or{' '}
                  <kbd className='bg-muted px-1 py-0.5 text-xs'>Esc</kbd> to close
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .modal-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }

        .modal-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes smoke-pulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .status-indicator {
          position: relative;
          width: 16px;
          height: 16px;
          overflow: hidden;
          background-color: hsl(var(--muted-foreground) / 0.5);
          transition: background-color 0.3s ease;
        }

        .status-indicator.streaming {
          background-color: transparent;
        }

        .status-indicator.streaming::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle,
            hsl(var(--primary) / 0.7) 0%,
            hsl(var(--primary) / 0.2) 60%,
            transparent 80%
          );
          animation: smoke-pulse 1.8s ease-in-out infinite;
        }

        .shimmer-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 2s infinite;
        }

        .dark .shimmer-effect {
          background: linear-gradient(
            90deg,
            rgba(50, 50, 50, 0) 0%,
            rgba(80, 80, 80, 0.4) 50%,
            rgba(50, 50, 50, 0) 100%
          );
        }
      `}</style>
    </>
  )

  // Use portal to render modal at document body level to escape parent constraints
  if (!portalMounted) return null
  return createPortal(modalContent, document.body)
}
