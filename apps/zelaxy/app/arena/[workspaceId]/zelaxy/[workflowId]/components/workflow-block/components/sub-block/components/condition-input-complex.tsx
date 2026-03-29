import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CircleDot,
  CornerDownRight,
  GitBranch,
  HelpCircle,
  Plus,
  Trash,
} from 'lucide-react'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'

import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react'
import Editor from 'react-simple-code-editor'
import { Button } from '@/components/ui/button'
import { checkEnvVarTrigger, EnvVarDropdown } from '@/components/ui/env-var-dropdown'
import { checkTagTrigger, TagDropdown } from '@/components/ui/tag-dropdown'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { useSubBlockValue } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'
import { useTagSelection } from '@/hooks/use-tag-selection'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

const logger = createLogger('ConditionInput')

interface ConditionalBlock {
  id: string
  title: string
  value: string
  showTags: boolean
  showEnvVars: boolean
  searchTerm: string
  cursorPosition: number
  activeSourceBlockId: string | null
}

interface ConditionInputProps {
  blockId: string
  subBlockId: string
  isConnecting: boolean
  isPreview?: boolean
  previewValue?: string | null
  disabled?: boolean
}

// Generate a stable ID based on the blockId and a suffix
const generateStableId = (blockId: string, suffix: string): string => {
  return `${blockId}-${suffix}`
}

