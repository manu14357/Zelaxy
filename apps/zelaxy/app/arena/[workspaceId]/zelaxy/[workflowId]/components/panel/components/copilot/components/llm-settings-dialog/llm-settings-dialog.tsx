'use client'

import { useEffect, useState } from 'react'
import { Check, Eye, EyeOff, Key } from 'lucide-react'
import {
  AnthropicIcon,
  BasetenIcon,
  BedrockIcon,
  CerebrasIcon,
  DeepseekIcon,
  FireworksIcon,
  GeminiIcon,
  GroqIcon,
  LiteLLMIcon,
  MiMoIcon,
  MistralIcon,
  NvidiaIcon,
  OllamaIcon,
  OpenAIIcon,
  OpenRouterIcon,
  TogetherIcon,
  VLLMIcon,
  xAIIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getProviderModels } from '@/providers/models'
import { useLLMSelectionStore } from '@/stores/llm-selection/store'

interface LLMProvider {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  models: string[]
}

// Models sourced from the central registry (providers/models.ts) — no stale/fake ids.
const LLM_PROVIDERS: LLMProvider[] = [
  { id: 'nvidia', name: 'NVIDIA', icon: NvidiaIcon, models: getProviderModels('nvidia') },
  { id: 'openai', name: 'OpenAI', icon: OpenAIIcon, models: getProviderModels('openai') },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: AnthropicIcon,
    models: getProviderModels('anthropic'),
  },
  { id: 'google', name: 'Google', icon: GeminiIcon, models: getProviderModels('google') },
  { id: 'groq', name: 'Groq', icon: GroqIcon, models: getProviderModels('groq') },
  { id: 'deepseek', name: 'DeepSeek', icon: DeepseekIcon, models: getProviderModels('deepseek') },
  { id: 'xai', name: 'xAI', icon: xAIIcon, models: getProviderModels('xai') },
  { id: 'cerebras', name: 'Cerebras', icon: CerebrasIcon, models: getProviderModels('cerebras') },
  { id: 'mimo', name: 'MiMo', icon: MiMoIcon, models: getProviderModels('mimo') },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: OpenRouterIcon,
    models: getProviderModels('openrouter'),
  },
  { id: 'together', name: 'Together', icon: TogetherIcon, models: getProviderModels('together') },
  {
    id: 'fireworks',
    name: 'Fireworks',
    icon: FireworksIcon,
    models: getProviderModels('fireworks'),
  },
  { id: 'mistral', name: 'Mistral', icon: MistralIcon, models: getProviderModels('mistral') },
  { id: 'vllm', name: 'vLLM', icon: VLLMIcon, models: getProviderModels('vllm') },
  { id: 'litellm', name: 'LiteLLM', icon: LiteLLMIcon, models: getProviderModels('litellm') },
  { id: 'baseten', name: 'Baseten', icon: BasetenIcon, models: getProviderModels('baseten') },
  {
    id: 'ollama-cloud',
    name: 'Ollama Cloud',
    icon: OllamaIcon,
    models: getProviderModels('ollama-cloud'),
  },
  { id: 'bedrock', name: 'AWS Bedrock', icon: BedrockIcon, models: getProviderModels('bedrock') },
  { id: 'ollama', name: 'Ollama', icon: OllamaIcon, models: ['llama3.2', 'qwen2.5'] },
]

interface LLMSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LLMSettingsDialog({ open, onOpenChange }: LLMSettingsDialogProps) {
  const {
    selectedProvider,
    selectedModel,
    setProvider,
    setModel,
    getApiKey,
    setApiKey,
    clearApiKey,
  } = useLLMSelectionStore()

  const [localProvider, setLocalProvider] = useState(selectedProvider)
  const [localModel, setLocalModel] = useState(selectedModel)
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const currentProvider = LLM_PROVIDERS.find((p) => p.id === localProvider) || LLM_PROVIDERS[0]
  const hasApiKey = !!getApiKey(localProvider)

  // Load saved API key when provider changes
  useEffect(() => {
    const savedApiKey = getApiKey(localProvider)
    setApiKeyValue(savedApiKey || '')
  }, [localProvider, getApiKey])

  // Sync with store when dialog opens
  useEffect(() => {
    if (open) {
      setLocalProvider(selectedProvider)
      setLocalModel(selectedModel)
      setHasChanges(false)
    }
  }, [open, selectedProvider, selectedModel])

  // Track changes
  useEffect(() => {
    const providerChanged = localProvider !== selectedProvider
    const modelChanged = localModel !== selectedModel
    const apiKeyChanged = apiKeyValue !== (getApiKey(localProvider) || '')
    setHasChanges(providerChanged || modelChanged || apiKeyChanged)
  }, [localProvider, localModel, apiKeyValue, selectedProvider, selectedModel, getApiKey])

  const handleProviderChange = (providerId: string) => {
    setLocalProvider(providerId)
    const provider = LLM_PROVIDERS.find((p) => p.id === providerId)
    if (provider) {
      setLocalModel(provider.models[0])
    }
  }

  const handleSave = () => {
    // Save provider and model
    setProvider(localProvider)
    setModel(localModel)

    // Save API key if provided
    if (apiKeyValue.trim()) {
      setApiKey(localProvider, apiKeyValue.trim())
    }

    setHasChanges(false)
    onOpenChange(false)
  }

  const handleClearApiKey = () => {
    setApiKeyValue('')
    clearApiKey(localProvider)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>LLM Provider Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider, model, and API key preferences
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Provider Selection */}
          <div className='space-y-2'>
            <Label htmlFor='provider'>Provider</Label>
            <Select value={localProvider} onValueChange={handleProviderChange}>
              <SelectTrigger id='provider'>
                <SelectValue>
                  <div className='flex items-center gap-2'>
                    {currentProvider.icon && <currentProvider.icon className='h-4 w-4' />}
                    <span>{currentProvider.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LLM_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className='flex items-center gap-2'>
                      <provider.icon className='h-4 w-4' />
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className='space-y-2'>
            <Label htmlFor='model'>Model</Label>
            <Select value={localModel} onValueChange={setLocalModel}>
              <SelectTrigger id='model'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Input */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='apiKey'>API Key (Optional)</Label>
              {hasApiKey && (
                <div className='flex items-center gap-1'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-green-600 text-xs dark:text-green-400'>Configured</span>
                </div>
              )}
            </div>
            <div className='relative'>
              <Input
                id='apiKey'
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder={
                  hasApiKey ? '••••••••••••••••' : `Enter your ${currentProvider.name} API key`
                }
                className='pr-20'
              />
              <div className='-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setShowApiKey(!showApiKey)}
                  className='p-1 text-muted-foreground hover:text-foreground'
                >
                  {showApiKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
                {hasApiKey && (
                  <button
                    type='button'
                    onClick={handleClearApiKey}
                    className='p-1 text-muted-foreground hover:text-destructive'
                    title='Clear API key'
                  >
                    <Key className='h-4 w-4' />
                  </button>
                )}
              </div>
            </div>
            <p className='text-muted-foreground text-xs'>
              {hasApiKey
                ? `Using your custom API key for ${currentProvider.name}`
                : 'Leave empty to use system default (if configured)'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='flex items-center justify-between border-t pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Check className='mr-2 h-4 w-4' />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
