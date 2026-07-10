'use client'

/**
 * Inline Tool Call Component
 * Renders a single copilot tool call as a polished, expandable row: a contextual status title
 * (e.g. "Searching online for …", "Built workflow"), a clear state icon (spinner → check → error →
 * skipped), an optional duration, and — on click — the tool's arguments and result in a structured
 * JSON view. Preserves Agie's interrupt flow (Run / Skip / Move-to-Background) for tools that require
 * user confirmation. Matches the ZelaxyArena agent surface's visual language.
 */

import { type ReactNode, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Eye,
  Loader2,
  Minus,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notifyServerTool } from '@/lib/copilot/tools/notification-utils'
import { toolRegistry } from '@/lib/copilot/tools/registry'
import { toolRequiresInterrupt } from '@/lib/copilot/tools/utils'
import { cn } from '@/lib/utils'
import { JsonTree } from '@/app/arena/[workspaceId]/zelaxyarena/json-tree'
import { resolveToolStatusTitle } from '@/app/arena/[workspaceId]/zelaxyarena/tool-status'
import { useCopilotStore } from '@/stores/copilot/store'
import type { CopilotToolCall } from '@/stores/copilot/types'

interface InlineToolCallProps {
  toolCall: CopilotToolCall
  onStateChange?: (state: any) => void
  context?: Record<string, any>
}

/** Coarse visual status derived from the (many) fine-grained tool states. */
export type ToolVisualStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped'

export function toolVisualStatus(state: string): ToolVisualStatus {
  switch (state) {
    case 'executing':
    case 'accepted':
    case 'background':
      return 'running'
    case 'success':
    case 'completed':
    case 'applied':
    case 'ready_for_review':
      return 'done'
    case 'errored':
    case 'aborted':
      return 'error'
    case 'rejected':
      return 'skipped'
    default:
      return 'pending'
  }
}

// Simple function to check if tool call should show run/skip buttons
function shouldShowRunSkipButtons(toolCall: CopilotToolCall): boolean {
  // Check if tool requires interrupt and is in pending state
  return toolRequiresInterrupt(toolCall.name) && toolCall.state === 'pending'
}

// Function to accept a server tool (interrupt required)
async function serverAcceptTool(
  toolCall: CopilotToolCall,
  setToolCallState: (toolCall: any, state: string, options?: any) => void
): Promise<void> {
  // Set state directly to executing (skip accepted state)
  setToolCallState(toolCall, 'executing')

  try {
    // Notify server of acceptance - execution happens elsewhere via SSE
    await notifyServerTool(toolCall.id, toolCall.name, 'accepted')
  } catch (error) {
    console.error('Failed to notify server of tool acceptance:', error)
    setToolCallState(toolCall, 'error', { error: 'Failed to notify server' })
  }
}

// Function to accept a client tool
async function clientAcceptTool(
  toolCall: CopilotToolCall,
  setToolCallState: (toolCall: any, state: string, options?: any) => void,
  onStateChange?: (state: any) => void,
  context?: Record<string, any>
): Promise<void> {
  setToolCallState(toolCall, 'executing')

  // Trigger UI update immediately with explicit state
  onStateChange?.('executing')

  try {
    // Get the tool and execute it directly
    const tool = toolRegistry.getTool(toolCall.name)
    if (tool) {
      await tool.execute(toolCall, {
        onStateChange: (state: any) => {
          setToolCallState(toolCall, state)
        },
        context,
      })
    } else {
      throw new Error(`Tool not found: ${toolCall.name}`)
    }
  } catch (error) {
    console.error('Error executing client tool:', error)
    const errorMessage = error instanceof Error ? error.message : 'Tool execution failed'
    const failedDependency =
      error && typeof error === 'object' && 'failedDependency' in error
        ? (error as any).failedDependency
        : false
    // Check if failedDependency is true to set 'rejected' state instead of 'errored'
    const targetState = failedDependency === true ? 'rejected' : 'errored'
    setToolCallState(toolCall, targetState, {
      error: errorMessage,
    })
  }
}

// Function to reject any tool
async function rejectTool(
  toolCall: CopilotToolCall,
  setToolCallState: (toolCall: any, state: string, options?: any) => void
): Promise<void> {
  // NEW LOGIC: Use centralized state management
  setToolCallState(toolCall, 'rejected')

  try {
    // Notify server for both client and server tools
    await notifyServerTool(toolCall.id, toolCall.name, 'rejected')
  } catch (error) {
    console.error('Failed to notify server of tool rejection:', error)
  }
}

