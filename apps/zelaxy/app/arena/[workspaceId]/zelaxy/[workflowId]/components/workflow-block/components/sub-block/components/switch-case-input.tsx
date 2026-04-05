import { useEffect, useRef, useState } from 'react'
import { useUpdateNodeInternals } from '@xyflow/react'
import { GitBranch, Plus, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDisplayText } from '@/components/ui/formatted-text'
import { checkTagTrigger, TagDropdown } from '@/components/ui/tag-dropdown'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { useSubBlockValue } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'
import { useTagSelection } from '@/hooks/use-tag-selection'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

const logger = createLogger('SwitchCaseInput')

interface SwitchCaseBlock {
  id: string
  title: string
  value: string
}

interface SwitchCaseInputProps {
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

export function SwitchCaseInput({
  blockId,
  subBlockId,
  isConnecting,
  isPreview = false,
  previewValue,
  disabled = false,
}: SwitchCaseInputProps) {
  const [storeValue, setStoreValue] = useSubBlockValue(blockId, subBlockId)
  const containerRef = useRef<HTMLDivElement>(null)
  const updateNodeInternals = useUpdateNodeInternals()
  const removeEdge = useWorkflowStore((state) => state.removeEdge)
  const edges = useWorkflowStore((state) => state.edges)

  // Tag dropdown state for {{}} variable references
  const [showTags, setShowTags] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [activeSourceBlockId, setActiveSourceBlockId] = useState<string | null>(null)
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null)
  const caseInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const emitTagSelection = useTagSelection(blockId, subBlockId)

  const prevStoreValueRef = useRef<string | null>(null)
  const isSyncingFromStoreRef = useRef(false)
  const hasInitializedRef = useRef(false)
  const previousBlockIdRef = useRef<string>(blockId)

  const createDefaultCases = (): SwitchCaseBlock[] => [
    {
      id: generateStableId(blockId, 'case1'),
      title: 'Case 1',
      value: '',
    },
    {
      id: generateStableId(blockId, 'default'),
      title: 'default',
      value: '',
    },
  ]

  const [cases, setCases] = useState<SwitchCaseBlock[]>([])
  const [isReady, setIsReady] = useState(false)

  // Reset when blockId changes
  useEffect(() => {
    if (blockId !== previousBlockIdRef.current) {
      hasInitializedRef.current = false
      isSyncingFromStoreRef.current = false
      prevStoreValueRef.current = null
      previousBlockIdRef.current = blockId
      setIsReady(false)
      setCases([])
    }
  }, [blockId])

