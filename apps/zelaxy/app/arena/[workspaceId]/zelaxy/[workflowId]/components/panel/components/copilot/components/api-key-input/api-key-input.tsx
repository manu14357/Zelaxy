'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Key, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLLMSelectionStore } from '@/stores/llm-selection/store'

interface ApiKeyInputProps {
  providerId: string
  providerName: string
}

export function ApiKeyInput({ providerId, providerName }: ApiKeyInputProps) {
  const { getApiKey, setApiKey, clearApiKey } = useLLMSelectionStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Load saved API key on mount and when provider changes
  useEffect(() => {
    const savedApiKey = getApiKey(providerId)
    setInputValue(savedApiKey || '')
  }, [providerId, getApiKey])

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(providerId, inputValue.trim())
    }
  }

  const handleClear = () => {
    setInputValue('')
    clearApiKey(providerId)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  const hasApiKey = !!getApiKey(providerId)
  const hasUnsavedChanges = inputValue !== (getApiKey(providerId) || '')

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Key className='h-3 w-3 text-muted-foreground' />
        <label
          htmlFor={`api-key-${providerId}`}
          className='font-medium text-muted-foreground text-xs'
        >
          {providerName} API Key {!hasApiKey && '(Optional)'}
        </label>
        {hasApiKey && (
          <div className='flex items-center gap-1'>
            <div className='h-1.5 w-1.5 rounded-full bg-green-500' />
            <span className='text-green-600 text-xs dark:text-green-400'>Configured</span>
          </div>
        )}
      </div>

      <div className='flex items-center gap-2'>
        <div className='relative flex-1'>
          <Input
            id={`api-key-${providerId}`}
            type={showApiKey ? 'text' : 'password'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={hasApiKey ? '••••••••••••••••' : `Enter your ${providerName} API key`}
            className='h-8 pr-8 text-xs'
          />
          <button
            type='button'
            onClick={() => setShowApiKey(!showApiKey)}
            className='-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground hover:text-foreground'
          >
            {showApiKey ? <EyeOff className='h-3 w-3' /> : <Eye className='h-3 w-3' />}
          </button>
        </div>

        {hasUnsavedChanges && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size='sm' variant='outline' onClick={handleSave} className='h-8 px-2'>
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save API key</TooltipContent>
          </Tooltip>
        )}

        {hasApiKey && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleClear}
                className='h-8 px-2 text-muted-foreground hover:text-destructive'
              >
                <X className='h-3 w-3' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear API key</TooltipContent>
          </Tooltip>
        )}
      </div>

      {hasApiKey && (
        <p className='text-muted-foreground text-xs'>
          Using your custom API key for {providerName}
        </p>
      )}

      {!hasApiKey && (
        <p className='text-muted-foreground text-xs'>
          Leave empty to use system default (if configured)
        </p>
      )}
    </div>
  )
}
