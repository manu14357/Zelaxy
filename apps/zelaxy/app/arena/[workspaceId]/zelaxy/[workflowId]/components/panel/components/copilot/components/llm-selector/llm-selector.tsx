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

const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: AnthropicIcon,
    models: ['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    requiresApiKey: true,
    description: 'Claude models - default for Agie',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: OpenAIIcon,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    requiresApiKey: true,
    description: 'GPT models',
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: GroqIcon,
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    requiresApiKey: true,
    description: 'Free tier available - fast inference',
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
  {
    id: 'google',
    name: 'Google',
    icon: GeminiIcon,
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    requiresApiKey: true,
    description: 'Gemini models',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: DeepseekIcon,
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    requiresApiKey: true,
    description: 'Cost-effective models',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    icon: NvidiaIcon,
    models: [
      'nvidia/llama-3.1-nemotron-70b-instruct',
      'meta/llama-3.1-405b-instruct',
      'meta/llama-3.1-70b-instruct',
    ],
    requiresApiKey: true,
    description: 'Enterprise GPU inference',
  },
  {
    id: 'xai',
    name: 'xAI',
    icon: xAIIcon,
    models: ['grok-beta', 'grok-vision-beta'],
    requiresApiKey: true,
    description: 'Grok models',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    icon: CerebrasIcon,
    models: ['llama3.1-8b', 'llama3.1-70b'],
    requiresApiKey: true,
    description: 'Fast inference',
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    icon: BedrockIcon,
    models: [
      'openai.gpt-oss-20b-1:0',
      'openai.gpt-oss-safeguard-20b',
      'openai.gpt-oss-safeguard-120b',
      'amazon.nova-pro-v1:0',
      'amazon.nova-lite-v1:0',
      'amazon.nova-micro-v1:0',
      'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'anthropic.claude-3-5-haiku-20241022-v1:0',
      'meta.llama3-3-70b-instruct-v1:0',
      'qwen.qwen3-next-80b-a3b',
      'qwen.qwen3-vl-235b-a22b',
      'google.gemma-3-4b-it',
      'google.gemma-3-12b-it',
      'google.gemma-3-27b-it',
      'minimax.minimax-m2',
      'moonshot.kimi-k2-thinking',
      'nvidia.nemotron-nano-9b-v2',
      'nvidia.nemotron-nano-12b-v2',
      'mistral.magistral-small-2509',
      'mistral.voxtral-mini-3b-2507',
      'mistral.voxtral-small-24b-2507',
      'mistral.ministral-3-3b-instruct',
      'mistral.ministral-3-8b-instruct',
      'mistral.ministral-3-14b-instruct',
      'mistral.mistral-large-3-675b-instruct',
    ],
    requiresApiKey: false,
    description: 'AWS Bedrock foundation models',
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
