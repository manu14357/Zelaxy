'use client'

import { useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  AnthropicIcon,
  BedrockIcon,
  CerebrasIcon,
  DeepseekIcon,
  GeminiIcon,
  GroqIcon,
  LMStudioIcon,
  NvidiaIcon,
  OllamaIcon,
  OpenAIIcon,
  xAIIcon,
} from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getProviderModels } from '@/providers/models'
import { useLLMSelectionStore } from '@/stores/llm-selection/store'
import { ApiKeyInput } from '../api-key-input/api-key-input'

interface LLMProvider {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  models: string[]
  requiresApiKey?: boolean
  description?: string
}

// Models are sourced from the central registry (providers/models.ts) so Agie always offers the
// real, current model set — no stale/fake ids. Local providers (ollama/lmstudio) stay manual.
const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: AnthropicIcon,
    models: getProviderModels('anthropic'),
    requiresApiKey: true,
    description: 'Claude models - default for Agie',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: OpenAIIcon,
    models: getProviderModels('openai'),
    requiresApiKey: true,
    description: 'GPT models',
  },
  {
    id: 'google',
    name: 'Google',
    icon: GeminiIcon,
    models: getProviderModels('google'),
    requiresApiKey: true,
    description: 'Gemini models',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: DeepseekIcon,
    models: getProviderModels('deepseek'),
    requiresApiKey: true,
    description: 'Cost-effective models',
  },
  {
    id: 'xai',
    name: 'xAI',
    icon: xAIIcon,
    models: getProviderModels('xai'),
    requiresApiKey: true,
    description: 'Grok models',
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: GroqIcon,
    models: getProviderModels('groq'),
    requiresApiKey: true,
    description: 'Fast inference',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    icon: CerebrasIcon,
    models: getProviderModels('cerebras'),
    requiresApiKey: true,
    description: 'Fast inference',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    icon: NvidiaIcon,
    models: getProviderModels('nvidia'),
    requiresApiKey: true,
    description: 'Enterprise GPU inference',
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    icon: BedrockIcon,
    models: getProviderModels('bedrock'),
    requiresApiKey: false,
    description: 'AWS Bedrock foundation models',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    icon: OllamaIcon,
    models: ['llama3.2', 'llama3.1', 'qwen2.5', 'mistral', 'codellama', 'deepseek-coder'],
    requiresApiKey: false,
    description: 'Local models - no API key needed',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    icon: LMStudioIcon,
    models: ['local-model'],
    requiresApiKey: false,
    description: 'Local OpenAI-compatible server',
  },
]

interface LLMSelectorProps {
  className?: string
}

export function LLMSelector({ className }: LLMSelectorProps) {
  const { selectedProvider, selectedModel, setProvider, setModel } = useLLMSelectionStore()

  // Debug logging

  const currentProvider = LLM_PROVIDERS.find((p) => p.id === selectedProvider) || LLM_PROVIDERS[0]
  const currentModel = selectedModel || currentProvider.models[0]

  // Debug logging

  // Ensure model is valid for the current provider
  useEffect(() => {
    if (!currentProvider.models.includes(currentModel)) {
      setModel(currentProvider.models[0])
    }
  }, [selectedProvider, currentProvider, currentModel, setModel])

  const handleProviderChange = (providerId: string) => {
    const provider = LLM_PROVIDERS.find((p) => p.id === providerId)
    if (provider) {
      setProvider(providerId)
      setModel(provider.models[0])
    }
  }

  const handleModelChange = (modelId: string) => {
    setModel(modelId)
  }

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {/* LLM Selection Row */}
      <div className='flex items-center gap-2'>
        {/* Provider Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent'>
              <currentProvider.icon className='h-4 w-4' />
              <span className='font-medium'>{currentProvider.name}</span>
              <ChevronDown className='h-3 w-3' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-48'>
            {LLM_PROVIDERS.map((provider) => (
              <DropdownMenuItem
                key={provider.id}
                onClick={() => handleProviderChange(provider.id)}
                className='flex items-center gap-2'
              >
                <provider.icon className='h-4 w-4' />
                <span>{provider.name}</span>
                {provider.id === selectedProvider && (
                  <div className='ml-auto h-2 w-2 rounded-full bg-primary/100' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Model Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='flex min-w-0 items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent'>
              <span className='max-w-[180px] truncate font-medium' title={currentModel}>
                {currentModel}
              </span>
              <ChevronDown className='h-3 w-3 flex-shrink-0' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-64'>
            {currentProvider.models.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => handleModelChange(model)}
                className='flex items-center justify-between'
              >
                <span className='truncate'>{model}</span>
                {model === currentModel && (
                  <div className='ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary/100' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* API Key Input Section */}
      <div className='mt-3 border-border border-t pt-3'>
        <ApiKeyInput providerId={selectedProvider} providerName={currentProvider.name} />
      </div>
    </div>
  )
}
