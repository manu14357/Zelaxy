'use client'

import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import imageCompression from 'browser-image-compression'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Rocket,
  Sparkles,
  Star,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('Help')

// Define form schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Description is required'),
  type: z.enum(['issue', 'suggestion', 'enhancement', 'question', 'general'], {
    required_error: 'Please select a request category',
  }),
})

type FormValues = z.infer<typeof formSchema>

// Increased maximum upload size to 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024
// Target size after compression (2MB)
const TARGET_SIZE_MB = 2
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

interface ImageWithPreview extends File {
  preview: string
}

export function Help() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [images, setImages] = useState<ImageWithPreview[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      subject: '',
      message: '',
      type: 'general',
    },
    mode: 'onChange',
  })

  // Set default value for type on component mount
  useEffect(() => {
    setValue('type', 'general')
  }, [setValue])

  // Scroll to top when success message appears
  useEffect(() => {
    if (submitStatus === 'success' && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [submitStatus])

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview))
    }
  }, [images])

  // Scroll to bottom when images are added
  useEffect(() => {
    if (images.length > 0 && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        })
      }, 100)
    }
  }, [images.length])

  const compressImage = async (file: File): Promise<File> => {
    // Skip compression for small files or GIFs (which don't compress well)
    if (file.size < TARGET_SIZE_MB * 1024 * 1024 || file.type === 'image/gif') {
      return file
    }

    const options = {
      maxSizeMB: TARGET_SIZE_MB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
      initialQuality: 0.8,
      alwaysKeepResolution: true,
    }

    try {
      const compressedFile = await imageCompression(file, options)

      return new File([compressedFile], file.name, {
        type: file.type,
        lastModified: Date.now(),
      })
    } catch (error) {
      logger.warn('Image compression failed, using original file:', { error })
      return file
    }
  }

  const processFiles = async (files: FileList | File[]) => {
    setImageError(null)

    if (!files || files.length === 0) return

    setIsProcessing(true)

    try {
      const newImages: ImageWithPreview[] = []
      let hasError = false

      for (const file of Array.from(files)) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          setImageError(`File ${file.name} is too large. Maximum size is 20MB.`)
          hasError = true
          continue
        }

        // Check file type
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          setImageError(
            `File ${file.name} has an unsupported format. Please use JPEG, PNG, WebP, or GIF.`
          )
          hasError = true
          continue
        }

        // Compress the image
        const compressedFile = await compressImage(file)

        // Create preview URL
        const imageWithPreview = Object.assign(compressedFile, {
          preview: URL.createObjectURL(compressedFile),
        }) as ImageWithPreview

        newImages.push(imageWithPreview)
      }

      if (!hasError && newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages])
      }
    } catch (error) {
      logger.error('Error processing images:', { error })
      setImageError('An error occurred while processing images. Please try again.')
    } finally {
      setIsProcessing(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files)
    }
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      // Revoke the URL to avoid memory leaks
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Create FormData to handle file uploads
      const formData = new FormData()

      // Add form fields
      formData.append('email', data.email)
      formData.append('subject', data.subject)
      formData.append('message', data.message)
      formData.append('type', data.type)

      // Add images
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })

      const response = await fetch('/api/help', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit help request')
      }

      setSubmitStatus('success')
      reset()

      // Clean up image previews
      images.forEach((image) => URL.revokeObjectURL(image.preview))
      setImages([])
    } catch (error) {
      logger.error('Error submitting help request:', { error })
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='border-b bg-background'>
        <div className='container mx-auto max-w-6xl px-4 py-4 lg:px-6 lg:py-6'>
          <div className='flex items-center gap-3 lg:gap-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.back()}
              className='h-8 w-8 flex-shrink-0 p-0 hover:bg-muted lg:h-9 lg:w-9'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div className='flex min-w-0 items-center gap-3 lg:gap-4'>
              <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center border bg-background lg:h-12 lg:w-12'>
                <Sparkles className='h-5 w-5 text-foreground lg:h-6 lg:w-6' />
              </div>
              <div className='min-w-0'>
                <h1 className='font-semibold text-foreground text-lg lg:text-2xl'>
                  Help & Support
                </h1>
                <p className='hidden text-muted-foreground text-sm sm:block'>
                  Documentation, guides, and support for Zelaxy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='lg:flex lg:h-[calc(100vh-140px)]'>
        {/* Mobile Sticky Sidebar */}
        <div className='sticky top-0 z-10 w-full border-b bg-background p-4 lg:hidden'>
          <div>
            <h2 className='mb-4 font-medium text-base text-foreground'>Quick Resources</h2>
            <div className='grid grid-cols-3 gap-3'>
              <div className='flex cursor-pointer items-center gap-2 border p-3 transition-colors hover:bg-muted/50'>
                <Globe className='h-4 w-4 flex-shrink-0 text-foreground' />
                <div className='min-w-0'>
                  <div className='font-medium text-xs'>Docs</div>
                </div>
              </div>

              <div className='flex cursor-pointer items-center gap-2 border p-3 transition-colors hover:bg-muted/50'>
                <Star className='h-4 w-4 flex-shrink-0 text-foreground' />
                <div className='min-w-0'>
                  <div className='font-medium text-xs'>FAQ</div>
                </div>
              </div>

              <div className='flex cursor-pointer items-center gap-2 border p-3 transition-colors hover:bg-muted/50'>
                <Rocket className='h-4 w-4 flex-shrink-0 text-foreground' />
                <div className='min-w-0'>
                  <div className='font-medium text-xs'>Tutorials</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className='hidden bg-background lg:block lg:w-80 lg:flex-shrink-0 lg:border-r lg:p-6'>
          <div className='space-y-8'>
            {/* Quick Resources */}
            <div>
              <h2 className='mb-6 font-medium text-foreground text-lg'>Resources</h2>
              <div className='space-y-3'>
                <div className='flex cursor-pointer items-center gap-3 border p-4 transition-colors hover:bg-muted/50'>
                  <Globe className='h-5 w-5 flex-shrink-0 text-foreground' />
                  <div className='min-w-0'>
                    <div className='font-medium text-sm'>Documentation</div>
                    <div className='text-muted-foreground text-xs'>Complete guides</div>
                  </div>
                </div>

                <div className='flex cursor-pointer items-center gap-3 border p-4 transition-colors hover:bg-muted/50'>
                  <Star className='h-5 w-5 flex-shrink-0 text-foreground' />
                  <div className='min-w-0'>
                    <div className='font-medium text-sm'>FAQ</div>
                    <div className='text-muted-foreground text-xs'>Common questions</div>
                  </div>
                </div>

                <div className='flex cursor-pointer items-center gap-3 border p-4 transition-colors hover:bg-muted/50'>
                  <Rocket className='h-5 w-5 flex-shrink-0 text-foreground' />
                  <div className='min-w-0'>
                    <div className='font-medium text-sm'>Tutorials</div>
                    <div className='text-muted-foreground text-xs'>Step-by-step guides</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div>
              <h3 className='mb-4 font-medium text-muted-foreground text-sm uppercase tracking-wide'>
                Topics
              </h3>
              <div className='space-y-2'>
                <div className='cursor-pointer border-transparent border-l-2 py-2 pl-3 text-sm transition-colors hover:border-foreground hover:text-foreground'>
                  Getting Started
                </div>
                <div className='cursor-pointer border-transparent border-l-2 py-2 pl-3 text-sm transition-colors hover:border-foreground hover:text-foreground'>
                  Workflow Creation
                </div>
                <div className='cursor-pointer border-transparent border-l-2 py-2 pl-3 text-sm transition-colors hover:border-foreground hover:text-foreground'>
                  Node Configuration
                </div>
                <div className='cursor-pointer border-transparent border-l-2 py-2 pl-3 text-sm transition-colors hover:border-foreground hover:text-foreground'>
                  API Integration
                </div>
                <div className='cursor-pointer border-transparent border-l-2 py-2 pl-3 text-sm transition-colors hover:border-foreground hover:text-foreground'>
                  Troubleshooting
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className='flex-1 lg:overflow-y-auto'>
          <div className='p-4 lg:p-6'>
            {/* Contact Form */}
            <div className='mx-auto max-w-4xl'>
              <div className='border bg-background'>
                <div className='border-b p-4 lg:p-6'>
                  <h2 className='font-medium text-foreground text-lg lg:text-xl'>
                    Contact Support
                  </h2>
                  <p className='mt-1 text-muted-foreground text-sm'>
                    Submit a support request and our team will get back to you
                  </p>
                </div>

                <div className='p-4 lg:p-6'>
                  <div ref={scrollContainerRef} className='space-y-6 lg:space-y-8'>
                    {submitStatus === 'success' ? (
                      <div className='border border-green-200 bg-green-50 p-3 lg:p-4 dark:border-green-800 dark:bg-green-950/20'>
                        <div className='flex items-start gap-3'>
                          <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400' />
                          <div>
                            <div className='font-medium text-green-600 text-sm lg:text-base dark:text-green-400'>
                              Request Submitted
                            </div>
                            <div className='text-green-600 text-sm dark:text-green-400'>
                              We'll get back to you via email shortly
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : submitStatus === 'error' ? (
                      <div className='border border-red-200 bg-red-50 p-3 lg:p-4 dark:border-red-800 dark:bg-red-950/20'>
                        <div className='flex items-start gap-3'>
                          <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400' />
                          <div>
                            <div className='font-medium text-red-600 text-sm lg:text-base dark:text-red-400'>
                              Submission Failed
                            </div>
                            <div className='text-red-600 text-sm dark:text-red-400'>
                              {errorMessage || 'Please try again later'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 lg:space-y-8'>
                      <div className='grid gap-4 sm:grid-cols-2 lg:gap-6'>
                        <div className='space-y-2'>
                          <Label htmlFor='type' className='font-medium text-sm'>
                            Category
                          </Label>
                          <Select
                            defaultValue='general'
                            onValueChange={(value) => setValue('type', value as any)}
                          >
                            <SelectTrigger
                              id='type'
                              className={`h-10 border-input bg-background lg:h-10 ${errors.type ? 'border-red-500' : ''}`}
                            >
                              <SelectValue placeholder='Select category' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='issue'>Issue Report</SelectItem>
                              <SelectItem value='suggestion'>Suggestion</SelectItem>
                              <SelectItem value='enhancement'>Enhancement Request</SelectItem>
                              <SelectItem value='question'>Question</SelectItem>
                              <SelectItem value='general'>General Inquiry</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.type && (
                            <p className='text-red-500 text-sm'>{errors.type.message}</p>
                          )}
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='email' className='font-medium text-sm'>
                            Email
                          </Label>
                          <Input
                            id='email'
                            placeholder='your.email@example.com'
                            {...register('email')}
                            className={`h-10 border-input bg-background lg:h-10 ${errors.email ? 'border-red-500' : ''}`}
                          />
                          {errors.email && (
                            <p className='text-red-500 text-sm'>{errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='subject' className='font-medium text-sm'>
                          Title
                        </Label>
                        <Input
                          id='subject'
                          placeholder='Brief title for your request'
                          {...register('subject')}
                          className={`h-10 border-input bg-background lg:h-10 ${errors.subject ? 'border-red-500' : ''}`}
                        />
                        {errors.subject && (
                          <p className='text-red-500 text-sm'>{errors.subject.message}</p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='message' className='font-medium text-sm'>
                          Description
                        </Label>
                        <Textarea
                          id='message'
                          placeholder='Provide detailed information about your request...'
                          rows={6}
                          className={`resize-none border-input bg-background ${errors.message ? 'border-red-500' : ''}`}
                          {...register('message')}
                        />
                        {errors.message && (
                          <p className='text-red-500 text-sm'>{errors.message.message}</p>
                        )}
                      </div>

                      {/* Attachments Section */}
                      <div className='space-y-3 lg:space-y-4'>
                        {/* <Label className="text-sm font-medium">Attachments (Optional)</Label> */}
                        <div
                          ref={dropZoneRef}
                          onDragEnter={handleDragEnter}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed p-6 text-center transition-colors lg:p-8 ${
                            isDragging
                              ? 'border-foreground bg-muted/20'
                              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type='file'
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            onChange={handleFileChange}
                            className='hidden'
                            multiple
                            aria-label='Upload support images'
                          />
                          <div className='space-y-3 lg:space-y-4'>
                            <Upload className='mx-auto h-6 w-6 text-muted-foreground lg:h-8 lg:w-8' />
                            <div className='space-y-2'>
                              <Button
                                type='button'
                                variant='outline'
                                onClick={() => fileInputRef.current?.click()}
                                className='h-9 lg:h-10'
                              >
                                Choose Files
                              </Button>
                              <p className='text-muted-foreground text-xs lg:text-sm'>
                                Drop images here or click to browse
                                <br />
                                Maximum 20MB per file
                              </p>
                            </div>
                          </div>
                        </div>
                        {imageError && <p className='text-red-500 text-sm'>{imageError}</p>}
                        {isProcessing && (
                          <p className='text-muted-foreground text-sm'>Processing images...</p>
                        )}
                      </div>

                      {/* Attachment Preview Section */}
                      {images.length > 0 && (
                        <div className='space-y-3 lg:space-y-4'>
                          <Label className='font-medium text-sm'>Attached Files</Label>
                          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4'>
                            {images.map((image, index) => (
                              <div key={index} className='group relative border bg-background'>
                                <div className='relative aspect-video'>
                                  <Image
                                    src={image.preview}
                                    alt={`Preview ${index + 1}`}
                                    fill
                                    className='object-cover'
                                  />
                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='destructive'
                                    onClick={() => removeImage(index)}
                                    className='absolute top-1 right-1 h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100 lg:top-2 lg:right-2 lg:h-6 lg:w-6'
                                  >
                                    <X className='h-3 w-3' />
                                  </Button>
                                </div>
                                <div className='border-t p-1.5 lg:p-2'>
                                  <div className='truncate text-muted-foreground text-xs'>
                                    {image.name}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className='flex flex-col justify-end gap-3 pt-4 sm:flex-row lg:gap-4 lg:pt-6'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => router.back()}
                          className='order-2 h-10 w-full sm:order-1 sm:w-auto'
                        >
                          Cancel
                        </Button>
                        <Button
                          type='submit'
                          disabled={isSubmitting || isProcessing}
                          className='order-1 h-10 w-full bg-foreground text-background hover:bg-foreground/90 sm:order-2 sm:w-auto'
                        >
                          <Zap className='mr-2 h-4 w-4' />
                          {isSubmitting ? 'Submitting...' : 'Send Request'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
