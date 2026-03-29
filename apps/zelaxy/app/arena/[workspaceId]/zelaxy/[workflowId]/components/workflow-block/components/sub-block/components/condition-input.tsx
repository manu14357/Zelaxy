import { useEffect, useRef, useState } from 'react'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'

import { checkEnvVarTrigger, EnvVarDropdown } from '@/components/ui/env-var-dropdown'
import { formatDisplayText } from '@/components/ui/formatted-text'
import { checkTagTrigger, TagDropdown } from '@/components/ui/tag-dropdown'
import { Textarea } from '@/components/ui/textarea'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { useSubBlockValue } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'
import { useTagSelection } from '@/hooks/use-tag-selection'

const logger = createLogger('ConditionInput')

interface ConditionInputProps {
  blockId: string
  subBlockId: string
  isConnecting: boolean
  isPreview?: boolean
  previewValue?: string | null
  disabled?: boolean
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showTags, setShowTags] = useState(false)
  const [showEnvVars, setShowEnvVars] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [activeSourceBlockId, setActiveSourceBlockId] = useState<string | null>(null)

  // Use preview value when in preview mode, otherwise use store value
  const effectiveValue = isPreview ? previewValue || '' : storeValue || ''
  const conditionValue = typeof effectiveValue === 'string' ? effectiveValue : ''

  // Handle drops from connection blocks
  const handleDrop = (e: React.DragEvent) => {
    if (isPreview || disabled) return
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type !== 'connectionBlock') return

      const dropPosition = textareaRef.current?.selectionStart ?? conditionValue.length

      const newValue = `${conditionValue.slice(0, dropPosition)}{{${conditionValue.slice(dropPosition)}`

      // Update all state in a single batch
      Promise.resolve().then(() => {
        setStoreValue(newValue)
        setCursorPosition(dropPosition + 2)
        setShowTags(true)
        setActiveSourceBlockId(data.connectionData?.sourceBlockId || null)

        // Set cursor position after state updates
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = dropPosition + 2
            textareaRef.current.selectionEnd = dropPosition + 2
            textareaRef.current.focus()
          }
        }, 0)
      })
    } catch (error) {
      logger.error('Failed to parse drop data:', { error })
    }
  }

  // Handle tag selection
  const handleTagSelect = (newValue: string) => {
    if (isPreview || disabled) return
    setStoreValue(newValue)
    setShowTags(false)
    setActiveSourceBlockId(null)
    emitTagSelection(newValue)

    // Ensure cursor position is maintained after tag insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        // Set cursor to end of inserted variable
        const variableMatch = newValue.match(/\{\{[^}]+\}\}$/)
        if (variableMatch) {
          const cursorPos = newValue.length
          textareaRef.current.selectionStart = cursorPos
          textareaRef.current.selectionEnd = cursorPos
        }
      }
    }, 0)
  }

  // Handle environment variable selection
  const handleEnvVarSelect = (newValue: string) => {
    if (isPreview || disabled) return
    setStoreValue(newValue)
    setShowEnvVars(false)
    setSearchTerm('')
    emitTagSelection(newValue)

    // Ensure cursor position is maintained after env var insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        // Set cursor to end of inserted variable
        const cursorPos = newValue.length
        textareaRef.current.selectionStart = cursorPos
        textareaRef.current.selectionEnd = cursorPos
      }
    }, 0)
  }

  // Handle value changes
  const handleValueChange = (newValue: string) => {
    if (isPreview || disabled) return

    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart ?? 0

      const tagTrigger = checkTagTrigger(newValue, pos)
      const envVarTrigger = checkEnvVarTrigger(newValue, pos)

      setStoreValue(newValue)
      setShowTags(tagTrigger.show)
      setShowEnvVars(envVarTrigger.show)
      setSearchTerm(envVarTrigger.show ? envVarTrigger.searchTerm : '')
      setCursorPosition(pos)

      if (tagTrigger.show) {
        setActiveSourceBlockId(activeSourceBlockId)
      } else {
        setActiveSourceBlockId(null)
      }
    }
  }

  // Handle keyboard events
  useEffect(() => {
    if (textareaRef.current) {
      const handleKeyDown = (e: Event) => {
        if ((e as KeyboardEvent).key === 'Escape') {
          setShowTags(false)
          setShowEnvVars(false)
          setSearchTerm('')
        }
      }
      textareaRef.current.addEventListener('keydown', handleKeyDown)
      return () => textareaRef.current?.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <>
      <div className='space-y-4' ref={containerRef}>
        <div className='group relative overflow-visible rounded-lg border bg-background'>
          <div className='flex h-10 items-center justify-between overflow-hidden rounded-t-lg border-b bg-card px-3'>
            <span className='font-medium text-sm'>Boolean Condition</span>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 text-xs'>
                <div className='h-2 w-2 rounded-full bg-green-500' />
                <span className='text-muted-foreground'>True</span>
              </div>
              <div className='flex items-center gap-1 text-xs'>
                <div className='h-2 w-2 rounded-full bg-red-500' />
                <span className='text-muted-foreground'>False</span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'relative min-h-[100px] rounded-b-lg bg-background',
              isConnecting && 'ring-2 ring-primary ring-offset-2'
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Textarea for input */}
            <Textarea
              ref={textareaRef}
              value={conditionValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowTags(false)
                  setShowEnvVars(false)
                }
              }}
              placeholder='e.g., {{agent1.content}}==1 or content.length > 10'
              className={cn(
                'min-h-[100px] resize-none border-0 bg-transparent font-mono text-sm',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'text-transparent caret-foreground selection:bg-primary/20',
                'relative z-20',
                disabled && 'pointer-events-none opacity-60'
              )}
              disabled={disabled}
            />

            {/* Overlay for variable highlighting */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words bg-transparent px-3 py-2 font-mono text-sm',
                'z-10 text-foreground'
              )}
            >
              {formatDisplayText(conditionValue, true)}
            </div>

            {showEnvVars && (
              <EnvVarDropdown
                visible={showEnvVars}
                onSelect={handleEnvVarSelect}
                searchTerm={searchTerm}
                inputValue={conditionValue}
                cursorPosition={cursorPosition}
                onClose={() => {
                  setShowEnvVars(false)
                  setSearchTerm('')
                }}
              />
            )}

            {showTags && (
              <TagDropdown
                visible={showTags}
                onSelect={handleTagSelect}
                blockId={blockId}
                activeSourceBlockId={activeSourceBlockId}
                inputValue={conditionValue}
                cursorPosition={cursorPosition}
                onClose={() => {
                  setShowTags(false)
                  setActiveSourceBlockId(null)
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
