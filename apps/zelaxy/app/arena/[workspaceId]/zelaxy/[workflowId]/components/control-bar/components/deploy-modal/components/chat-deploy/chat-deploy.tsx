'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Card,
  CardContent,
  ImageUpload,
  Input,
  Label,
  Skeleton,
  Textarea,
} from '@/components/ui'
import { createLogger } from '@/lib/logs/console/logger'
import { getEmailDomain } from '@/lib/urls/utils'
import { AuthSelector } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/chat-deploy/components/auth-selector'
import { SubdomainInput } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/chat-deploy/components/subdomain-input'
import { SuccessView } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/chat-deploy/components/success-view'
import { useChatDeployment } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/chat-deploy/hooks/use-chat-deployment'
import { useChatForm } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/chat-deploy/hooks/use-chat-form'
import { OutputSelect } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/chat/components/output-select/output-select'

const logger = createLogger('ChatDeploy')

interface ChatDeployProps {
  workflowId: string
  deploymentInfo: {
    apiKey: string
  } | null
  onChatExistsChange?: (exists: boolean) => void
  chatSubmitting: boolean
  setChatSubmitting: (submitting: boolean) => void
  onValidationChange?: (isValid: boolean) => void
  onPreDeployWorkflow?: () => Promise<void>
  showDeleteConfirmation?: boolean
  setShowDeleteConfirmation?: (show: boolean) => void
  onDeploymentComplete?: () => void
}

interface ExistingChat {
  id: string
  subdomain: string
  title: string
  description: string
  authType: 'public' | 'password' | 'email'
  allowedEmails: string[]
  outputConfigs: Array<{ blockId: string; path: string }>
  customizations?: {
    welcomeMessage?: string
  }
  isActive: boolean
}

