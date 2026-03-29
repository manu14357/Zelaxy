'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Eye, EyeOff, File, Plus, RefreshCw, Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Separator } from '@/components/ui/separator'
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
  isOpen: boolean
  onClose: () => void
  knowledgeId: string
}

interface FileWithPreview extends File {
  preview?: string
}

export function UploadModal({ isOpen, onClose, knowledgeId }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])

  // Embedding model state
  const [detectedModels, setDetectedModels] = useState<EmbeddingModel[]>([])
  const [cloudProviders, setCloudProviders] = useState<CloudProvider[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Cloud provider management
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<string>('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [userApiKeys, setUserApiKeys] = useState<Record<string, string>>({})

  // Processing options
  const [chunkSize, setChunkSize] = useState('1000')
  const [chunkOverlap, setChunkOverlap] = useState('200')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { uploadFiles, isUploading, uploadProgress, uploadError } = useKnowledgeUpload({
    onUploadComplete: () => {
      setSelectedFiles([])
      setError(null)
      onClose()
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  // Load available models on mount
  useEffect(() => {
    if (isOpen) {
      detectModels()
    }
  }, [isOpen])

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
    setShowAddProvider(false)

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

    const selectedModel = detectedModels.find((m) => m.id === selectedModelId)
    if (!selectedModel) {
      setError('Please select a valid embedding model')
      return
    }

    try {
      await uploadFiles(selectedFiles, knowledgeId, {
        chunkSize: Number.parseInt(chunkSize),
        chunkOverlap: Number.parseInt(chunkOverlap),
        embeddingModel: selectedModel.name,
      })
    } catch (error) {
      logger.error('Upload failed:', error)
      setError('Upload failed. Please try again.')
    }
  }

  const availableModels = detectedModels.filter((m) => m.available)
  const unavailableModels = detectedModels.filter((m) => !m.available)
  const providersWithKeys = Object.keys(userApiKeys)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* File Selection */}
          <div className='space-y-4'>
            <Label>Select Files</Label>
            <div
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
            >
              <Upload className='mx-auto mb-4 h-12 w-12 text-gray-400' />
              <p className='mb-2 font-medium text-lg'>Drop files here or click to select</p>
              <p className='mb-4 text-gray-500 text-sm'>
                Supports PDF, DOC, DOCX, TXT, CSV, XLS, XLSX (max 100MB)
              </p>
              <Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()}>
                Choose Files
              </Button>
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
              <div className='space-y-2'>
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className='max-h-32 space-y-1 overflow-y-auto'>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded bg-gray-50 p-2'
                    >
                      <div className='flex items-center space-x-2'>
                        <File className='h-4 w-4' />
                        <span className='text-sm'>{file.name}</span>
                        <span className='text-gray-500 text-xs'>
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          setSelectedFiles((files) => files.filter((_, i) => i !== index))
                        }
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Embedding Model Selection */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label>Embedding Model</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={detectModels}
                disabled={isLoadingModels}
              >
                {isLoadingModels ? (
                  <RefreshCw className='h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='h-4 w-4' />
                )}
                Refresh
              </Button>
            </div>

            {isLoadingModels ? (
              <div className='py-4 text-center'>
                <RefreshCw className='mx-auto mb-2 h-6 w-6 animate-spin' />
                <p className='text-gray-500 text-sm'>Detecting embedding models...</p>
              </div>
            ) : (
              <>
                {availableModels.length > 0 && (
                  <div className='space-y-2'>
                    <Label className='text-sm'>Available Models</Label>
                    <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                      <SelectTrigger>
                        <SelectValue placeholder='Choose an embedding model' />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className='flex w-full items-center justify-between'>
                              <div>
                                <span className='font-medium'>{model.name}</span>
                                <span className='ml-2 text-gray-500 text-xs'>
                                  ({model.provider})
                                </span>
                              </div>
                              <Badge variant='secondary' className='ml-2'>
                                {model.dimensions}d
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedModelId && (
                      <p className='text-gray-600 text-xs'>
                        {availableModels.find((m) => m.id === selectedModelId)?.description}
                      </p>
                    )}
                  </div>
                )}

                {unavailableModels.length > 0 && (
                  <div className='space-y-2'>
                    <Label className='text-gray-500 text-sm'>Unavailable Models</Label>
                    <div className='space-y-1'>
                      {unavailableModels.map((model) => (
                        <div key={model.id} className='rounded bg-gray-50 p-2 text-sm'>
                          <div className='flex items-center justify-between'>
                            <span className='font-medium text-gray-500'>{model.name}</span>
                            <Badge variant='outline' className='text-gray-500'>
                              {model.provider}
                            </Badge>
                          </div>
                          <p className='mt-1 text-gray-500 text-xs'>{model.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Cloud Provider Management */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm'>Cloud Providers</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setShowAddProvider(true)}
                >
                  <Plus className='mr-1 h-4 w-4' />
                  Add Provider
                </Button>
              </div>

              {providersWithKeys.length > 0 && (
                <div className='space-y-2'>
                  {providersWithKeys.map((providerId) => {
                    const provider = cloudProviders.find((p) => p.id === providerId)
                    return (
                      <div
                        key={providerId}
                        className='flex items-center justify-between rounded bg-green-50 p-2'
                      >
                        <div>
                          <span className='font-medium'>{provider?.name || providerId}</span>
                          <Badge variant='outline' className='ml-2 text-green-600'>
                            API Key Added
                          </Badge>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeApiKey(providerId)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {showAddProvider && (
                <div className='space-y-4 rounded-lg border p-4'>
                  <div className='space-y-2'>
                    <Label>Select Provider</Label>
                    <Select value={selectedCloudProvider} onValueChange={setSelectedCloudProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder='Choose a cloud provider' />
                      </SelectTrigger>
                      <SelectContent>
                        {cloudProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCloudProvider && (
                    <div className='space-y-2'>
                      <Label>API Key</Label>
                      <div className='flex space-x-2'>
                        <div className='relative flex-1'>
                          <Input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={`Enter ${cloudProviders.find((p) => p.id === selectedCloudProvider)?.name} API key`}
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='-translate-y-1/2 absolute top-1/2 right-1'
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                        <Button type='button' onClick={addCloudProvider} disabled={!apiKey.trim()}>
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className='flex justify-end space-x-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setShowAddProvider(false)
                        setSelectedCloudProvider('')
                        setApiKey('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Processing Options */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Chunk Size</Label>
              <Select value={chunkSize} onValueChange={setChunkSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='500'>500 characters</SelectItem>
                  <SelectItem value='1000'>1000 characters</SelectItem>
                  <SelectItem value='1500'>1500 characters</SelectItem>
                  <SelectItem value='2000'>2000 characters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Chunk Overlap</Label>
              <Select value={chunkOverlap} onValueChange={setChunkOverlap}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='100'>100 characters</SelectItem>
                  <SelectItem value='200'>200 characters</SelectItem>
                  <SelectItem value='300'>300 characters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress && (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Uploading {uploadProgress.currentFile || 'files'}...</span>
                <span>
                  {uploadProgress.filesCompleted} / {uploadProgress.totalFiles} files
                </span>
              </div>
              <Progress value={(uploadProgress.filesCompleted / uploadProgress.totalFiles) * 100} />
              <p className='text-gray-500 text-xs'>Stage: {uploadProgress.stage}</p>
            </div>
          )}

          {/* Actions */}
          <div className='flex justify-end space-x-3'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                selectedFiles.length === 0 || !selectedModelId || isUploading || isLoadingModels
              }
            >
              {isUploading ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Uploading...
                </>
              ) : (
                `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