export function ConditionInput({
  blockId,
  subBlockId,
  isConnecting,
  isPreview = false,
  previewValue,
  disabled = false,
}: ConditionInputProps) {
  const [storeValue, setStoreValue] = useSubBlockValue(blockId, subBlockId)

  const emitTagSelection = useTagSelection(blockId, subBlockId)

  const containerRef = useRef<HTMLDivElement>(null)
  const [visualLineHeights, setVisualLineHeights] = useState<{
    [key: string]: number[]
  }>({})
  const updateNodeInternals = useUpdateNodeInternals()
  const removeEdge = useWorkflowStore((state) => state.removeEdge)
  const edges = useWorkflowStore((state) => state.edges)

  // Use a ref to track the previous store value for comparison
  const prevStoreValueRef = useRef<string | null>(null)
  // Use a ref to track if we're currently syncing from store to prevent loops
  const isSyncingFromStoreRef = useRef(false)
  // Use a ref to track if we've already initialized from store
  const hasInitializedRef = useRef(false)
  // Track previous blockId to detect workflow changes
  const previousBlockIdRef = useRef<string>(blockId)

  // Create default blocks with stable IDs
  const createDefaultBlocks = (): ConditionalBlock[] => [
    {
      id: generateStableId(blockId, 'if'),
      title: 'if',
      value: '',
      showTags: false,
      showEnvVars: false,
      searchTerm: '',
      cursorPosition: 0,
      activeSourceBlockId: null,
    },
    {
      id: generateStableId(blockId, 'else'),
      title: 'else',
      value: '',
      showTags: false,
      showEnvVars: false,
      searchTerm: '',
      cursorPosition: 0,
      activeSourceBlockId: null,
    },
  ]

  // Initialize with a loading state instead of default blocks
  const [conditionalBlocks, setConditionalBlocks] = useState<ConditionalBlock[]>([])
  const [isReady, setIsReady] = useState(false)

  // Reset initialization state when blockId changes (workflow navigation)
  useEffect(() => {
    if (blockId !== previousBlockIdRef.current) {
      // Reset refs and state for new workflow/block
      hasInitializedRef.current = false
      isSyncingFromStoreRef.current = false
      prevStoreValueRef.current = null
      previousBlockIdRef.current = blockId
      setIsReady(false)
      setConditionalBlocks([])
    }
  }, [blockId])

  // Safely parse JSON with fallback
  const safeParseJSON = (jsonString: string | null): ConditionalBlock[] | null => {
    if (!jsonString) return null
    try {
      const parsed = JSON.parse(jsonString)
      if (!Array.isArray(parsed)) return null

      // Validate that the parsed data has the expected structure
      if (parsed.length === 0 || !('id' in parsed[0]) || !('title' in parsed[0])) {
        return null
      }

      return parsed
    } catch (error) {
      logger.error('Failed to parse JSON:', { error, jsonString })
      return null
    }
  }

  // Sync store value with conditional blocks when storeValue changes
  useEffect(() => {
    // Skip if syncing is already in progress
    if (isSyncingFromStoreRef.current) return

    // Use preview value when in preview mode, otherwise use store value
    const effectiveValue = isPreview ? previewValue : storeValue
    // Convert effectiveValue to string if it's not null
    const effectiveValueStr = effectiveValue !== null ? effectiveValue?.toString() : null

    // Set that we're syncing from store to prevent loops
    isSyncingFromStoreRef.current = true

    try {
      // If effective value is null, and we've already initialized, keep current state
      if (effectiveValueStr === null) {
        if (hasInitializedRef.current) {
          // We already have blocks, just mark as ready if not already
          if (!isReady) setIsReady(true)
          isSyncingFromStoreRef.current = false
          return
        }

        // If we haven't initialized yet, set default blocks
        setConditionalBlocks(createDefaultBlocks())
        hasInitializedRef.current = true
        setIsReady(true)
        isSyncingFromStoreRef.current = false
        return
      }

      // Skip if the effective value hasn't changed and we're already initialized
      if (effectiveValueStr === prevStoreValueRef.current && hasInitializedRef.current) {
        if (!isReady) setIsReady(true)
        isSyncingFromStoreRef.current = false
        return
      }

      // Update the previous store value ref
      prevStoreValueRef.current = effectiveValueStr

      // Parse the effective value
      const parsedBlocks = safeParseJSON(effectiveValueStr)

      if (parsedBlocks) {
        // Use the parsed blocks, but ensure titles are correct based on position
        const blocksWithCorrectTitles = parsedBlocks.map((block, index) => ({
          ...block,
          title: index === 0 ? 'if' : index === parsedBlocks.length - 1 ? 'else' : 'else if',
        }))

        setConditionalBlocks(blocksWithCorrectTitles)
        hasInitializedRef.current = true
        if (!isReady) setIsReady(true)
      } else if (!hasInitializedRef.current) {
        // Only set default blocks if we haven't initialized yet
        setConditionalBlocks(createDefaultBlocks())
        hasInitializedRef.current = true
        setIsReady(true)
      }
    } finally {
      // Reset the syncing flag after a short delay
      setTimeout(() => {
        isSyncingFromStoreRef.current = false
      }, 0)
    }
  }, [storeValue, previewValue, isPreview, blockId, isReady])

  // Update store whenever conditional blocks change
  useEffect(() => {
    // Skip if we're currently syncing from store to prevent loops
    // or if we're not ready yet (still initializing) or in preview mode
    if (isSyncingFromStoreRef.current || !isReady || conditionalBlocks.length === 0 || isPreview)
      return

    const newValue = JSON.stringify(conditionalBlocks)

    // Only update if the value has actually changed
    if (newValue !== prevStoreValueRef.current) {
      prevStoreValueRef.current = newValue
      setStoreValue(newValue)
      updateNodeInternals(`${blockId}-${subBlockId}`)
    }
  }, [
    conditionalBlocks,
    blockId,
    subBlockId,
    setStoreValue,
    updateNodeInternals,
    isReady,
    isPreview,
  ])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      hasInitializedRef.current = false
      prevStoreValueRef.current = null
      isSyncingFromStoreRef.current = false
    }
  }, [])

  // Update the line counting logic to be block-specific
  useEffect(() => {
    if (!containerRef.current || conditionalBlocks.length === 0) return

    const calculateVisualLines = () => {
      const preElement = containerRef.current?.querySelector('pre')
      if (!preElement) return

      const newVisualLineHeights: { [key: string]: number[] } = {}

      conditionalBlocks.forEach((block) => {
        const lines = block.value.split('\n')
        const blockVisualHeights: number[] = []

        // Create a hidden container with the same width as the editor
        const container = document.createElement('div')
        container.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: ${preElement.clientWidth}px;
          font-family: ${window.getComputedStyle(preElement).fontFamily};
          font-size: ${window.getComputedStyle(preElement).fontSize};
          padding: 12px;
          white-space: pre-wrap;
          word-break: break-word;
        `
        document.body.appendChild(container)

        // Process each line
        lines.forEach((line) => {
          const lineDiv = document.createElement('div')

          if (line.includes('<') && line.includes('>')) {
            const parts = line.split(/(<[^>]+>)/g)
            parts.forEach((part) => {
              const span = document.createElement('span')
              span.textContent = part
              if (part.startsWith('<') && part.endsWith('>')) {
                span.style.color = 'rgb(153, 0, 85)'
              }
              lineDiv.appendChild(span)
            })
          } else {
            lineDiv.textContent = line || ' '
          }

          container.appendChild(lineDiv)

          const actualHeight = lineDiv.getBoundingClientRect().height
          const lineUnits = Math.ceil(actualHeight / 21)
          blockVisualHeights.push(lineUnits)

          container.removeChild(lineDiv)
        })

        document.body.removeChild(container)
        newVisualLineHeights[block.id] = blockVisualHeights
      })

      setVisualLineHeights(newVisualLineHeights)
    }

    calculateVisualLines()

    const resizeObserver = new ResizeObserver(calculateVisualLines)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [conditionalBlocks])

  // Modify the line numbers rendering to be block-specific
  const renderLineNumbers = (blockId: string) => {
    const numbers: ReactElement[] = []
    let lineNumber = 1
    const blockHeights = visualLineHeights[blockId] || []

    blockHeights.forEach((height) => {
      for (let i = 0; i < height; i++) {
        numbers.push(
          <div
            key={`${blockId}-${lineNumber}-${i}`}
            className={cn('text-muted-foreground text-xs leading-[21px]', i > 0 && 'invisible')}
          >
            {lineNumber}
          </div>
        )
      }
      lineNumber++
    })

    return numbers
  }

  // Handle drops from connection blocks - updated for individual blocks
  const handleDrop = (blockId: string, e: React.DragEvent) => {
    if (isPreview || disabled) return
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type !== 'connectionBlock') return

      const textarea: any = containerRef.current?.querySelector(
        `[data-block-id="${blockId}"] textarea`
      )
      const dropPosition = textarea?.selectionStart ?? 0

      setConditionalBlocks((blocks) =>
        blocks.map((block) => {
          if (block.id === blockId) {
            const newValue = `${block.value.slice(0, dropPosition)}{{${block.value.slice(dropPosition)}`
            return {
              ...block,
              value: newValue,
              showTags: true,
              cursorPosition: dropPosition + 2,
              activeSourceBlockId: data.connectionData?.sourceBlockId || null,
            }
          }
          return block
        })
      )
      // Set cursor position after state updates
      setTimeout(() => {
        if (textarea) {
          textarea.selectionStart = dropPosition + 2
          textarea.selectionEnd = dropPosition + 2
          textarea.focus()
        }
      }, 0)
    } catch (error) {
      logger.error('Failed to parse drop data:', { error })
    }
  }

  // Handle tag selection - updated for individual blocks
  const handleTagSelect = (blockId: string, newValue: string) => {
    if (isPreview || disabled) return
    setConditionalBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              value: newValue,
              showTags: false,
              activeSourceBlockId: null,
            }
          : block
      )
    )
  }

  // Handle environment variable selection - updated for individual blocks
  const handleEnvVarSelect = (blockId: string, newValue: string) => {
    if (isPreview || disabled) return
    setConditionalBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              value: newValue,
              showEnvVars: false,
              searchTerm: '',
            }
          : block
      )
    )
  }

  const handleTagSelectImmediate = (blockId: string, newValue: string) => {
    if (isPreview || disabled) return

    setConditionalBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              value: newValue,
              showTags: false,
              activeSourceBlockId: null,
            }
          : block
      )
    )

    const updatedBlocks = conditionalBlocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            value: newValue,
            showTags: false,
            activeSourceBlockId: null,
          }
        : block
    )
    emitTagSelection(JSON.stringify(updatedBlocks))
  }

  const handleEnvVarSelectImmediate = (blockId: string, newValue: string) => {
    if (isPreview || disabled) return

    setConditionalBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              value: newValue,
              showEnvVars: false,
              searchTerm: '',
            }
          : block
      )
    )

    const updatedBlocks = conditionalBlocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            value: newValue,
            showEnvVars: false,
            searchTerm: '',
          }
        : block
    )
    emitTagSelection(JSON.stringify(updatedBlocks))
  }

  // Update block titles based on position
  const updateBlockTitles = (blocks: ConditionalBlock[]): ConditionalBlock[] => {
    return blocks.map((block, index) => ({
      ...block,
      title: index === 0 ? 'if' : index === blocks.length - 1 ? 'else' : 'else if',
    }))
  }

  // Update these functions to use updateBlockTitles and stable IDs
  const addBlock = (afterId: string) => {
    if (isPreview || disabled) return

    const blockIndex = conditionalBlocks.findIndex((block) => block.id === afterId)

    // Generate a stable ID using the blockId and a timestamp
    const newBlockId = generateStableId(blockId, `else-if-${Date.now()}`)

    const newBlock: ConditionalBlock = {
      id: newBlockId,
      title: '', // Will be set by updateBlockTitles
      value: '',
      showTags: false,
      showEnvVars: false,
      searchTerm: '',
      cursorPosition: 0,
      activeSourceBlockId: null,
    }

    const newBlocks = [...conditionalBlocks]
    newBlocks.splice(blockIndex + 1, 0, newBlock)
    setConditionalBlocks(updateBlockTitles(newBlocks))

    // Focus the new block's editor after a short delay
    setTimeout(() => {
      const textarea: any = containerRef.current?.querySelector(
        `[data-block-id="${newBlock.id}"] textarea`
      )
      if (textarea) {
        textarea.focus()
      }
    }, 0)
  }

  const removeBlock = (id: string) => {
    if (isPreview || disabled) return

    // Must always have at least 2 blocks: if + else
    if (conditionalBlocks.length <= 2) return

    // Remove any associated edges before removing the block
    edges.forEach((edge) => {
      if (edge.sourceHandle?.startsWith(`condition-${id}`)) {
        removeEdge(edge.id)
      }
    })

    setConditionalBlocks((blocks) => updateBlockTitles(blocks.filter((block) => block.id !== id)))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    if (isPreview || disabled) return

    const blockIndex = conditionalBlocks.findIndex((block) => block.id === id)
    if (
      (direction === 'up' && blockIndex === 0) ||
      (direction === 'down' && blockIndex === conditionalBlocks.length - 1)
    )
      return

    const newBlocks = [...conditionalBlocks]
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1
    ;[newBlocks[blockIndex], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[blockIndex],
    ]
    setConditionalBlocks(updateBlockTitles(newBlocks))
  }

  // Add useEffect to handle keyboard events for both dropdowns
  useEffect(() => {
    conditionalBlocks.forEach((block) => {
      const textarea = containerRef.current?.querySelector(`[data-block-id="${block.id}"] textarea`)
      if (textarea) {
        textarea.addEventListener('keydown', (e: Event) => {
          if ((e as KeyboardEvent).key === 'Escape') {
            setConditionalBlocks((blocks) =>
              blocks.map((b) =>
                b.id === block.id
                  ? {
                      ...b,
                      showTags: false,
                      showEnvVars: false,
                      searchTerm: '',
                    }
                  : b
              )
            )
          }
        })
      }
    })
  }, [conditionalBlocks.length])

  // Get the style config for each block type
  const getBlockStyle = (title: string) => {
    switch (title.toLowerCase()) {
      case 'if':
        return {
          icon: GitBranch,
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          label: 'IF',
          description: 'First condition to check',
        }
      case 'else if':
        return {
          icon: CornerDownRight,
          bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
          borderColor: 'border-amber-500/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          label: 'ELSE IF',
          description: 'Alternative condition',
        }
      case 'else':
        return {
          icon: CircleDot,
          bgColor: 'bg-slate-500/10 dark:bg-slate-500/20',
          borderColor: 'border-slate-500/30',
          iconColor: 'text-slate-600 dark:text-slate-400',
          label: 'ELSE',
          description: 'Default fallback path',
        }
      default:
        return {
          icon: GitBranch,
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          iconColor: 'text-gray-600',
          label: title.toUpperCase(),
          description: '',
        }
    }
  }

  // Show loading or empty state if not ready or no blocks
  if (!isReady || conditionalBlocks.length === 0) {
    return (
      <div className='flex min-h-[150px] items-center justify-center text-muted-foreground'>
        <div className='flex flex-col items-center gap-2'>
          <GitBranch className='h-8 w-8 animate-pulse' />
          <span>Loading conditions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-3' ref={containerRef}>
      {/* Quick Help */}
      <div className='flex items-center justify-between rounded-lg border border-muted-foreground/30 border-dashed bg-muted/30 px-3 py-2'>
        <div className='flex items-center gap-2 text-muted-foreground text-xs'>
          <HelpCircle className='h-3.5 w-3.5' />
          <span>
            Use <code className='rounded bg-muted px-1'>{'{{block.property}}'}</code> for variables
            | <code className='rounded bg-muted px-1'>==</code>{' '}
            <code className='rounded bg-muted px-1'>!=</code>{' '}
            <code className='rounded bg-muted px-1'>{'>'}</code>{' '}
            <code className='rounded bg-muted px-1'>{'<'}</code>{' '}
            <code className='rounded bg-muted px-1'>&&</code>{' '}
            <code className='rounded bg-muted px-1'>||</code>
          </span>
        </div>
      </div>

      {conditionalBlocks.map((block, index) => {
        const style = getBlockStyle(block.title)
        const IconComponent = style.icon

        return (
          <div
            key={block.id}
            className={cn(
              'group relative overflow-visible rounded-lg border-2 bg-background transition-all duration-200',
              style.borderColor,
              'hover:shadow-md'
            )}
          >
            {/* Header */}
            <div
              className={cn(
                'flex h-11 items-center justify-between overflow-hidden px-3',
                block.title === 'else' ? 'rounded-lg' : 'rounded-t-lg border-b',
                style.bgColor
              )}
            >
              <div className='flex items-center gap-2'>
                <IconComponent className={cn('h-4 w-4', style.iconColor)} />
                <span className={cn('font-semibold text-sm', style.iconColor)}>{style.label}</span>
                {style.description && (
                  <span className='text-muted-foreground text-xs'>— {style.description}</span>
                )}
              </div>

              {/* Connection Handle */}
              <Handle
                type='source'
                position={Position.Right}
                id={`condition-${block.id}`}
                key={`${block.id}-${index}`}
                className={cn(
                  '!w-3 !h-6',
                  block.title === 'if' && '!bg-emerald-500',
                  block.title === 'else if' && '!bg-amber-500',
                  block.title === 'else' && '!bg-slate-500',
                  '!rounded-[3px] !border-2 !border-white dark:!border-gray-800',
                  '!z-[30]',
                  'group-hover:!shadow-[0_0_0_3px_rgba(156,163,175,0.25)]',
                  'hover:!w-4 hover:!right-[-30px]',
                  '!cursor-crosshair',
                  'transition-all duration-150',
                  '!right-[-27px]'
                )}
                data-nodeid={`${blockId}-${subBlockId}`}
                data-handleid={`condition-${block.id}`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                isConnectableStart={true}
                isConnectableEnd={false}
                isValidConnection={(connection) => {
                  if (connection.source === connection.target) return false
                  const sourceNodeId = connection.source?.split('-')[0]
                  const targetNodeId = connection.target?.split('-')[0]
                  return sourceNodeId !== targetNodeId
                }}
              />

              {/* Action Buttons */}
              <div className='flex items-center gap-0.5'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => addBlock(block.id)}
                      disabled={isPreview || disabled}
                      className='h-7 w-7 opacity-60 hover:opacity-100'
                    >
                      <Plus className='h-3.5 w-3.5' />
                      <span className='sr-only'>Add Else If</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>Add Else If Branch</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={isPreview || index === 0 || disabled}
                      className='h-7 w-7 opacity-60 hover:opacity-100'
                    >
                      <ChevronUp className='h-3.5 w-3.5' />
                      <span className='sr-only'>Move Up</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>Move Up</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={isPreview || index === conditionalBlocks.length - 1 || disabled}
                      className='h-7 w-7 opacity-60 hover:opacity-100'
                    >
                      <ChevronDown className='h-3.5 w-3.5' />
                      <span className='sr-only'>Move Down</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>Move Down</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeBlock(block.id)}
                      disabled={isPreview || conditionalBlocks.length <= 2 || disabled}
                      className='h-7 w-7 text-destructive/70 opacity-60 hover:text-destructive hover:opacity-100'
                    >
                      <Trash className='h-3.5 w-3.5' />
                      <span className='sr-only'>Delete</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>Remove Condition</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Editor Area - only show for if/else if, not else */}
            {block.title !== 'else' && (
              <div
                className={cn(
                  'relative min-h-[80px] rounded-b-lg bg-background font-mono text-sm',
                  isConnecting && 'ring-2 ring-primary ring-offset-2'
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(block.id, e)}
              >
                {/* Line numbers */}
                <div
                  className='absolute top-0 bottom-0 left-0 flex w-[30px] select-none flex-col items-end bg-muted/30 pt-3 pr-3'
                  aria-hidden='true'
                >
                  {renderLineNumbers(block.id)}
                </div>

                <div className='relative mt-0 pt-0 pl-[30px]' data-block-id={block.id}>
                  {block.value.length === 0 && (
                    <div className='pointer-events-none absolute top-[12px] left-[42px] select-none text-muted-foreground/40 text-xs'>
                      {block.title === 'if'
                        ? 'Enter condition: {{agent.content}} === "yes" && {{score}} > 0.8'
                        : 'Enter alternative condition...'}
                    </div>
                  )}
                  <Editor
                    value={block.value}
                    onValueChange={(newCode) => {
                      if (!isPreview && !disabled) {
                        const textarea = containerRef.current?.querySelector(
                          `[data-block-id="${block.id}"] textarea`
                        ) as HTMLTextAreaElement | null
                        if (textarea) {
                          const pos = textarea.selectionStart ?? 0

                          const tagTrigger = checkTagTrigger(newCode, pos)
                          const envVarTrigger = checkEnvVarTrigger(newCode, pos)

                          setConditionalBlocks((blocks) =>
                            blocks.map((b) => {
                              if (b.id === block.id) {
                                return {
                                  ...b,
                                  value: newCode,
                                  showTags: tagTrigger.show,
                                  showEnvVars: envVarTrigger.show,
                                  searchTerm: envVarTrigger.show ? envVarTrigger.searchTerm : '',
                                  cursorPosition: pos,
                                  activeSourceBlockId: tagTrigger.show
                                    ? b.activeSourceBlockId
                                    : null,
                                }
                              }
                              return b
                            })
                          )
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setConditionalBlocks((blocks) =>
                          blocks.map((b) =>
                            b.id === block.id ? { ...b, showTags: false, showEnvVars: false } : b
                          )
                        )
                      }
                    }}
                    highlight={(code) => highlight(code, languages.javascript, 'javascript')}
                    padding={12}
                    style={{
                      fontFamily: 'inherit',
                      minHeight: '46px',
                      lineHeight: '21px',
                    }}
                    className={cn(
                      'focus:outline-none',
                      isPreview && 'cursor-not-allowed opacity-50'
                    )}
                    textareaClassName={cn(
                      'focus:outline-none focus:ring-0 bg-transparent',
                      isPreview && 'pointer-events-none'
                    )}
                  />

                  {block.showEnvVars && (
                    <EnvVarDropdown
                      visible={block.showEnvVars}
                      onSelect={(newValue) => handleEnvVarSelectImmediate(block.id, newValue)}
                      searchTerm={block.searchTerm}
                      inputValue={block.value}
                      cursorPosition={block.cursorPosition}
                      onClose={() => {
                        setConditionalBlocks((blocks) =>
                          blocks.map((b) =>
                            b.id === block.id ? { ...b, showEnvVars: false, searchTerm: '' } : b
                          )
                        )
                      }}
                    />
                  )}

                  {block.showTags && (
                    <TagDropdown
                      visible={block.showTags}
                      onSelect={(newValue) => handleTagSelectImmediate(block.id, newValue)}
                      blockId={blockId}
                      activeSourceBlockId={block.activeSourceBlockId}
                      inputValue={block.value}
                      cursorPosition={block.cursorPosition}
                      onClose={() => {
                        setConditionalBlocks((blocks) =>
                          blocks.map((b) =>
                            b.id === block.id
                              ? {
                                  ...b,
                                  showTags: false,
                                  activeSourceBlockId: null,
                                }
                              : b
                          )
                        )
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
