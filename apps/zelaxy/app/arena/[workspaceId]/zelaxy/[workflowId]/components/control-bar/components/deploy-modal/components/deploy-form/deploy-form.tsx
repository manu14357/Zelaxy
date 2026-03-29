'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Loader2, Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('DeployForm')

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsed?: string
  createdAt: string
  expiresAt?: string
}

// Form schema for API key selection or creation
const deployFormSchema = z.object({
  apiKey: z.string().min(1, 'Please select an API key'),
  newKeyName: z.string().optional(),
})

type DeployFormValues = z.infer<typeof deployFormSchema>

interface DeployFormProps {
  apiKeys: ApiKey[]
  keysLoaded: boolean
  endpointUrl: string
  workflowId: string
  onSubmit: (data: DeployFormValues) => void
  getInputFormatExample: () => string
  onApiKeyCreated?: () => void
  // Optional id to bind an external submit button via the `form` attribute
  formId?: string
}

export function DeployForm({
  apiKeys,
  keysLoaded,
  endpointUrl,
  workflowId,
  onSubmit,
  getInputFormatExample,
  onApiKeyCreated,
  formId,
}: DeployFormProps) {
  // State
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Initialize form with react-hook-form
  const form = useForm<DeployFormValues>({
    resolver: zodResolver(deployFormSchema),
    defaultValues: {
      apiKey: apiKeys.length > 0 ? apiKeys[0].key : '',
      newKeyName: '',
    },
  })

  // Update on dependency changes beyond the initial load
  useEffect(() => {
    if (keysLoaded && apiKeys.length > 0) {
      // Ensure that form has a value after loading
      form.setValue('apiKey', form.getValues().apiKey || apiKeys[0].key)
    }
  }, [keysLoaded, apiKeys, form])

  // Generate a new API key
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/users/me/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create new API key')
      }

      const data = await response.json()
      // Show the new key dialog with the API key (only shown once)
      setNewKey(data.key)
      setShowNewKeyDialog(true)
      // Reset form
      setNewKeyName('')
      // Close the create dialog
      setIsCreatingKey(false)

      // Update the form with the new key
      form.setValue('apiKey', data.key.key)

      // Trigger a refresh of the keys list in the parent component
      if (onApiKeyCreated) {
        onApiKeyCreated()
      }
    } catch (error) {
      logger.error('Error creating API key:', { error })
    } finally {
      setIsCreating(false)
    }
  }

  // Copy API key to clipboard
  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(form.getValues())
        }}
        className='space-y-5'
      >
        {/* API Key selection */}
        <FormField
          control={form.control}
          name='apiKey'
          render={({ field }) => (
            <FormItem className='space-y-2'>
              <div className='flex items-center justify-between'>
                <FormLabel className='font-medium text-[13px] text-foreground/70 uppercase tracking-wider'>
                  API Key
                </FormLabel>
                <button
                  type='button'
                  className='flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-[12px] text-foreground/60 transition-colors duration-150 hover:bg-muted hover:text-foreground'
                  onClick={() => setIsCreatingKey(true)}
                >
                  <Plus className='h-3 w-3' />
                  <span>Create new</span>
                </button>
              </div>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger
                    className={`h-11 rounded-xl border-border/50 bg-muted/30 text-[13px] transition-all duration-150 hover:border-border focus:ring-2 focus:ring-foreground/10 ${!keysLoaded ? 'opacity-70' : ''}`}
                  >
                    {!keysLoaded ? (
                      <div className='flex items-center space-x-2'>
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        <span className='text-muted-foreground'>Loading API keys...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder='Select an API key' />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent align='start' className='rounded-xl border-border/50 py-1'>
                  {apiKeys.map((apiKey) => (
                    <SelectItem
                      key={apiKey.id}
                      value={apiKey.key}
                      className='my-0.5 cursor-pointer rounded-lg px-3 py-2.5 text-[13px] data-[state=checked]:bg-muted [&>span.absolute]:hidden'
                    >
                      <div className='flex w-full items-center'>
                        <div className='flex w-full items-center justify-between'>
                          <span className='mr-2 truncate'>{apiKey.name}</span>
                          <span className='flex-shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground'>
                            {apiKey.key.slice(-5)}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Create API Key Dialog */}
        <Dialog open={isCreatingKey} onOpenChange={setIsCreatingKey}>
          <DialogContent
            className='flex flex-col gap-0 rounded-2xl p-0 sm:max-w-md'
            hideCloseButton
          >
            <DialogHeader className='border-border/40 border-b px-6 py-5'>
              <div className='flex items-center justify-between'>
                <DialogTitle className='font-semibold text-[17px] tracking-tight'>
                  Create API Key
                </DialogTitle>
                <button
                  className='flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-95'
                  onClick={() => setIsCreatingKey(false)}
                >
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Close</span>
                </button>
              </div>
            </DialogHeader>

            <div className='flex-1 px-6 pt-5 pb-6'>
              <div className='space-y-2'>
                <Label htmlFor='keyName' className='font-medium text-[13px] text-foreground/70'>
                  Key Name
                </Label>
                <Input
                  id='keyName'
                  placeholder='e.g., Development, Production'
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className='h-11 rounded-xl border-border/50 bg-muted/30 text-[13px] transition-all duration-150 focus:ring-2 focus:ring-foreground/10'
                />
              </div>
            </div>

            <div className='flex justify-end gap-2 border-border/40 border-t px-6 py-4'>
              <button
                onClick={() => setIsCreatingKey(false)}
                className='rounded-lg px-4 py-2 font-medium text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || isCreating}
                className='flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 font-medium text-[13px] text-background shadow-sm transition-all duration-150 hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-40'
              >
                {isCreating ? (
                  <>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New API Key Dialog */}
        <Dialog
          open={showNewKeyDialog}
          onOpenChange={(open) => {
            setShowNewKeyDialog(open)
            if (!open) setNewKey(null)
          }}
        >
          <DialogContent
            className='flex flex-col gap-0 rounded-2xl p-0 sm:max-w-md'
            hideCloseButton
          >
            <DialogHeader className='border-border/40 border-b px-6 py-5'>
              <div className='flex items-center justify-between'>
                <DialogTitle className='font-semibold text-[17px] tracking-tight'>
                  API Key Created
                </DialogTitle>
                <button
                  className='flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-95'
                  onClick={() => {
                    setShowNewKeyDialog(false)
                    setNewKey(null)
                  }}
                >
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Close</span>
                </button>
              </div>
              <DialogDescription className='pt-1 text-[13px] text-muted-foreground'>
                Save this key now. You won't be able to see it again.
              </DialogDescription>
            </DialogHeader>

            {newKey && (
              <div className='flex-1 px-6 pt-5 pb-6'>
                <div className='space-y-2'>
                  <Label className='font-medium text-[13px] text-foreground/70'>Your API Key</Label>
                  <div className='relative'>
                    <Input
                      readOnly
                      value={newKey.key}
                      className='h-11 rounded-xl border-border/50 bg-muted/30 pr-10 font-mono text-[13px]'
                    />
                    <button
                      className='-translate-y-1/2 absolute top-1/2 right-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-95'
                      onClick={() => copyToClipboard(newKey.key)}
                    >
                      {copySuccess ? (
                        <Check className='h-3.5 w-3.5 text-emerald-500' />
                      ) : (
                        <Copy className='h-3.5 w-3.5' />
                      )}
                      <span className='sr-only'>Copy</span>
                    </button>
                  </div>
                  <p className='mt-1 text-[12px] text-muted-foreground/70'>
                    For security, the complete key is only shown once.
                  </p>
                </div>
              </div>
            )}

            <div className='flex justify-end border-border/40 border-t px-6 py-4'>
              <button
                onClick={() => {
                  setShowNewKeyDialog(false)
                  setNewKey(null)
                }}
                className='rounded-lg bg-foreground px-4 py-2 font-medium text-[13px] text-background shadow-sm transition-all duration-150 hover:bg-foreground/90 active:scale-[0.98]'
              >
                Done
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  )
}
