'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Upload, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createLogger } from '@/lib/logs/console/logger'
import type {
  ApiKeyTestRequest,
  CloudProvider,
  EmbeddingDetectionResponse,
  EmbeddingModel,
} from '@/lib/types/embeddings'
import { useKnowledgeUpload } from '@/app/arena/[workspaceId]/knowledge/hooks/use-knowledge-upload'

const logger = createLogger('UploadModal')

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  knowledgeBaseId: string
  chunkingConfig?: {
    maxSize: number
    minSize: number
    overlap: number
  }
  onUploadComplete?: () => void
}

interface FileWithPreview extends File {
  preview?: string
}

export function UploadModal({
  open,
  onOpenChange,
  knowledgeBaseId,
  chunkingConfig,
  onUploadComplete,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])

  // Embedding model state
  const [detectedModels, setDetectedModels] = useState<EmbeddingModel[]>([])
  const [cloudProviders, setCloudProviders] = useState<CloudProvider[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Cloud provider management
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<string>('')
  const [apiKey, setApiKey] = useState('')
  const [userApiKeys, setUserApiKeys] = useState<Record<string, string>>({})

  // Processing options with defaults from chunking config
  const [chunkSize, setChunkSize] = useState(chunkingConfig?.maxSize?.toString() || '1000')
  const [chunkOverlap, setChunkOverlap] = useState(chunkingConfig?.overlap?.toString() || '200')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { uploadFiles, isUploading, uploadProgress, uploadError } = useKnowledgeUpload({
    onUploadComplete: () => {
      setSelectedFiles([])
      setError(null)
      onUploadComplete?.()
      onOpenChange(false)
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  // Load available models on mount
  useEffect(() => {
    if (open) {
      detectModels()
    }
  }, [open])

  const detectModels = async () => {
    setIsLoadingModels(true)
    setError(null)
    try {
      const response = await fetch('/api/embeddings/detect')
      const result: EmbeddingDetectionResponse = await response.json()

      if (result.success) {
        setDetectedModels(result.data.detectedModels)
        setCloudProviders(result.data.cloudProviders)

        // Auto-select the first available model
        const firstAvailable = result.data.detectedModels.find((m) => m.available)
        if (firstAvailable && !selectedModelId) {
          setSelectedModelId(firstAvailable.id)
        }
      } else {
        setError(result.error || 'Failed to detect embedding models')
      }
    } catch (error) {
      logger.error('Failed to detect embedding models:', error)
      setError('Failed to connect to embedding detection service')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const testApiKeys = async () => {
    if (Object.keys(userApiKeys).length === 0) return

    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/embeddings/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: userApiKeys } as ApiKeyTestRequest),
      })

      const result: EmbeddingDetectionResponse = await response.json()

      if (result.success) {
        setDetectedModels(result.data.detectedModels)
      }
    } catch (error) {
      logger.error('Failed to test API keys:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const addCloudProvider = async () => {
    if (!selectedCloudProvider || !apiKey.trim()) return

    const newApiKeys = { ...userApiKeys, [selectedCloudProvider]: apiKey }
    setUserApiKeys(newApiKeys)
    setApiKey('')
    setSelectedCloudProvider('')

    // Test the new API key
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/embeddings/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: newApiKeys } as ApiKeyTestRequest),
      })

      const result: EmbeddingDetectionResponse = await response.json()

      if (result.success) {
        setDetectedModels(result.data.detectedModels)
      }
    } catch (error) {
      logger.error('Failed to test new API key:', error)
      setError('Failed to validate API key')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const removeApiKey = (providerId: string) => {
    const newApiKeys = { ...userApiKeys }
    delete newApiKeys[providerId]
    setUserApiKeys(newApiKeys)

    // Refresh models without this API key
    testApiKeys()
  }

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 100MB.`
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `File "${file.name}" has an unsupported format.`
    }
    return null
  }

  const handleFileSelect = (files: FileList | File[]) => {
    setError(null)
    const newFiles: FileWithPreview[] = []

    for (const file of Array.from(files)) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      newFiles.push(file as FileWithPreview)
    }

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !selectedModelId) return

    // Check if it's an available model
    const selectedModel = detectedModels.find((m) => m.id === selectedModelId && m.available)

    if (!selectedModel) {
      // Check if it's a cloud provider model that needs API key
      const isCloudModel =
        selectedModelId.includes('-') &&
        cloudProviders.some((provider) => selectedModelId.startsWith(provider.id))

      if (isCloudModel) {
        setError('This model requires an API key. Please add the cloud provider API key first.')
        return
      }
      setError('Please select a valid and available embedding model')
      return
    }

    try {
      await uploadFiles(selectedFiles, knowledgeBaseId, {
        chunkSize: Number.parseInt(chunkSize),
        chunkOverlap: Number.parseInt(chunkOverlap),
        embeddingModel: selectedModel.name,
        apiKeys: userApiKeys, // Include all user-provided API keys
      })
    } catch (error) {
      logger.error('Upload failed:', error)
      setError('Upload failed. Please try again.')
    }
  }

  const closeModal = () => onOpenChange(false)

  const availableModels = detectedModels.filter((m) => m.available)
  const providersWithKeys = Object.keys(userApiKeys)

  // Check if selected model is actually available for upload
  const isSelectedModelAvailable =
    selectedModelId && detectedModels.some((m) => m.id === selectedModelId && m.available)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* File Selection */}
          <div
            className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className='mx-auto mb-2 h-8 w-8 text-gray-400' />
            <p className='mb-1 font-medium text-sm'>Drop files or click to select</p>
            <p className='text-gray-500 text-xs'>PDF, DOC, TXT, CSV (max 100MB)</p>
            <input
              ref={fileInputRef}
              type='file'
              multiple
              accept={ACCEPTED_FILE_TYPES.join(',')}
              className='hidden'
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              aria-label='Select files to upload'
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className='space-y-1'>
              <p className='text-gray-600 text-xs'>{selectedFiles.length} file(s) selected</p>
              <div className='max-h-20 space-y-1 overflow-y-auto'>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded bg-gray-50 p-1 text-xs'
                  >
                    <span className='truncate'>{file.name}</span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-4 w-4 p-0'
                      onClick={() =>
                        setSelectedFiles((files) => files.filter((_, i) => i !== index))
                      }
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Embedding Model Selection */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm'>Embedding Model</Label>
              <div className='flex items-center space-x-2'>
                {isLoadingModels && <RefreshCw className='h-3 w-3 animate-spin' />}
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0'
                  onClick={detectModels}
                  disabled={isLoadingModels}
                  title='Refresh models'
                >
                  <RefreshCw className='h-3 w-3' />
                </Button>
              </div>
            </div>

            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger className='h-8'>
                <SelectValue placeholder='Select embedding model' />
              </SelectTrigger>
              <SelectContent className='max-h-60 w-[var(--radix-select-trigger-width)]'>
                {/* Available Local Models */}
                {detectedModels
                  .filter((m) => m.provider === 'Ollama' && m.available)
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className='text-sm'>{model.name}</span>
                    </SelectItem>
                  ))}

                {/* Available Cloud Models */}
                {detectedModels
                  .filter((m) => m.provider !== 'Ollama' && m.available)
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className='text-sm'>{model.name}</span>
                    </SelectItem>
                  ))}

                {/* Unavailable Cloud Models (require API key) */}
                {cloudProviders.map((provider) =>
                  provider.models
                    .filter(
                      (providerModel) =>
                        !detectedModels.some(
                          (detected) =>
                            detected.name === providerModel.name &&
                            detected.provider === provider.name
                        )
                    )
                    .map((model) => (
                      <SelectItem
                        key={`${provider.id}-${model.id}`}
                        value={`${provider.id}-${model.id}`}
                      >
                        <span className='text-gray-600 text-sm'>{model.name}</span>
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>

            {/* Help text for model selection */}
            {!selectedModelId && (
              <div className='rounded bg-primary/10 p-2 text-gray-500 text-xs'>
                💡 Choose a local Ollama model for instant use, or select a cloud model to add API
                keys
              </div>
            )}

            {/* Show API key input if selected model requires it */}
            {(() => {
              // Check if selected model requires API key
              if (!selectedModelId) return null

              // Check if it's a cloud provider model without API key
              const selectedAvailableModel = detectedModels.find(
                (m) => m.id === selectedModelId && m.available
              )
              if (selectedAvailableModel) return null // Model is already available

              // Find which provider this model belongs to
              const modelParts = selectedModelId.split('-')
              const providerId = modelParts[0]
              const provider = cloudProviders.find((p) => p.id === providerId)

              if (!provider) return null

              // Check if we already have an API key for this provider
              if (userApiKeys[providerId]) return null

              return (
                <div className='space-y-3 rounded border border-amber-200 bg-amber-50 p-3'>
                  <div className='flex items-center space-x-2'>
                    <div className='font-medium text-amber-800 text-sm'>
                      🔑 API Key Required for {provider.name}
                    </div>
                  </div>

                  <div className='text-amber-700 text-xs'>
                    To use{' '}
                    {provider.models.find((m) => selectedModelId.includes(m.id))?.name ||
                      'this model'}
                    , please enter your {provider.name} API key:
                  </div>

                  <div className='flex space-x-2'>
                    <Input
                      type='password'
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter ${provider.name} API key`}
                      className='h-8 text-xs'
                    />
                    <Button
                      type='button'
                      size='sm'
                      className='h-8'
                      onClick={() => {
                        setSelectedCloudProvider(providerId)
                        addCloudProvider()
                      }}
                      disabled={!apiKey.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  <div className='text-amber-600 text-xs'>
                    This will unlock all {provider.models.length} models from {provider.name}
                  </div>
                </div>
              )
            })()}

            {/* Show configured providers */}
            {providersWithKeys.length > 0 && (
              <div className='space-y-2'>
                <Label className='text-gray-600 text-xs'>Configured API Keys</Label>
                {providersWithKeys.map((providerId) => {
                  const provider = cloudProviders.find((p) => p.id === providerId)
                  const providerModels = detectedModels.filter(
                    (m) => m.provider === provider?.name && m.id.includes('user')
                  )
                  return (
                    <div
                      key={providerId}
                      className='rounded border border-green-200 bg-green-50 p-2'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <span className='font-medium text-sm'>{provider?.name}</span>
                          <Badge variant='secondary' className='text-xs'>
                            {providerModels.length} model{providerModels.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-5 w-5 p-0'
                          onClick={() => removeApiKey(providerId)}
                          title='Remove API key'
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                      <div className='mt-1 text-gray-600 text-xs'>
                        Models: {providerModels.map((m) => m.name).join(', ')}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Processing Options */}
          <div className='space-y-2'>
            <Label className='text-sm'>Processing Options</Label>
            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-1'>
                <Label className='text-gray-600 text-xs'>Chunk Size</Label>
                <Select value={chunkSize} onValueChange={setChunkSize}>
                  <SelectTrigger className='h-7 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='500'>500 chars</SelectItem>
                    <SelectItem value='1000'>1000 chars</SelectItem>
                    <SelectItem value='1500'>1500 chars</SelectItem>
                    <SelectItem value='2000'>2000 chars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label className='text-gray-600 text-xs'>Overlap</Label>
                <Select value={chunkOverlap} onValueChange={setChunkOverlap}>
                  <SelectTrigger className='h-7 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='50'>50 chars</SelectItem>
                    <SelectItem value='100'>100 chars</SelectItem>
                    <SelectItem value='200'>200 chars</SelectItem>
                    <SelectItem value='300'>300 chars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && <div className='rounded bg-red-50 p-2 text-red-600 text-xs'>{error}</div>}

          {/* Upload Progress */}
          {isUploading && uploadProgress && (
            <div className='space-y-1'>
              <div className='flex justify-between text-xs'>
                <span>Uploading...</span>
                <span>
                  {uploadProgress.filesCompleted}/{uploadProgress.totalFiles}
                </span>
              </div>
              <Progress
                value={(uploadProgress.filesCompleted / uploadProgress.totalFiles) * 100}
                className='h-2'
              />
            </div>
          )}

          {/* Actions */}
          <div className='flex justify-end space-x-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={closeModal}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              onClick={handleUpload}
              disabled={
                selectedFiles.length === 0 ||
                !selectedModelId ||
                !isSelectedModelAvailable ||
                isUploading ||
                isLoadingModels
              }
            >
              {isUploading ? (
                <>
                  <RefreshCw className='mr-1 h-3 w-3 animate-spin' />
                  Uploading
                </>
              ) : (
                `Upload ${selectedFiles.length || ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