export function ChatDeploy({
  workflowId,
  deploymentInfo,
  onChatExistsChange,
  chatSubmitting,
  setChatSubmitting,
  onValidationChange,
  onPreDeployWorkflow,
  showDeleteConfirmation: externalShowDeleteConfirmation,
  setShowDeleteConfirmation: externalSetShowDeleteConfirmation,
  onDeploymentComplete,
}: ChatDeployProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [existingChat, setExistingChat] = useState<ExistingChat | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [internalShowDeleteConfirmation, setInternalShowDeleteConfirmation] = useState(false)
  const [showSuccessView, setShowSuccessView] = useState(false)

  // Use external state for delete confirmation if provided
  const showDeleteConfirmation =
    externalShowDeleteConfirmation !== undefined
      ? externalShowDeleteConfirmation
      : internalShowDeleteConfirmation

  const setShowDeleteConfirmation =
    externalSetShowDeleteConfirmation || setInternalShowDeleteConfirmation

  const { formData, errors, updateField, setError, validateForm, setFormData } = useChatForm()
  const { deployedUrl, deployChat } = useChatDeployment()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubdomainValid, setIsSubdomainValid] = useState(false)
  const isFormValid =
    isSubdomainValid &&
    Boolean(formData.title.trim()) &&
    formData.selectedOutputBlocks.length > 0 &&
    (formData.authType !== 'password' ||
      Boolean(formData.password.trim()) ||
      Boolean(existingChat)) &&
    (formData.authType !== 'email' || formData.emails.length > 0)

  useEffect(() => {
    onValidationChange?.(isFormValid)
  }, [isFormValid, onValidationChange])

  useEffect(() => {
    if (workflowId) {
      fetchExistingChat()
    }
  }, [workflowId])

  const fetchExistingChat = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/workflows/${workflowId}/chat/status`)

      if (response.ok) {
        const data = await response.json()

        if (data.isDeployed && data.deployment) {
          const detailResponse = await fetch(`/api/chat/edit/${data.deployment.id}`)

          if (detailResponse.ok) {
            const chatDetail = await detailResponse.json()
            setExistingChat(chatDetail)

            setFormData({
              subdomain: chatDetail.subdomain || '',
              title: chatDetail.title || '',
              description: chatDetail.description || '',
              authType: chatDetail.authType || 'public',
              password: '',
              emails: Array.isArray(chatDetail.allowedEmails) ? [...chatDetail.allowedEmails] : [],
              welcomeMessage:
                chatDetail.customizations?.welcomeMessage || 'Hi there! How can I help you today?',
              selectedOutputBlocks: Array.isArray(chatDetail.outputConfigs)
                ? chatDetail.outputConfigs.map(
                    (config: { blockId: string; path: string }) =>
                      `${config.blockId}_${config.path}`
                  )
                : [],
            })

            // Set image URL if it exists
            if (chatDetail.customizations?.imageUrl) {
              setImageUrl(chatDetail.customizations.imageUrl)
            }
            setImageUploadError(null)

            onChatExistsChange?.(true)
          }
        } else {
          setExistingChat(null)
          setImageUrl(null)
          setImageUploadError(null)
          onChatExistsChange?.(false)
        }
      }
    } catch (error) {
      logger.error('Error fetching chat status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (chatSubmitting) return

    setChatSubmitting(true)

    try {
      await onPreDeployWorkflow?.()

      if (!validateForm()) {
        setChatSubmitting(false)
        return
      }

      if (!isSubdomainValid && formData.subdomain !== existingChat?.subdomain) {
        setError('subdomain', 'Please wait for subdomain validation to complete')
        setChatSubmitting(false)
        return
      }

      await deployChat(workflowId, formData, deploymentInfo, existingChat?.id, imageUrl)

      onChatExistsChange?.(true)
      setShowSuccessView(true)

      // Fetch the updated chat data immediately after deployment
      // This ensures existingChat is available when switching back to edit mode
      await fetchExistingChat()
    } catch (error: any) {
      if (error.message?.includes('subdomain')) {
        setError('subdomain', error.message)
      } else {
        setError('general', error.message)
      }
    } finally {
      setChatSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingChat || !existingChat.id) return

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/chat/edit/${existingChat.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete chat')
      }

      // Update state
      setExistingChat(null)
      setImageUrl(null)
      setImageUploadError(null)
      onChatExistsChange?.(false)

      // Notify parent of successful deletion
      onDeploymentComplete?.()
    } catch (error: any) {
      logger.error('Failed to delete chat:', error)
      setError('general', error.message || 'An unexpected error occurred while deleting')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (deployedUrl && showSuccessView) {
    return (
      <>
        <div id='chat-deploy-form'>
          <SuccessView
            deployedUrl={deployedUrl}
            existingChat={existingChat}
            onDelete={() => setShowDeleteConfirmation(true)}
            onUpdate={() => setShowSuccessView(false)}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Chat Interface?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove your chat interface at{' '}
                <span className='font-mono text-red-600'>
                  {existingChat?.subdomain}.{getEmailDomain()}
                </span>
                .
                <span className='mt-2 block'>
                  All users will lose access immediately, and this action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className='bg-red-600 hover:bg-red-700'
              >
                {isDeleting ? (
                  <span className='flex items-center'>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Removing...
                  </span>
                ) : (
                  'Remove Chat'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <form
        id='chat-deploy-form'
        ref={formRef}
        onSubmit={handleSubmit}
        className='-mx-1 space-y-4 overflow-y-auto px-1'
      >
        {errors.general && (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <div className='space-y-4'>
          <SubdomainInput
            value={formData.subdomain}
            onChange={(value) => updateField('subdomain', value)}
            originalSubdomain={existingChat?.subdomain || undefined}
            disabled={chatSubmitting}
            onValidationChange={setIsSubdomainValid}
            isEditingExisting={!!existingChat}
          />
          <div className='space-y-2'>
            <Label htmlFor='title' className='font-semibold text-gray-700 text-sm'>
              Agent Name
            </Label>
            <Input
              id='title'
              placeholder='My Smart Assistant'
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
              disabled={chatSubmitting}
              className='border-gray-200 focus:border-primary focus:ring-primary'
            />
            {errors.title && <p className='font-medium text-red-600 text-sm'>{errors.title}</p>}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='description' className='font-semibold text-gray-700 text-sm'>
              Description (Optional)
            </Label>
            <Textarea
              id='description'
              placeholder='A helpful assistant that can answer questions and provide support'
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              disabled={chatSubmitting}
              className='border-gray-200 focus:border-primary focus:ring-primary'
            />
          </div>
          <div className='space-y-2'>
            <Label className='font-semibold text-gray-700 text-sm'>Agent Responses</Label>
            <Card className='border-gray-200 shadow-none'>
              <CardContent className='p-3'>
                <OutputSelect
                  workflowId={workflowId}
                  selectedOutputs={formData.selectedOutputBlocks}
                  onOutputSelect={(values) => updateField('selectedOutputBlocks', values)}
                  placeholder='Choose what your agent will respond with'
                  disabled={chatSubmitting}
                />
              </CardContent>
            </Card>
            {errors.outputBlocks && (
              <p className='font-medium text-red-600 text-sm'>{errors.outputBlocks}</p>
            )}
            <p className='mt-2 text-gray-600 text-xs'>
              Select which outputs from your workflow will be shown to users
            </p>
          </div>

          <AuthSelector
            authType={formData.authType}
            password={formData.password}
            emails={formData.emails}
            onAuthTypeChange={(type) => updateField('authType', type)}
            onPasswordChange={(password) => updateField('password', password)}
            onEmailsChange={(emails) => updateField('emails', emails)}
            disabled={chatSubmitting}
            isExistingChat={!!existingChat}
            error={errors.password || errors.emails}
          />
          <div className='space-y-2'>
            <Label htmlFor='welcomeMessage' className='font-semibold text-gray-700 text-sm'>
              Welcome Message
            </Label>
            <Textarea
              id='welcomeMessage'
              placeholder='Hi! I&apos;m here to help you. What can I assist you with today?'
              value={formData.welcomeMessage}
              onChange={(e) => updateField('welcomeMessage', e.target.value)}
              rows={3}
              disabled={chatSubmitting}
              className='border-gray-200 focus:border-primary focus:ring-primary'
            />
            <p className='text-gray-600 text-xs'>
              This greeting will be the first thing users see when they start chatting
            </p>
          </div>

          {/* Image Upload Section */}
          <div className='space-y-2'>
            <Label className='font-semibold text-gray-700 text-sm'>Agent Avatar</Label>
            <ImageUpload
              value={imageUrl}
              onUpload={(url) => {
                setImageUrl(url)
                setImageUploadError(null) // Clear error on successful upload
              }}
              onError={setImageUploadError}
              onUploadStart={setIsImageUploading}
              disabled={chatSubmitting}
              uploadToServer={true}
              height='h-32'
              hideHeader={true}
            />
            {imageUploadError && (
              <p className='font-medium text-red-600 text-sm'>{imageUploadError}</p>
            )}
            {!imageUrl && !isImageUploading && (
              <p className='text-gray-600 text-xs'>
                Upload an avatar image for your agent (PNG, JPEG - max 5MB)
              </p>
            )}
          </div>

          {/* Hidden delete trigger button for modal footer */}
          <button
            type='button'
            data-delete-trigger
            onClick={() => setShowDeleteConfirmation(true)}
            className='hidden'
            title='Delete chat deployment'
          />
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Chat Interface?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your chat interface at{' '}
              <span className='font-mono text-red-600'>
                {existingChat?.subdomain}.{getEmailDomain()}
              </span>
              .
              <span className='mt-2 block'>
                All users will lose access immediately, and this action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? (
                <span className='flex items-center'>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Removing...
                </span>
              ) : (
                'Remove Chat'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className='space-y-4 py-3'>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-10 w-full' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-20' />
        <Skeleton className='h-10 w-full' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-24 w-full' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-32 w-full' />
      </div>
    </div>
  )
}
