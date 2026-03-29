import { useEffect } from 'react'
import { Input, Label } from '@/components/ui'
import { getEmailDomain } from '@/lib/urls/utils'
import { cn } from '@/lib/utils'
import { useSubdomainValidation } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/control-bar/components/deploy-modal/components/chat-deploy/hooks/use-subdomain-validation'

interface SubdomainInputProps {
  value: string
  onChange: (value: string) => void
  originalSubdomain?: string
  disabled?: boolean
  onValidationChange?: (isValid: boolean) => void
  isEditingExisting?: boolean
}

const getDomainSuffix = (() => {
  const suffix = `.${getEmailDomain()}`
  return () => suffix
})()

export function SubdomainInput({
  value,
  onChange,
  originalSubdomain,
  disabled = false,
  onValidationChange,
  isEditingExisting = false,
}: SubdomainInputProps) {
  const { isChecking, error, isValid } = useSubdomainValidation(
    value,
    originalSubdomain,
    isEditingExisting
  )

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  const handleChange = (newValue: string) => {
    const lowercaseValue = newValue.toLowerCase()
    onChange(lowercaseValue)
  }

  return (
    <div className='space-y-3'>
      <Label htmlFor='subdomain' className='font-semibold text-foreground text-sm'>
        Custom URL Path
      </Label>
      <div
        className={cn(
          'relative flex items-center overflow-hidden rounded-lg border transition-all duration-200',
          'border-border/50 bg-background',
          'ring-offset-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2',
          'focus-within:border-primary/50',
          error &&
            'border-destructive/50 focus-within:border-destructive/70 focus-within:ring-destructive/20'
        )}
      >
        <Input
          id='subdomain'
          placeholder='my-awesome-agent'
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          required
          disabled={disabled}
          className={cn(
            'rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-muted-foreground/60',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'text-destructive'
          )}
        />
        <div
          className={cn(
            'flex h-10 items-center whitespace-nowrap border-l px-4 font-medium text-sm transition-colors',
            'border-border/50 bg-muted/30 text-muted-foreground',
            'dark:bg-muted/20'
          )}
        >
          {getDomainSuffix()}
        </div>
        {isChecking && (
          <div className='absolute right-20 flex items-center'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary' />
          </div>
        )}
      </div>
      {error && (
        <p className='mt-2 flex items-center gap-1.5 font-medium text-destructive text-sm'>
          <svg className='h-4 w-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