  const safeParseJSON = (jsonString: string | null): SwitchCaseBlock[] | null => {
    if (!jsonString) return null
    try {
      const parsed = JSON.parse(jsonString)
      if (!Array.isArray(parsed)) return null
      if (parsed.length === 0 || !('id' in parsed[0]) || !('title' in parsed[0])) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  // Sync store → local state
  useEffect(() => {
    if (isSyncingFromStoreRef.current) return

    const effectiveValue = isPreview ? previewValue : storeValue
    const effectiveValueStr = effectiveValue !== null ? effectiveValue?.toString() : null

    isSyncingFromStoreRef.current = true
    try {
      if (effectiveValueStr === null) {
        if (hasInitializedRef.current) {
          if (!isReady) setIsReady(true)
          isSyncingFromStoreRef.current = false
          return
        }
        setCases(createDefaultCases())
        hasInitializedRef.current = true
        setIsReady(true)
        isSyncingFromStoreRef.current = false
        return
      }

      if (effectiveValueStr === prevStoreValueRef.current && hasInitializedRef.current) {
        if (!isReady) setIsReady(true)
        isSyncingFromStoreRef.current = false
        return
      }

      prevStoreValueRef.current = effectiveValueStr
      const parsedCases = safeParseJSON(effectiveValueStr)

      if (parsedCases) {
        setCases(parsedCases)
        hasInitializedRef.current = true
        if (!isReady) setIsReady(true)
      } else if (!hasInitializedRef.current) {
        setCases(createDefaultCases())
        hasInitializedRef.current = true
        setIsReady(true)
      }
    } finally {
      setTimeout(() => {
        isSyncingFromStoreRef.current = false
      }, 0)
    }
  }, [storeValue, previewValue, isPreview, blockId, isReady])

  // Local state → store
  useEffect(() => {
    if (isSyncingFromStoreRef.current || !isReady || cases.length === 0 || isPreview) return

    const newValue = JSON.stringify(cases)
    if (newValue !== prevStoreValueRef.current) {
      prevStoreValueRef.current = newValue
      setStoreValue(newValue)
      updateNodeInternals(blockId)
    }
  }, [cases, blockId, subBlockId, setStoreValue, updateNodeInternals, isReady, isPreview])

  // Cleanup
  useEffect(() => {
    return () => {
      hasInitializedRef.current = false
      prevStoreValueRef.current = null
      isSyncingFromStoreRef.current = false
    }
  }, [])

  // Add a new case before default
  const addCase = () => {
    if (isPreview || disabled) return
    setCases((prev) => {
      const nonDefault = prev.filter((c) => c.title.toLowerCase() !== 'default')
      const defaultCase = prev.find((c) => c.title.toLowerCase() === 'default')
      const newIndex = nonDefault.length + 1
      const newCase: SwitchCaseBlock = {
        id: generateStableId(blockId, `case${Date.now()}`),
        title: `Case ${newIndex}`,
        value: '',
      }
      return [...nonDefault, newCase, ...(defaultCase ? [defaultCase] : [])]
    })
  }

  // Remove a case
  const removeCase = (id: string) => {
    if (isPreview || disabled) return

    // Remove edges connected to this case handle
    const edgesToRemove = edges.filter(
      (edge) => edge.source === blockId && edge.sourceHandle === `case-${id}`
    )
    for (const edge of edgesToRemove) {
      removeEdge(edge.id)
    }

    setCases((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      // Re-title non-default cases
      let caseNum = 1
      return updated.map((c) => {
        if (c.title.toLowerCase() === 'default') return c
        return { ...c, title: `Case ${caseNum++}` }
      })
    })
  }

  // Update case value with tag trigger detection
  const updateCaseValue = (id: string, newValue: string) => {
    if (isPreview || disabled) return

    // Track cursor position for tag dropdown
    const inputEl = caseInputRefs.current[id]
    const cursorPos = inputEl?.selectionStart ?? newValue.length
    setCursorPosition(cursorPos)
    setActiveCaseId(id)

    // Check for {{ tag trigger
    const tagTrigger = checkTagTrigger(newValue, cursorPos)
    setShowTags(tagTrigger.show)

    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, value: newValue } : c)))
  }

  // Handle tag selection from dropdown — inserts the full resolved value
  const handleTagSelect = (newValue: string) => {
    if (!activeCaseId) return
    setCases((prev) => prev.map((c) => (c.id === activeCaseId ? { ...c, value: newValue } : c)))
    setShowTags(false)
    setActiveSourceBlockId(null)
  }

  if (!isReady || cases.length === 0) {
    return <div className='p-2 text-muted-foreground text-xs'>Loading...</div>
  }

  const getCaseStyle = (c: SwitchCaseBlock) => {
    if (c.title.toLowerCase() === 'default') {
      return {
        label: 'default',
        iconColor: 'text-slate-500',
        handleColor: '!bg-slate-500',
        borderColor: 'border-slate-200 dark:border-slate-700',
        bgColor: 'bg-slate-50/50 dark:bg-slate-900/30',
      }
    }
    return {
      label: c.title,
      iconColor: 'text-violet-500',
      handleColor: '!bg-violet-500',
      borderColor: 'border-violet-200 dark:border-violet-700',
      bgColor: 'bg-violet-50/50 dark:bg-violet-900/30',
    }
  }

  return (
    <div ref={containerRef} className='relative flex flex-col gap-1.5'>
      {cases.map((c, index) => {
        const style = getCaseStyle(c)
        const isDefault = c.title.toLowerCase() === 'default'
        const canRemove =
          !isDefault && cases.filter((x) => x.title.toLowerCase() !== 'default').length > 1

        return (
          <div
            key={c.id}
            className={cn(
              'relative rounded-lg border p-2',
              style.borderColor,
              style.bgColor,
              'transition-colors duration-150'
            )}
          >
            {/* Header */}
            <div className='mb-1.5 flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <GitBranch className={cn('h-3.5 w-3.5', style.iconColor)} />
                <span className={cn('font-semibold text-xs', style.iconColor)}>{style.label}</span>
              </div>

              <div className='flex items-center gap-0.5'>
                {!isDefault && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={addCase}
                        disabled={isPreview || disabled}
                        className='h-5 w-5 p-0 text-muted-foreground hover:text-foreground'
                      >
                        <Plus className='h-3 w-3' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add case</TooltipContent>
                  </Tooltip>
                )}
                {canRemove && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => removeCase(c.id)}
                        disabled={isPreview || disabled}
                        className='h-5 w-5 p-0 text-muted-foreground hover:text-destructive'
                      >
                        <Trash className='h-3 w-3' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove case</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Value input with {{}} variable reference support */}
            {!isDefault && (
              <div className='relative'>
                <input
                  ref={(el) => {
                    caseInputRefs.current[c.id] = el
                  }}
                  type='text'
                  value={c.value}
                  onChange={(e) => updateCaseValue(c.id, e.target.value)}
                  onFocus={() => {
                    setActiveCaseId(c.id)
                    setShowTags(false)
                  }}
                  onBlur={() => {
                    // Delay to allow tag dropdown click
                    setTimeout(() => setShowTags(false), 200)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowTags(false)
                  }}
                  placeholder='Match value... (use {{ for variables)'
                  disabled={isPreview || disabled}
                  className={cn(
                    'w-full rounded-md border bg-background px-2 py-1 font-mono text-transparent text-xs caret-foreground',
                    'focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500',
                    'placeholder:text-muted-foreground/50'
                  )}
                />
                {/* Formatted overlay showing {{}} tags as colored badges */}
                <div className='pointer-events-none absolute inset-0 flex items-center overflow-hidden px-2 py-1 font-mono text-xs'>
                  <div className='w-full truncate whitespace-pre'>
                    {formatDisplayText(c.value, true)}
                  </div>
                </div>
                {/* Tag dropdown for this case input */}
                {activeCaseId === c.id && (
                  <TagDropdown
                    visible={showTags}
                    onSelect={handleTagSelect}
                    blockId={blockId}
                    activeSourceBlockId={activeSourceBlockId}
                    inputValue={c.value}
                    cursorPosition={cursorPosition}
                    onClose={() => {
                      setShowTags(false)
                      setActiveSourceBlockId(null)
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add Case button at bottom */}
      <Button
        variant='ghost'
        size='sm'
        onClick={addCase}
        disabled={isPreview || disabled}
        className='h-7 w-full border border-dashed text-muted-foreground text-xs hover:text-foreground'
      >
        <Plus className='mr-1 h-3 w-3' />
        Add Case
      </Button>
    </div>
  )
}