// Function to get tool display name based on state
function getToolDisplayNameByState(toolCall: CopilotToolCall): string {
  const toolName = toolCall.name
  const state = toolCall.state

  // Check if it's a client tool
  const clientTool = toolRegistry.getTool(toolName)
  if (clientTool) {
    // Use client tool's display name logic
    return clientTool.getDisplayName(toolCall)
  }

  // For server tools, use server tool metadata
  const serverToolMetadata = toolRegistry.getServerToolMetadata(toolName)
  if (serverToolMetadata) {
    // Check if there's a dynamic display name function
    if (serverToolMetadata.displayConfig.getDynamicDisplayName) {
      const dynamicName = serverToolMetadata.displayConfig.getDynamicDisplayName(
        state,
        toolCall.input || toolCall.parameters || {}
      )
      if (dynamicName) return dynamicName
    }

    // Use state-specific display config
    const stateConfig = serverToolMetadata.displayConfig.states[state]
    if (stateConfig) {
      return stateConfig.displayName
    }
  }

  // Fallback to tool name if no specific display logic found
  return toolName
}

/**
 * Resolve the human-readable title for a tool call. Prefers the tool registry's curated per-state
 * display name (which may be dynamic, using the call's arguments); falls back to the shared
 * contextual resolver ("Searching online for …", "Built workflow") so unregistered tools still read
 * cleanly instead of showing a raw snake_case id.
 */
function getToolTitle(toolCall: CopilotToolCall): string {
  const registryName = getToolDisplayNameByState(toolCall)
  if (registryName && registryName !== toolCall.name) return registryName

  const visual = toolVisualStatus(toolCall.state)
  const status =
    visual === 'done' || visual === 'error' || visual === 'skipped' ? 'done' : 'running'
  return resolveToolStatusTitle(toolCall.name, status, toolCall.input || toolCall.parameters)
}

/** Small state glyph, matching the ZelaxyArena agent surface. */
function ToolStatusIcon({ status, className }: { status: ToolVisualStatus; className?: string }) {
  const base = className ?? 'size-[15px]'
  switch (status) {
    case 'running':
      return <Loader2 className={cn(base, 'animate-spin text-muted-foreground')} />
    case 'done':
      return <CheckCircle2 className={cn(base, 'text-muted-foreground')} />
    case 'error':
      return <XCircle className={cn(base, 'text-destructive')} />
    case 'skipped':
      return (
        <span
          className={cn(
            'flex items-center justify-center rounded-full border border-muted-foreground/40',
            base
          )}
        >
          <Minus className='h-2.5 w-2.5 text-muted-foreground' />
        </span>
      )
    default:
      return <CircleDashed className={cn(base, 'text-muted-foreground/60')} />
  }
}

