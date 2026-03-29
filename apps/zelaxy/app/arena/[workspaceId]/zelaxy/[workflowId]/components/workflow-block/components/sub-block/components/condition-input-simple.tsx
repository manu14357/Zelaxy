import { useEffect, useRef, useState } from 'react'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'

import Editor from 'react-simple-code-editor'
import { checkEnvVarTrigger, EnvVarDropdown } from '@/components/ui/env-var-dropdown'
import { checkTagTrigger, TagDropdown } from '@/components/ui/tag-dropdown'
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

      const textarea = containerRef.current?.querySelector('textarea') as HTMLTextAreaElement | null
      const dropPosition = textarea?.selectionStart ?? 0

      const newValue = `${conditionValue.slice(0, dropPosition)}{{${conditionValue.slice(dropPosition)}`

      if (!isPreview) {
        setStoreValue(newValue)
        setShowTags(true)
        setCursorPosition(dropPosition + 2)
        setActiveSourceBlockId(data.connectionData?.sourceBlockId || null)
      }

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

  // Handle tag selection
  const handleTagSelect = (newValue: string) => {
    if (isPreview || disabled) return
    setStoreValue(newValue)
    setShowTags(false)
    setActiveSourceBlockId(null)
    emitTagSelection(newValue)
  }

  // Handle environment variable selection
  const handleEnvVarSelect = (newValue: string) => {
    if (isPreview || disabled) return
    setStoreValue(newValue)
    setShowEnvVars(false)
    setSearchTerm('')
    emitTagSelection(newValue)
  }

  // Handle value changes
  const handleValueChange = (newValue: string) => {
    if (isPreview || disabled) return

    const textarea = containerRef.current?.querySelector('textarea') as HTMLTextAreaElement | null
    if (textarea) {
      const pos = textarea.selectionStart ?? 0

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
    const textarea = containerRef.current?.querySelector('textarea')
    if (textarea) {
      const handleKeyDown = (e: Event) => {
        if ((e as KeyboardEvent).key === 'Escape') {
          setShowTags(false)
          setShowEnvVars(false)
          setSearchTerm('')
        }
      }
      textarea.addEventListener('keydown', handleKeyDown)
      return () => textarea.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
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
            'relative min-h-[100px] rounded-b-lg bg-background font-mono text-sm',
            isConnecting && 'ring-2 ring-primary ring-offset-2'
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Line numbers */}
          <div
            className='absolute top-0 bottom-0 left-0 flex w-[30px] select-none flex-col items-end bg-muted/30 pt-3 pr-3'
            aria-hidden='true'
          >
            {conditionValue.split('\n').map((_, index) => (
              <div key={index} className='text-muted-foreground text-xs leading-[21px]'>
                {index + 1}
              </div>
            ))}
          </div>

          <div className='relative mt-0 pt-0 pl-[30px]'>
            {conditionValue.length === 0 && (
              <div className='pointer-events-none absolute top-[12px] left-[42px] select-none text-muted-foreground/50'>
                {'<response> === "success"'}
              </div>
            )}
            <Editor
              value={conditionValue}
              onValueChange={handleValueChange}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowTags(false)
                  setShowEnvVars(false)
                }
              }}
              highlight={(code) => highlight(code, languages.javascript, 'javascript')}
              padding={12}
              className={cn(
                'min-h-[76px] font-mono text-sm outline-none',
                'selection:bg-primary/15 dark:selection:bg-primary/15',
                disabled && 'pointer-events-none opacity-60'
              )}
              style={{
                fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                fontSize: '13px',
                lineHeight: '21px',
                minHeight: '76px',
              }}
              disabled={disabled}
              placeholder=''
            />

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
    </div>
  )
}
