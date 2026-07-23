'use client'

import {
  forwardRef,
  type KeyboardEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ArrowUp,
  AtSign,
  Box,
  FileText,
  Image,
  Loader2,
  MessageCircle,
  Package,
  Paperclip,
  Workflow,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { useCopilotStore } from '@/stores/copilot/store'
import type { CopilotChatContext } from '@/stores/copilot/types'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

export interface MessageFileAttachment {
  id: string
  s3_key: string
  filename: string
  media_type: string
  size: number
}

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  path: string
  key?: string // Add key field to store the actual S3 key
  uploading: boolean
  previewUrl?: string // For local preview of images before upload
}

interface UserInputProps {
  onSubmit: (
    message: string,
    fileAttachments?: MessageFileAttachment[],
    contexts?: CopilotChatContext[]
  ) => void
  onAbort?: () => void
  disabled?: boolean
  isLoading?: boolean
  isAborting?: boolean
  placeholder?: string
  className?: string
  mode?: 'ask' | 'agent'
  onModeChange?: (mode: 'ask' | 'agent') => void
  value?: string // Controlled value from outside
  onChange?: (value: string) => void // Callback when value changes
}

interface UserInputRef {
  focus: () => void
}

const UserInput = forwardRef<UserInputRef, UserInputProps>(
  (
    {
      onSubmit,
      onAbort,
      disabled = false,
      isLoading = false,
      isAborting = false,
      placeholder = 'How can I help you today?',
      className,
      mode = 'agent',
      onModeChange,
      value: controlledValue,
      onChange: onControlledChange,
    },
    ref
  ) => {
    const [internalMessage, setInternalMessage] = useState('')
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
    // Drag and drop state
    const [isDragging, setIsDragging] = useState(false)
    const [dragCounter, setDragCounter] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data: session } = useSession()
    const { currentChat, workflowId } = useCopilotStore()

    // ── @-mention contexts ──────────────────────────────────────────────────────
    const blocks = useWorkflowStore((s) => s.blocks)
    const workflows = useWorkflowRegistry((s) => s.workflows)
    const [contexts, setContexts] = useState<CopilotChatContext[]>([])
    const [mention, setMention] = useState<{ query: string; start: number } | null>(null)
    const [mentionIndex, setMentionIndex] = useState(0)

    // Candidate mention items = the current workflow's blocks + other workflows, filtered by query.
    const mentionItems = useMemo<CopilotChatContext[]>(() => {
      if (!mention) return []
      const q = mention.query.toLowerCase()
      const blockItems: CopilotChatContext[] = Object.values(blocks || {})
        .filter((b: any) => b?.name)
        .map((b: any) => ({
          kind: 'workflow_block' as const,
          id: b.id,
          label: b.name,
          blockType: b.type,
        }))
      const workflowItems: CopilotChatContext[] = Object.values(workflows || {})
        .filter((w: any) => w?.name)
        .map((w: any) => ({ kind: 'workflow' as const, id: w.id, label: w.name }))
      return [...blockItems, ...workflowItems]
        .filter((it) => it.label.toLowerCase().includes(q))
        .slice(0, 8)
    }, [mention, blocks, workflows])

    const addContext = (item: CopilotChatContext) => {
      setContexts((prev) =>
        prev.some((c) => c.kind === item.kind && c.id === item.id) ? prev : [...prev, item]
      )
    }
    const removeContext = (kind: string, id: string) =>
      setContexts((prev) => prev.filter((c) => !(c.kind === kind && c.id === id)))

    // Replace the active "@query" token in the textarea with nothing and attach the chosen context.
    const selectMention = (item: CopilotChatContext) => {
      if (!mention) return
      const before = message.slice(0, mention.start)
      const after = message.slice(mention.start + 1 + mention.query.length)
      const next = `${before}${after}`
      if (controlledValue !== undefined) onControlledChange?.(next)
      else setInternalMessage(next)
      addContext(item)
      setMention(null)
      setMentionIndex(0)
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (el) {
          el.focus()
          el.setSelectionRange(before.length, before.length)
        }
      })
    }

    // Detect an active "@token" immediately before the caret (token starts at line start or space).
    const detectMention = (value: string, caret: number) => {
      const uptoCaret = value.slice(0, caret)
      const at = uptoCaret.lastIndexOf('@')
      if (at === -1) return setMention(null)
      const charBefore = at === 0 ? '' : uptoCaret[at - 1]
      if (charBefore && !/\s/.test(charBefore)) return setMention(null)
      const query = uptoCaret.slice(at + 1)
      if (/\s/.test(query)) return setMention(null)
      setMention({ query, start: at })
      setMentionIndex(0)
    }

    // Expose focus method to parent
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          textareaRef.current?.focus()
        },
      }),
      []
    )

    // Use controlled value if provided, otherwise use internal state
    const message = controlledValue !== undefined ? controlledValue : internalMessage
    const setMessage =
      controlledValue !== undefined ? onControlledChange || (() => {}) : setInternalMessage

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px` // Max height of 120px
      }
    }, [message])

    // Cleanup preview URLs on unmount
    useEffect(() => {
      return () => {
        attachedFiles.forEach((f) => {
          if (f.previewUrl) {
            URL.revokeObjectURL(f.previewUrl)
          }
        })
      }
    }, [])

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragCounter((prev) => {
        const newCount = prev + 1
        if (newCount === 1) {
          setIsDragging(true)
        }
        return newCount
      })
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragCounter((prev) => {
        const newCount = prev - 1
        if (newCount === 0) {
          setIsDragging(false)
        }
        return newCount
      })
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Add visual feedback for valid drop zone
      e.dataTransfer.dropEffect = 'copy'
    }

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      setDragCounter(0)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processFiles(e.dataTransfer.files)
      }
    }

    // Process dropped or selected files
    const processFiles = async (fileList: FileList) => {
      const userId = session?.user?.id

      if (!userId) {
        console.error('User ID not available for file upload')
        return
      }

      // Process files one by one
      for (const file of Array.from(fileList)) {
        // Create a preview URL for images
        let previewUrl: string | undefined
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file)
        }

        // Create a temporary file entry with uploading state
        const tempFile: AttachedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          path: '',
          uploading: true,
          previewUrl,
        }

        setAttachedFiles((prev) => [...prev, tempFile])

        try {
          // Request presigned URL
          const presignedResponse = await fetch('/api/files/presigned?type=copilot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
              fileSize: file.size,
              userId,
            }),
          })

          if (!presignedResponse.ok) {
            throw new Error('Failed to get presigned URL')
          }

          const presignedData = await presignedResponse.json()

          // Upload file to S3
          console.log('Uploading to S3:', presignedData.presignedUrl)
          const uploadResponse = await fetch(presignedData.presignedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file,
          })

          console.log('S3 Upload response status:', uploadResponse.status)

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('S3 Upload failed:', errorText)
            throw new Error(`Failed to upload file: ${uploadResponse.status} ${errorText}`)
          }

          // Update file entry with success
          setAttachedFiles((prev) =>
            prev.map((f) =>
              f.id === tempFile.id
                ? {
                    ...f,
                    path: presignedData.fileInfo.path,
                    key: presignedData.fileInfo.key, // Store the actual S3 key
                    uploading: false,
                  }
                : f
            )
          )
        } catch (error) {
          console.error('File upload failed:', error)
          // Remove failed upload
          setAttachedFiles((prev) => prev.filter((f) => f.id !== tempFile.id))
        }
      }
    }

    const handleSubmit = () => {
      const trimmedMessage = message.trim()
      if (!trimmedMessage || disabled || isLoading) return

      // Check for failed uploads and show user feedback
      const failedUploads = attachedFiles.filter((f) => !f.uploading && !f.key)
      if (failedUploads.length > 0) {
        console.error(
          'Some files failed to upload:',
          failedUploads.map((f) => f.name)
        )
      }

      // Convert attached files to the format expected by the API
      const fileAttachments = attachedFiles
        .filter((f) => !f.uploading && f.key) // Only include successfully uploaded files with keys
        .map((f) => ({
          id: f.id,
          s3_key: f.key!, // Use the actual S3 key stored from the upload response
          filename: f.name,
          media_type: f.type,
          size: f.size,
        }))

      onSubmit(trimmedMessage, fileAttachments, contexts.length > 0 ? contexts : undefined)

      // Clean up preview URLs before clearing
      attachedFiles.forEach((f) => {
        if (f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl)
        }
      })

      // Clear the message, files and contexts after submit
      if (controlledValue !== undefined) {
        onControlledChange?.('')
      } else {
        setInternalMessage('')
      }
      setAttachedFiles([])
      setContexts([])
      setMention(null)
    }

    const handleAbort = () => {
      if (onAbort && isLoading) {
        onAbort()
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // While the @-mention menu is open, the arrow/enter/tab/escape keys drive the menu.
      if (mention && mentionItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setMentionIndex((i) => (i + 1) % mentionItems.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setMentionIndex((i) => (i - 1 + mentionItems.length) % mentionItems.length)
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          selectMention(mentionItems[mentionIndex])
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setMention(null)
          return
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      if (controlledValue !== undefined) {
        onControlledChange?.(newValue)
      } else {
        setInternalMessage(newValue)
      }
      detectMention(newValue, e.target.selectionStart ?? newValue.length)
    }

    const handleFileSelect = () => {
      if (disabled || isLoading) {
        return
      }

      fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) {
        return
      }

      await processFiles(files)

      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    const removeFile = (fileId: string) => {
      // Clean up preview URL if it exists
      const file = attachedFiles.find((f) => f.id === fileId)
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl)
      }
      setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId))
    }

    const handleFileClick = (file: AttachedFile) => {
      // If file has been uploaded and has an S3 key, open the S3 URL
      if (file.key) {
        const serveUrl = `/api/files/serve/s3/${encodeURIComponent(file.key)}?bucket=copilot`
        window.open(serveUrl, '_blank')
      } else if (file.previewUrl) {
        // If file hasn't been uploaded yet but has a preview URL, open that
        window.open(file.previewUrl, '_blank')
      }
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
    }

    const isImageFile = (type: string) => {
      return type.startsWith('image/')
    }

    const getFileIcon = (mediaType: string) => {
      if (mediaType.startsWith('image/')) {
        return <Image className='h-5 w-5 text-muted-foreground' />
      }
      if (mediaType.includes('pdf')) {
        return <FileText className='h-5 w-5 text-red-500' />
      }
      if (mediaType.includes('text') || mediaType.includes('json') || mediaType.includes('xml')) {
        return <FileText className='h-5 w-5 text-primary' />
      }
      return <FileText className='h-5 w-5 text-muted-foreground' />
    }

    const canSubmit = message.trim().length > 0 && !disabled && !isLoading
    const showAbortButton = isLoading && onAbort

    const handleModeToggle = () => {
      if (onModeChange) {
        onModeChange(mode === 'ask' ? 'agent' : 'ask')
      }
    }

    const getModeIcon = () => {
      return mode === 'ask' ? (
        <MessageCircle className='h-3 w-3 text-muted-foreground' />
      ) : (
        <Package className='h-3 w-3 text-muted-foreground' />
      )
    }

    return (
      <div className={cn('relative flex-none px-2 pb-2', className)}>
        {/* @-mention menu — reference a workflow block or another workflow as context */}
        {mention && mentionItems.length > 0 && (
          <div className='absolute right-2 bottom-full left-2 z-20 mb-1 overflow-hidden rounded-lg border border-border bg-popover shadow-md'>
            <div className='flex items-center gap-1.5 border-border/60 border-b px-2.5 py-1.5 text-[10px] text-muted-foreground'>
              <AtSign className='h-3 w-3' /> Add context
            </div>
            <div className='max-h-52 overflow-auto py-1'>
              {mentionItems.map((it, i) => (
                <button
                  key={`${it.kind}:${it.id}`}
                  type='button'
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectMention(it)
                  }}
                  onMouseEnter={() => setMentionIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors',
                    i === mentionIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
                  )}
                >
                  {it.kind === 'workflow_block' ? (
                    <Box className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground' />
                  ) : (
                    <Workflow className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground' />
                  )}
                  <span className='truncate'>{it.label}</span>
                  <span className='ml-auto flex-shrink-0 text-[9px] text-muted-foreground/70'>
                    {it.kind === 'workflow_block' ? it.blockType || 'block' : 'workflow'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          className={cn(
            'rounded-lg border border-border bg-background p-1.5 shadow-sm transition-all duration-200 dark:border-border dark:bg-card',
            isDragging && 'border-primary bg-primary/5 dark:border-primary dark:bg-primary/5'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Attached Files Display with Thumbnails */}
          {attachedFiles.length > 0 && (
            <div className='mb-1.5 flex flex-wrap gap-1'>
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className='group relative h-16 w-16 cursor-pointer overflow-hidden border border-border/50 bg-muted/20 transition-all hover:bg-muted/40'
                  title={`${file.name} (${formatFileSize(file.size)})`}
                  onClick={() => handleFileClick(file)}
                >
                  {isImageFile(file.type) && file.previewUrl ? (
                    // For images, show actual thumbnail
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className='h-full w-full object-cover'
                    />
                  ) : isImageFile(file.type) && file.key ? (
                    // For uploaded images without preview URL, use S3 URL
                    <img
                      src={`/api/files/serve/s3/${encodeURIComponent(file.key)}?bucket=copilot`}
                      alt={file.name}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    // For other files, show icon centered
                    <div className='flex h-full w-full items-center justify-center bg-background/50'>
                      {getFileIcon(file.type)}
                    </div>
                  )}

                  {/* Loading overlay */}
                  {file.uploading && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
                      <Loader2 className='h-4 w-4 animate-spin text-white' />
                    </div>
                  )}

                  {/* Remove button */}
                  {!file.uploading && (
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                      className='absolute top-0.5 right-0.5 h-5 w-5 bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100'
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  )}

                  {/* Hover overlay effect */}
                  <div className='pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100' />
                </div>
              ))}
            </div>
          )}

          {/* Attached context chips */}
          {contexts.length > 0 && (
            <div className='mb-1.5 flex flex-wrap gap-1'>
              {contexts.map((c) => (
                <span
                  key={`${c.kind}:${c.id}`}
                  className='flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] text-foreground'
                  title={
                    c.kind === 'workflow_block' ? `Block (${c.blockType || 'block'})` : 'Workflow'
                  }
                >
                  {c.kind === 'workflow_block' ? (
                    <Box className='h-2.5 w-2.5 text-muted-foreground' />
                  ) : (
                    <Workflow className='h-2.5 w-2.5 text-muted-foreground' />
                  )}
                  <span className='max-w-[140px] truncate'>{c.label}</span>
                  <button
                    type='button'
                    onClick={() => removeContext(c.kind, c.id)}
                    className='text-muted-foreground transition-colors hover:text-foreground'
                  >
                    <X className='h-2.5 w-2.5' />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Textarea Field */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isDragging ? 'Drop files here...' : placeholder}
            disabled={disabled}
            rows={1}
            className='composer-bare-textarea mb-1.5 min-h-[28px] w-full resize-none overflow-y-auto border-0 bg-transparent px-1 py-0.5 text-muted-foreground text-xs focus-visible:ring-0 focus-visible:ring-offset-0'
            style={{ height: 'auto' }}
          />

          {/* Bottom Row: Mode Selector + Attach Button + Send Button */}
          <div className='flex items-center justify-between'>
            {/* Left side: Mode Selector */}
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleModeToggle}
                disabled={!onModeChange}
                className='flex h-5 items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 font-medium text-[10px] text-secondary-foreground hover:bg-secondary/80'
              >
                {getModeIcon()}
                <span className='capitalize'>{mode}</span>
              </Button>
            </div>

            {/* Right side: Attach Button + Send Button */}
            <div className='flex items-center gap-1'>
              {/* Attach Button */}
              <Button
                variant='ghost'
                size='icon'
                onClick={handleFileSelect}
                disabled={disabled || isLoading}
                className='h-5 w-5 text-muted-foreground hover:text-foreground'
                title='Attach file'
              >
                <Paperclip className='h-2.5 w-2.5' />
              </Button>

              {/* Send Button */}
              {showAbortButton ? (
                <Button
                  onClick={handleAbort}
                  disabled={isAborting}
                  size='icon'
                  className='h-5 w-5 rounded-full bg-red-500 text-white transition-all duration-200 hover:bg-red-600'
                  title='Stop generation'
                >
                  {isAborting ? (
                    <Loader2 className='h-2.5 w-2.5 animate-spin' />
                  ) : (
                    <X className='h-2.5 w-2.5' />
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  size='icon'
                  className='h-5 w-5 bg-primary text-white shadow-[0_0_0_0_hsl(var(--primary))] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                >
                  {isLoading ? (
                    <Loader2 className='h-2.5 w-2.5 animate-spin' />
                  ) : (
                    <ArrowUp className='h-2.5 w-2.5' />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type='file'
            onChange={handleFileChange}
            className='hidden'
            accept='.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.svg'
            multiple
            disabled={disabled || isLoading}
          />
        </div>
      </div>
    )
  }
)

UserInput.displayName = 'UserInput'

export { UserInput }
export type { UserInputRef }
