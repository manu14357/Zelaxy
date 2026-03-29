'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  AnthropicIcon,
  BedrockIcon,
  CerebrasIcon,
  DeepseekIcon,
  GeminiIcon,
  GroqIcon,
  NvidiaIcon,
  OllamaIcon,
  OpenAIIcon,
  xAIIcon,
} from '@/components/icons'
import { useLLMSelectionStore } from '@/stores/llm-selection/store'
import { LLMSettingsDialog } from '../llm-settings-dialog/llm-settings-dialog'

const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  nvidia: NvidiaIcon,
  openai: OpenAIIcon,
  anthropic: AnthropicIcon,
  google: GeminiIcon,
  groq: GroqIcon,
  deepseek: DeepseekIcon,
  xai: xAIIcon,
  cerebras: CerebrasIcon,
  ollama: OllamaIcon,
  bedrock: BedrockIcon,
}

const PROVIDER_NAMES: Record<string, string> = {
  nvidia: 'NVIDIA',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  groq: 'Groq',
  deepseek: 'DeepSeek',
  xai: 'xAI',
  cerebras: 'Cerebras',
  ollama: 'Ollama',
  bedrock: 'AWS Bedrock',
}

export function LLMProviderButton() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { selectedProvider } = useLLMSelectionStore()

  const ProviderIcon = PROVIDER_ICONS[selectedProvider] || NvidiaIcon
  const providerName = PROVIDER_NAMES[selectedProvider] || 'NVIDIA'

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className='flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors hover:bg-accent'
        title='Configure LLM provider settings'
      >
        <ProviderIcon className='h-3 w-3' />
        <span className='font-medium'>{providerName}</span>
        <ChevronDown className='h-2.5 w-2.5 text-muted-foreground' />
      </button>

      <LLMSettingsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
