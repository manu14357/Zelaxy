'use client'

import { useRef, useState } from 'react'
import { File, FileText, Image, Paperclip, X } from 'lucide-react'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ChatFileUpload')

interface ChatFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

interface ChatFileUploadProps {
  files: ChatFile[]
  onFilesChange: (files: ChatFile[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  disabled?: boolean
}

export function ChatFileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['*'],
  disabled = false,
}: ChatFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return

    const newFiles: ChatFile[] = []
    const errors: string[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      // Check file count limit
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`)
        break
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name} is too large (max ${maxSize}MB)`)
        continue
      }

      // Check file type if specified
      if (acceptedTypes.length > 0 && !acceptedTypes.includes('*')) {
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1))
          }
          return file.type === type
        })

        if (!isAccepted) {
          errors.push(`${file.name} type not supported`)
          continue
        }
      }

      // Check for duplicates
      const isDuplicate = files.some(
        (existingFile) => existingFile.name === file.name && existingFile.size === file.size
      )

      if (isDuplicate) {
        errors.push(`${file.name} already added`)
        continue
      }

      newFiles.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      })
    }

    if (errors.length > 0) {
      logger.warn('File upload errors:', errors)
      // You could show these errors in a toast or alert
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles])
    }

    // Reset the file input so the same file (or any new file) triggers onChange again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className='h-4 w-4' />
    if (type.includes('text') || type.includes('json')) return <FileText className='h-4 w-4' />
    return <File className='h-4 w-4' />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
  }

  return (
    <div className='space-y-1.5'>
      {/* File Upload Button */}
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= maxFiles}
          className='flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-[12px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'
          title={files.length >= maxFiles ? `Maximum ${maxFiles} files` : 'Attach files'}
        >
          <Paperclip className='h-3.5 w-3.5' />
          <span>Attach</span>
        </button>

        <input
          ref={fileInputRef}
          type='file'
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className='hidden'
          accept={acceptedTypes.join(',')}
          disabled={disabled}
          aria-label='Upload files'
        />

        {files.length > 0 && (
          <span className='text-[11px] text-muted-foreground/60 tabular-nums'>
            {files.length}/{maxFiles}
          </span>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className='space-y-1'>
          {files.map((file) => (
            <div
              key={file.id}
              className='group flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-1.5 text-[12px]'
            >
              <span className='flex-shrink-0 text-muted-foreground/70'>
                {getFileIcon(file.type)}
              </span>
              <span className='min-w-0 flex-1 truncate text-foreground' title={file.name}>
                {file.name}
              </span>
              <span className='flex-shrink-0 text-[10px] text-muted-foreground/50 tabular-nums'>
                {formatFileSize(file.size)}
              </span>
              <button
                type='button'
                onClick={() => handleRemoveFile(file.id)}
                className='flex-shrink-0 rounded-md p-0.5 text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-500'
                title='Remove file'
              >
                <X className='h-3 w-3' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center border-2 border-primary/60 border-dashed bg-primary/100/5 backdrop-blur-[2px]'
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className='rounded-xl border border-primary/30 bg-background/95 px-6 py-4 shadow-2xl'>
            <p className='font-medium text-[13px] text-primary dark:text-primary/80'>
              Drop files here to attach
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