/** Format a run duration (ms) compactly: "820ms", "1.4s". */
function formatDuration(ms?: number): string | null {
  if (!ms || ms <= 0) return null
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`
}

function errorText(err: CopilotToolCall['error']): string | null {
  if (!err) return null
  return typeof err === 'string' ? err : err.message || null
}

function hasContent(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  return true
}

/** A titled section inside the expanded detail panel. */
function DetailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='space-y-1'>
      <div className='font-medium text-[10px] text-muted-foreground/70 uppercase tracking-wide'>
        {label}
      </div>
      <div className='max-h-56 overflow-auto rounded-md border border-border/50 bg-background/60 px-2 py-1.5'>
        {children}
      </div>
    </div>
  )
}

// Simple run/skip buttons component
function RunSkipButtons({
  toolCall,
  onStateChange,
  context,
}: {
  toolCall: CopilotToolCall
  onStateChange?: (state: any) => void
  context?: Record<string, any>
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [buttonsHidden, setButtonsHidden] = useState(false)
  const { setToolCallState } = useCopilotStore()

  const handleRun = async () => {
    setIsProcessing(true)
    setButtonsHidden(true) // Hide run/skip buttons immediately

    try {
      // Check if it's a client tool or server tool
      const clientTool = toolRegistry.getTool(toolCall.name)

      if (clientTool) {
        // Client tool - execute immediately
        await clientAcceptTool(toolCall, setToolCallState, onStateChange, context)
        // Trigger re-render after tool execution completes
        onStateChange?.(toolCall.state)
      } else {
        // Server tool
        await serverAcceptTool(toolCall, setToolCallState)
        // Trigger re-render by calling onStateChange if provided
        onStateChange?.(toolCall.state)
      }
    } catch (error) {
      console.error('Error handling run action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkip = async () => {
    setIsProcessing(true)
    setButtonsHidden(true) // Hide run/skip buttons immediately

    try {
      await rejectTool(toolCall, setToolCallState)

      // Trigger re-render by calling onStateChange if provided
      onStateChange?.(toolCall.state)
    } catch (error) {
      console.error('Error handling skip action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // If buttons are hidden, show nothing
  if (buttonsHidden) {
    return null
  }

  // Default run/skip buttons
  return (
    <div className='flex flex-shrink-0 items-center gap-1.5'>
      <Button
        onClick={handleRun}
        disabled={isProcessing}
        size='sm'
        className='h-6 bg-foreground px-2.5 font-medium text-background text-xs hover:bg-foreground/90 disabled:opacity-50'
      >
        {isProcessing ? <Loader2 className='mr-1 h-3 w-3 animate-spin' /> : null}
        Run
      </Button>
      <Button
        onClick={handleSkip}
        disabled={isProcessing}
        size='sm'
        variant='outline'
        className='h-6 px-2.5 font-medium text-xs disabled:opacity-50'
      >
        Skip
      </Button>
    </div>
  )
}

export function InlineToolCall({ toolCall, onStateChange, context }: InlineToolCallProps) {
  const [, forceUpdate] = useState({})
  const [expanded, setExpanded] = useState(false)
  const { setToolCallState } = useCopilotStore()

  if (!toolCall) {
    return null
  }

  const showButtons = shouldShowRunSkipButtons(toolCall)

  // Check if we should show background button (when in executing state)
  const clientTool = toolRegistry.getTool(toolCall.name)
  const allowsBackground = clientTool?.metadata?.allowBackgroundExecution || false
  const showBackgroundButton = allowsBackground && toolCall.state === 'executing' && !showButtons

  const handleStateChange = (state: any) => {
    // Force component re-render
    forceUpdate({})
    // Call parent onStateChange if provided
    onStateChange?.(state)
  }

  const status = toolVisualStatus(toolCall.state)
  const title = getToolTitle(toolCall)
  const duration =
    status === 'done' || status === 'error' ? formatDuration(toolCall.duration) : null
  const err = errorText(toolCall.error)
  const input = toolCall.input || toolCall.parameters
  const showInput = hasContent(input)
  const showResult = hasContent(toolCall.result)
  const canExpand = showInput || showResult || Boolean(err)

  return (
    <div className='group/tool flex flex-col gap-1 py-0.5'>
      <div className='flex items-center justify-between gap-2'>
        <button
          type='button'
          onClick={() => canExpand && setExpanded((e) => !e)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 text-left',
            canExpand ? 'cursor-pointer' : 'cursor-default'
          )}
        >
          <span className='flex size-4 flex-shrink-0 items-center justify-center'>
            <ToolStatusIcon status={status} />
          </span>
          <span
            className={cn(
              'min-w-0 truncate text-[13px]',
              status === 'error' ? 'text-destructive' : 'text-muted-foreground'
            )}
            title={err && status === 'error' ? err : undefined}
          >
            {title}
          </span>
          {duration && (
            <span className='flex-shrink-0 text-[10px] text-muted-foreground/50 tabular-nums'>
              {duration}
            </span>
          )}
          {canExpand && (
            <ChevronRight
              className={cn(
                'h-3 w-3 flex-shrink-0 text-muted-foreground/50 transition-transform',
                'opacity-0 group-hover/tool:opacity-100',
                expanded && 'rotate-90 opacity-100'
              )}
            />
          )}
        </button>

        {showButtons && (
          <RunSkipButtons toolCall={toolCall} onStateChange={handleStateChange} context={context} />
        )}

        {showBackgroundButton && (
          <div className='flex flex-shrink-0 items-center gap-1.5'>
            <Button
              onClick={async () => {
                try {
                  // Set tool state to background
                  setToolCallState(toolCall, 'background')

                  // Notify the backend about background state with execution start time if available
                  const executionStartTime = context?.executionStartTime
                  await notifyServerTool(
                    toolCall.id,
                    toolCall.name,
                    'background',
                    executionStartTime
                  )

                  // Track that this tool was moved to background
                  if (context) {
                    if (!context.movedToBackgroundToolIds) {
                      context.movedToBackgroundToolIds = new Set()
                    }
                    context.movedToBackgroundToolIds.add(toolCall.id)
                  }

                  // Trigger re-render
                  onStateChange?.(toolCall.state)
                } catch (error) {
                  console.error('Error moving to background:', error)
                }
              }}
              size='sm'
              variant='outline'
              className='h-6 gap-1 px-2 font-medium text-xs'
            >
              <Eye className='h-3 w-3' />
              Background
            </Button>
          </div>
        )}
      </div>

      {expanded && canExpand && (
        <div className='ml-6 flex flex-col gap-2 pb-1'>
          {showInput && (
            <DetailSection label='Arguments'>
              <JsonTree data={input} />
            </DetailSection>
          )}
          {showResult && (
            <DetailSection label='Result'>
              {typeof toolCall.result === 'string' ? (
                <pre className='whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground'>
                  {toolCall.result}
                </pre>
              ) : (
                <JsonTree data={toolCall.result} />
              )}
            </DetailSection>
          )}
          {err && (
            <DetailSection label='Error'>
              <pre className='whitespace-pre-wrap break-words font-mono text-[11px] text-destructive'>
                {err}
              </pre>
            </DetailSection>
          )}
        </div>
      )}
    </div>
  )
}
