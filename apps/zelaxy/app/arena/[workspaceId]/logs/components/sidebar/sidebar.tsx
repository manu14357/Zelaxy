'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bird,
  Cat,
  ChevronDown,
  ChevronUp,
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
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BASE_EXECUTION_CHARGE } from '@/lib/billing/constants'
import { redactApiKeys } from '@/lib/utils'
import { FrozenCanvas } from '@/app/arena/[workspaceId]/logs/components/frozen-canvas/frozen-canvas'
import { FileDownload } from '@/app/arena/[workspaceId]/logs/components/sidebar/components/file-download'
import LogMarkdownRenderer from '@/app/arena/[workspaceId]/logs/components/sidebar/components/markdown-renderer'
import { ToolCallsDisplay } from '@/app/arena/[workspaceId]/logs/components/tool-calls/tool-calls-display'
import { TraceSpansDisplay } from '@/app/arena/[workspaceId]/logs/components/trace-spans/trace-spans-display'
import { formatDate } from '@/app/arena/[workspaceId]/logs/utils/format-date'
import { formatCost } from '@/providers/utils'
import type { WorkflowLog } from '@/stores/logs/filters/types'

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

interface LogSidebarProps {
  log: WorkflowLog | null
  isOpen: boolean
  onClose: () => void
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

/**
 * Tries to parse a string as JSON and prettify it
 */
const tryPrettifyJson = (content: string): { isJson: boolean; formatted: string } => {
  try {
    // First check if the content looks like JSON (starts with { or [)
    const trimmed = content.trim()
    if (
      !(trimmed.startsWith('{') || trimmed.startsWith('[')) ||
      !(trimmed.endsWith('}') || trimmed.endsWith(']'))
    ) {
      return { isJson: false, formatted: content }
    }

    // Try to parse the JSON
    const parsed = JSON.parse(trimmed)
    const prettified = JSON.stringify(parsed, null, 2)
    return { isJson: true, formatted: prettified }
  } catch (_e) {
    // If parsing fails, it's not valid JSON
    return { isJson: false, formatted: content }
  }
}

/**
 * Formats JSON content for display, handling multiple JSON objects separated by '--'
 */
const formatJsonContent = (content: string, blockInput?: Record<string, any>): React.ReactNode => {
  // Look for a pattern like "Block Agent 1 (agent):" to separate system comment from content
  const blockPattern = /^(Block .+?\(.+?\):)\s*/
  const match = content.match(blockPattern)

  if (match) {
    const systemComment = match[1]
    const actualContent = content.substring(match[0].length).trim()
    const { isJson, formatted } = tryPrettifyJson(actualContent)

    return (
      <BlockContentDisplay
        systemComment={systemComment}
        formatted={formatted}
        isJson={isJson}
        blockInput={blockInput}
      />
    )
  }

  // If no system comment pattern found, show the whole content
  const { isJson, formatted } = tryPrettifyJson(content)

  return (
    <div className='group relative w-full rounded-lg border border-border/40 bg-muted/20 p-3'>
      <CopyButton text={formatted} className='z-10 h-7 w-7' />
      {isJson ? (
        <pre className='max-h-[500px] w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all text-[12px]'>
          {formatted}
        </pre>
      ) : (
        <LogMarkdownRenderer content={formatted} />
      )}
    </div>
  )
}

const BlockContentDisplay = ({
  systemComment,
  formatted,
  isJson,
  blockInput,
}: {
  systemComment: string
  formatted: string
  isJson: boolean
  blockInput?: Record<string, any>
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'input'>(blockInput ? 'output' : 'output')

  const redactedBlockInput = useMemo(() => {
    return blockInput ? redactApiKeys(blockInput) : undefined
  }, [blockInput])

  const redactedOutput = useMemo(() => {
    if (!isJson) return formatted

    try {
      const parsedOutput = JSON.parse(formatted)
      const redactedJson = redactApiKeys(parsedOutput)
      return JSON.stringify(redactedJson, null, 2)
    } catch (_e) {
      return formatted
    }
  }, [formatted, isJson])

  return (
    <div className='w-full'>
      <div className='mb-2 border-border/30 border-b pb-1.5 font-medium text-[13px] text-foreground'>
        {systemComment}
      </div>

      {/* Tabs for switching between output and input */}
      {redactedBlockInput && (
        <div className='mb-3 flex gap-1 rounded-lg bg-muted/30 p-0.5'>
          <button
            onClick={() => setActiveTab('output')}
            className={`rounded-md px-3 py-1.5 font-medium text-[12px] transition-colors ${
              activeTab === 'output'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Response
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`rounded-md px-3 py-1.5 font-medium text-[12px] transition-colors ${
              activeTab === 'input'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Parameters
          </button>
        </div>
      )}

      <div className='group relative rounded-lg border border-border/40 bg-muted/20 p-3'>
        {activeTab === 'output' ? (
          <>
            <CopyButton text={redactedOutput} className='z-10 h-7 w-7' />
            {isJson ? (
              <pre className='w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all text-[12px]'>
                {redactedOutput}
              </pre>
            ) : (
              <LogMarkdownRenderer content={redactedOutput} />
            )}
          </>
        ) : (
          <>
            <CopyButton
              text={JSON.stringify(redactedBlockInput, null, 2)}
              className='z-10 h-7 w-7'
            />
            <pre className='w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all text-[12px]' />
          </>
        )}
      </div>
    </div>
  )
}

export function Sidebar({
  log,
  isOpen,
  onClose,
  onNavigateNext,
  onNavigatePrev,
  hasNext = false,
  hasPrev = false,
}: LogSidebarProps) {
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth)
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Responsive sidebar widths - use full width on mobile
  const isMobile = windowWidth > 0 && windowWidth < 640
  const MIN_WIDTH = isMobile ? windowWidth : 400
  const DEFAULT_WIDTH = isMobile ? windowWidth : 600
  const EXPANDED_WIDTH = isMobile ? windowWidth : 800

  const [width, setWidth] = useState(0) // Will be set after mount
  const [isDragging, setIsDragging] = useState(false)
  const [_currentLogId, setCurrentLogId] = useState<string | null>(null)
  const [isTraceExpanded, setIsTraceExpanded] = useState(false)
  const [isModelsExpanded, setIsModelsExpanded] = useState(false)
  const [isFrozenCanvasExpanded, setIsFrozenCanvasExpanded] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Initialize width after mount
  useEffect(() => {
    if (windowWidth > 0 && width === 0) {
      setWidth(DEFAULT_WIDTH)
    }
  }, [windowWidth, DEFAULT_WIDTH, width])

  // Update currentLogId when log changes
  useEffect(() => {
    if (log?.id) {
      setCurrentLogId(log.id)
      // Reset trace expanded state when log changes
      setIsTraceExpanded(false)
    }
  }, [log?.id])

  const formattedContent = useMemo(() => {
    if (!log) return null

    let blockInput: Record<string, any> | undefined

    if (log.metadata?.blockInput) {
      blockInput = log.metadata.blockInput
    } else if (log.metadata?.traceSpans) {
      const blockIdMatch = log.message.match(/Block .+?(\d+)/i)
      const blockId = blockIdMatch ? blockIdMatch[1] : null

      if (blockId) {
        const matchingSpan = log.metadata.traceSpans.find(
          (span) => span.blockId === blockId || span.name.includes(`Block ${blockId}`)
        )

        if (matchingSpan?.input) {
          blockInput = matchingSpan.input
        }
      }
    }

    return formatJsonContent(log.message, blockInput)
  }, [log])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [log?.id])

  // Determine if this is a workflow execution log
  const isWorkflowExecutionLog = useMemo(() => {
    if (!log) return false
    // Check if message contains workflow execution phrases (success or failure)
    return (
      log.message.toLowerCase().includes('workflow executed') ||
      log.message.toLowerCase().includes('execution completed') ||
      log.message.toLowerCase().includes('workflow execution failed') ||
      log.message.toLowerCase().includes('execution failed') ||
      (log.trigger === 'manual' && log.duration) ||
      // Also check if we have enhanced logging metadata with trace spans
      (log.metadata?.enhanced && log.metadata?.traceSpans)
    )
  }, [log])

  // Helper to determine if we have cost information to display
  // All workflow executions now have cost info (base charge + any model costs)
  const hasCostInfo = useMemo(() => {
    return isWorkflowExecutionLog && log?.metadata?.cost
  }, [log, isWorkflowExecutionLog])

  const isWorkflowWithCost = useMemo(() => {
    return isWorkflowExecutionLog && hasCostInfo
  }, [isWorkflowExecutionLog, hasCostInfo])

  // Handle trace span expansion state
  const handleTraceSpanToggle = (expanded: boolean) => {
    setIsTraceExpanded(expanded)

    // If a trace span is expanded, increase the sidebar width only if it's currently below the expanded width
    if (expanded) {
      // Only expand if current width is less than expanded width
      if (width < EXPANDED_WIDTH) {
        setWidth(EXPANDED_WIDTH)
      }
    } else {
      // If all trace spans are collapsed, revert to default width only if we're at expanded width
      if (width === EXPANDED_WIDTH) {
        setWidth(DEFAULT_WIDTH)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = window.innerWidth - e.clientX
        // Maintain minimum width and respect expansion state
        const minWidthToUse = isTraceExpanded ? Math.max(MIN_WIDTH, EXPANDED_WIDTH) : MIN_WIDTH
        setWidth(Math.max(minWidthToUse, Math.min(newWidth, window.innerWidth * 0.8)))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isTraceExpanded, MIN_WIDTH, EXPANDED_WIDTH, width])

  // Handle escape key to close the sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }

      // Add keyboard shortcuts for navigation
      if (isOpen) {
        // Up arrow key for previous log
        if (e.key === 'ArrowUp' && hasPrev && onNavigatePrev) {
          e.preventDefault()
          handleNavigate(onNavigatePrev)
        }

        // Down arrow key for next log
        if (e.key === 'ArrowDown' && hasNext && onNavigateNext) {
          e.preventDefault()
          handleNavigate(onNavigateNext)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, hasPrev, hasNext, onNavigatePrev, onNavigateNext])

  // Handle navigation
  const handleNavigate = (navigateFunction: () => void) => {
    navigateFunction()
  }

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 transform border-border/50 border-l bg-background/95 backdrop-blur-md ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isDragging ? '' : 'transition-all duration-300 ease-in-out'} z-50 flex flex-col`}
      style={{
        width: isMobile ? '100%' : `${width}px`,
        minWidth: isMobile ? '100%' : `${MIN_WIDTH}px`,
      }}
    >
      <div
        className='absolute top-0 bottom-0 left-0 z-50 w-1 cursor-ew-resize transition-colors hover:bg-primary/20'
        onMouseDown={handleMouseDown}
      />
      {log && (
        <>
          {/* Header */}
          <div className='border-border/50 border-b bg-card/50 px-5 py-3.5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    log.level === 'error'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50'
                      : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  {log.level === 'error' ? (
                    <X className='h-3.5 w-3.5 text-red-500' />
                  ) : (
                    <Zap className='h-3.5 w-3.5 text-primary' />
                  )}
                </div>
                <div>
                  <h2 className='font-semibold text-[14px] text-foreground leading-none'>
                    Execution Details
                  </h2>
                  <p className='mt-1 text-[11px] text-muted-foreground'>
                    {formatDate(log.createdAt).relative}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-0.5'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 rounded-lg p-0 hover:bg-muted'
                        onClick={() => hasPrev && handleNavigate(onNavigatePrev!)}
                        disabled={!hasPrev}
                        aria-label='Previous log'
                      >
                        <ChevronUp className='h-3.5 w-3.5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Previous entry (↑)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 rounded-lg p-0 hover:bg-muted'
                        onClick={() => hasNext && handleNavigate(onNavigateNext!)}
                        disabled={!hasNext}
                        aria-label='Next log'
                      >
                        <ChevronDown className='h-3.5 w-3.5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Next entry (↓)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className='mx-1 h-4 w-px bg-border/60' />

                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 rounded-lg p-0 hover:bg-muted'
                  onClick={onClose}
                  aria-label='Close'
                >
                  <X className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-hidden'>
            <ScrollArea className='h-full w-full overflow-y-auto' ref={scrollAreaRef}>
              <div className='w-full space-y-4 px-4 py-4'>
                {/* ── Overview Card ─────────────────────────────────────── */}
                <div className='rounded-xl border border-border/50 bg-card/50 p-4'>
                  {/* Workflow header inside overview */}
                  {log.workflow && (
                    <div className='group relative mb-3 flex items-center gap-2.5'>
                      <CopyButton text={log.workflow.name} />
                      <div
                        className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border'
                        style={{
                          backgroundColor: `${log.workflow.color}12`,
                          borderColor: `${log.workflow.color}25`,
                        }}
                      >
                        {(() => {
                          const SpaceIcon = getSpaceIcon(log.workflow.id)
                          return (
                            <SpaceIcon
                              className='h-3.5 w-3.5'
                              style={{ color: log.workflow.color }}
                            />
                          )
                        })()}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='truncate font-semibold text-[13px] text-foreground'>
                          {log.workflow.name}
                        </div>
                        <div className='text-[11px] text-muted-foreground'>
                          {formatDate(log.createdAt).full}
                        </div>
                      </div>
                    </div>
                  )}

                  {!log.workflow && (
                    <div className='group relative mb-3'>
                      <CopyButton text={formatDate(log.createdAt).full} />
                      <div className='font-medium text-[13px] text-foreground'>
                        {formatDate(log.createdAt).full}
                      </div>
                    </div>
                  )}

                  {/* Metadata grid */}
                  <div className='grid grid-cols-2 gap-2'>
                    {/* Level */}
                    <div className='rounded-lg bg-muted/40 px-3 py-2'>
                      <div className='font-medium text-[10px] text-muted-foreground uppercase tracking-wider'>
                        Level
                      </div>
                      <div className='mt-1 flex items-center gap-1.5'>
                        <div
                          className={`h-2 w-2 rounded-full ${
                            log.level === 'error'
                              ? 'bg-red-500'
                              : log.level === 'info'
                                ? 'bg-emerald-500'
                                : 'bg-gray-400'
                          }`}
                        />
                        <span
                          className={`font-semibold text-[12px] uppercase ${
                            log.level === 'error'
                              ? 'text-red-600 dark:text-red-400'
                              : log.level === 'info'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-foreground'
                          }`}
                        >
                          {log.level}
                        </span>
                      </div>
                    </div>

                    {/* Trigger */}
                    {log.trigger && (
                      <div className='rounded-lg bg-muted/40 px-3 py-2'>
                        <div className='font-medium text-[10px] text-muted-foreground uppercase tracking-wider'>
                          Trigger
                        </div>
                        <div className='mt-1 flex items-center gap-1.5'>
                          <div
                            className={`h-2 w-2 rounded-full ${
                              log.trigger === 'manual'
                                ? 'bg-gray-400'
                                : log.trigger === 'webhook'
                                  ? 'bg-orange-500'
                                  : log.trigger === 'schedule'
                                    ? 'bg-green-500'
                                    : log.trigger === 'chat'
                                      ? 'bg-blue-500'
                                      : log.trigger === 'api'
                                        ? 'bg-purple-500'
                                        : 'bg-gray-400'
                            }`}
                          />
                          <span className='font-semibold text-[12px] text-foreground capitalize'>
                            {log.trigger}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    {log.duration && (
                      <div className='rounded-lg bg-muted/40 px-3 py-2'>
                        <div className='font-medium text-[10px] text-muted-foreground uppercase tracking-wider'>
                          Duration
                        </div>
                        <div className='mt-1'>
                          <span className='font-semibold text-[12px] text-foreground tabular-nums'>
                            {log.duration}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Blocks */}
                    {log.metadata?.traceSpans && log.metadata.traceSpans.length > 0 && (
                      <div className='rounded-lg bg-muted/40 px-3 py-2'>
                        <div className='font-medium text-[10px] text-muted-foreground uppercase tracking-wider'>
                          Blocks
                        </div>
                        <div className='mt-1'>
                          <span className='font-semibold text-[12px] text-foreground tabular-nums'>
                            {log.metadata.traceSpans.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Run ID */}
                  {log.executionId && (
                    <div className='group relative mt-3 rounded-lg border border-border/30 bg-muted/20 px-3 py-2'>
                      <CopyButton text={log.executionId} />
                      <div className='font-medium text-[10px] text-muted-foreground uppercase tracking-wider'>
                        Run ID
                      </div>
                      <div className='mt-0.5 truncate font-mono text-[11px] text-foreground/80'>
                        {log.executionId}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Attachments Card ─────────────────────────────────── */}
                {log.files && log.files.length > 0 && (
                  <div className='rounded-xl border border-border/50 bg-card/50 p-4'>
                    <h3 className='mb-3 flex items-center gap-2 font-semibold text-[12px] text-foreground uppercase tracking-wider'>
                      <span className='h-1 w-1 rounded-full bg-foreground/40' />
                      Attachments
                      <span className='rounded-full bg-muted/60 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground'>
                        {log.files.length}
                      </span>
                    </h3>
                    <div className='space-y-2'>
                      {log.files.map((file, index) => (
                        <div
                          key={file.id || index}
                          className='flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40'
                        >
                          <div className='min-w-0 flex-1'>
                            <div
                              className='truncate font-medium text-[12px] text-foreground'
                              title={file.name}
                            >
                              {file.name}
                            </div>
                            <div className='mt-0.5 text-[11px] text-muted-foreground'>
                              {file.size ? `${Math.round(file.size / 1024)}KB` : 'Unknown size'}
                              {file.type && ` · ${file.type.split('/')[0]}`}
                            </div>
                          </div>
                          <div className='ml-3 flex items-center gap-1'>
                            <FileDownload file={file} isExecutionFile={true} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Workflow Snapshot Card ──────────────────────────── */}
                {isWorkflowExecutionLog && log.executionId && (
                  <div className='rounded-xl border border-border/50 bg-card/50 p-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='flex items-center gap-2 font-semibold text-[12px] text-foreground uppercase tracking-wider'>
                        <span className='h-1 w-1 rounded-full bg-foreground/40' />
                        Workflow Snapshot
                      </h3>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setIsFrozenCanvasExpanded(!isFrozenCanvasExpanded)}
                        className='h-7 w-7 rounded-lg p-0 hover:bg-muted'
                      >
                        {isFrozenCanvasExpanded ? (
                          <ChevronUp className='h-3.5 w-3.5' />
                        ) : (
                          <ChevronDown className='h-3.5 w-3.5' />
                        )}
                      </Button>
                    </div>

                    {isFrozenCanvasExpanded && (
                      <div className='mt-3'>
                        <div className='h-80 w-full overflow-hidden rounded-lg border border-border/30 bg-background'>
                          <FrozenCanvas
                            executionId={log.executionId}
                            traceSpans={log.metadata?.traceSpans}
                            height='100%'
                            width='100%'
                          />
                        </div>
                        <div className='mt-2 text-[11px] text-muted-foreground'>
                          Click on blocks to see their input and output data
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Execution Log Card ────────────────────────────── */}
                <div className='w-full rounded-xl border border-border/50 bg-card/50 p-4'>
                  <h3 className='mb-3 flex items-center gap-2 font-semibold text-[12px] text-foreground uppercase tracking-wider'>
                    <span className='h-1 w-1 rounded-full bg-foreground/40' />
                    Execution Log
                  </h3>
                  <div className='w-full rounded-lg border border-border/30 bg-muted/20 p-3'>
                    {formattedContent}
                  </div>
                </div>

                {/* ── Performance Trace Card ──────────────────────────── */}
                {isWorkflowExecutionLog && log.metadata?.traceSpans && (
                  <div className='w-full rounded-xl border border-border/50 bg-card/50 p-4'>
                    <h3 className='mb-3 flex items-center gap-2 font-semibold text-[12px] text-foreground uppercase tracking-wider'>
                      <span className='h-1 w-1 rounded-full bg-foreground/40' />
                      Performance Trace
                    </h3>
                    <div className='w-full overflow-x-hidden rounded-lg border border-border/30 bg-muted/20 p-3'>
                      <TraceSpansDisplay
                        traceSpans={log.metadata.traceSpans}
                        totalDuration={log.metadata.totalDuration}
                        onExpansionChange={handleTraceSpanToggle}
                      />
                    </div>
                  </div>
                )}

                {/* ── Tool Executions Card ────────────────────────────── */}
                {log.metadata?.toolCalls && log.metadata.toolCalls.length > 0 && (
                  <div className='w-full rounded-xl border border-border/50 bg-card/50 p-4'>
                    <h3 className='mb-3 flex items-center gap-2 font-semibold text-[12px] text-foreground uppercase tracking-wider'>
                      <span className='h-1 w-1 rounded-full bg-foreground/40' />
                      Tool Executions
                      <span className='rounded-full bg-muted/60 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground'>
                        {log.metadata.toolCalls.length}
                      </span>
                    </h3>
                    <div className='w-full overflow-x-hidden rounded-lg border border-border/30 bg-muted/20 p-3'>
                      <ToolCallsDisplay metadata={log.metadata} />
                    </div>
                  </div>
                )}

                {/* ── Usage & Billing Card ────────────────────────────── */}
                {hasCostInfo && (
                  <div className='overflow-hidden rounded-xl border border-border/50 bg-card/50'>
                    <div className='p-4'>
                      <h3 className='mb-3 flex items-center gap-2 font-semibold text-[12px] text-foreground uppercase tracking-wider'>
                        <span className='h-1 w-1 rounded-full bg-foreground/40' />
                        Usage & Billing
                      </h3>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5'>
                          <span className='text-[12px] text-muted-foreground'>Base Execution</span>
                          <span className='font-medium text-[12px] text-foreground tabular-nums'>
                            {formatCost(BASE_EXECUTION_CHARGE)}
                          </span>
                        </div>
                        <div className='flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5'>
                          <span className='text-[12px] text-muted-foreground'>Model Input</span>
                          <span className='font-medium text-[12px] text-foreground tabular-nums'>
                            {formatCost(log.metadata?.cost?.input || 0)}
                          </span>
                        </div>
                        <div className='flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5'>
                          <span className='text-[12px] text-muted-foreground'>Model Output</span>
                          <span className='font-medium text-[12px] text-foreground tabular-nums'>
                            {formatCost(log.metadata?.cost?.output || 0)}
                          </span>
                        </div>
                        <div className='mt-1 flex items-center justify-between rounded-lg border border-border/30 bg-muted/10 px-3 py-2'>
                          <span className='font-semibold text-[12px] text-foreground'>Total</span>
                          <span className='font-bold text-[13px] text-foreground tabular-nums'>
                            {formatCost(log.metadata?.cost?.total || 0)}
                          </span>
                        </div>
                        <div className='flex items-center justify-between rounded-lg bg-muted/20 px-3 py-1.5'>
                          <span className='font-medium text-[11px] text-muted-foreground'>
                            Tokens
                          </span>
                          <span className='font-mono text-[11px] text-muted-foreground tabular-nums'>
                            {log.metadata?.cost?.tokens?.prompt || 0} in →{' '}
                            {log.metadata?.cost?.tokens?.completion || 0} out
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Models Breakdown */}
                    {log.metadata?.cost?.models &&
                      Object.keys(log.metadata?.cost?.models).length > 0 && (
                        <div className='border-border/40 border-t'>
                          <button
                            onClick={() => setIsModelsExpanded(!isModelsExpanded)}
                            className='flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30'
                          >
                            <span className='font-semibold text-[12px] text-foreground'>
                              Model Details ({Object.keys(log.metadata?.cost?.models || {}).length})
                            </span>
                            {isModelsExpanded ? (
                              <ChevronUp className='h-3.5 w-3.5 text-muted-foreground' />
                            ) : (
                              <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
                            )}
                          </button>

                          {isModelsExpanded && (
                            <div className='space-y-3 border-border/30 border-t bg-muted/20 p-3'>
                              {Object.entries(log.metadata?.cost?.models || {}).map(
                                ([model, cost]: [string, any]) => (
                                  <div
                                    key={model}
                                    className='rounded-lg border border-border/20 bg-background/50 p-3'
                                  >
                                    <div className='font-medium font-mono text-[11px] text-foreground'>
                                      {model}
                                    </div>
                                    <div className='mt-2 space-y-1 text-[11px]'>
                                      <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Input</span>
                                        <span className='text-foreground tabular-nums'>
                                          {formatCost(cost.input || 0)}
                                        </span>
                                      </div>
                                      <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Output</span>
                                        <span className='text-foreground tabular-nums'>
                                          {formatCost(cost.output || 0)}
                                        </span>
                                      </div>
                                      <div className='flex justify-between border-border/20 border-t pt-1'>
                                        <span className='text-muted-foreground'>Total</span>
                                        <span className='font-medium text-foreground tabular-nums'>
                                          {formatCost(cost.total || 0)}
                                        </span>
                                      </div>
                                      <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Tokens</span>
                                        <span className='font-mono text-muted-foreground tabular-nums'>
                                          {cost.tokens?.prompt || 0} in /{' '}
                                          {cost.tokens?.completion || 0} out
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    {isWorkflowWithCost && (
                      <div className='border-border/30 border-t bg-muted/20 px-4 py-2.5 text-[11px] text-muted-foreground'>
                        Includes base execution fee of{' '}
                        <span className='font-medium'>{formatCost(BASE_EXECUTION_CHARGE)}</span>{' '}
                        plus model usage costs.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}
