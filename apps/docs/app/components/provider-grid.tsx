import type { ReactNode } from 'react'
import {
  AnthropicIcon,
  AzureAnthropicIcon,
  AzureIcon,
  BasetenIcon,
  BedrockIcon,
  CerebrasIcon,
  DeepseekIcon,
  FireworksIcon,
  GeminiIcon,
  GroqIcon,
  LiteLLMIcon,
  MetaProviderIcon,
  MiMoIcon,
  MistralIcon,
  NvidiaIcon,
  OllamaIcon,
  OpenAIIcon,
  OpenRouterIcon,
  SakanaIcon,
  TogetherIcon,
  VertexIcon,
  VLLMIcon,
  xAIIcon,
  ZaiIcon,
} from './provider-icons'

type ProviderId = keyof typeof PROVIDERS

const PROVIDERS = {
  openai: { name: 'OpenAI', description: "OpenAI's models", Icon: OpenAIIcon },
  'azure-openai': {
    name: 'Azure OpenAI',
    description: 'Microsoft Azure OpenAI Service models',
    Icon: AzureIcon,
  },
  anthropic: { name: 'Anthropic', description: "Anthropic's Claude models", Icon: AnthropicIcon },
  'azure-anthropic': {
    name: 'Azure Anthropic',
    description: 'Anthropic Claude models hosted on Microsoft Azure',
    Icon: AzureAnthropicIcon,
  },
  google: { name: 'Google', description: "Google's Gemini models", Icon: GeminiIcon },
  vertex: {
    name: 'Google Vertex AI',
    description: 'Google Gemini models on Vertex AI (GCP)',
    Icon: VertexIcon,
  },
  deepseek: { name: 'DeepSeek', description: "DeepSeek's chat models", Icon: DeepseekIcon },
  xai: { name: 'xAI', description: "xAI's Grok models", Icon: xAIIcon },
  cerebras: { name: 'Cerebras', description: 'Cerebras Cloud LLMs', Icon: CerebrasIcon },
  groq: { name: 'Groq', description: "Groq's high-performance inference", Icon: GroqIcon },
  nvidia: { name: 'NVIDIA', description: 'NVIDIA NIM inference microservices', Icon: NvidiaIcon },
  mimo: { name: 'MiMo', description: "Xiaomi's MiMo models (pay-as-you-go)", Icon: MiMoIcon },
  'mimo-token-plan': {
    name: 'MiMo Token Plan',
    description: 'MiMo via credits-based subscription',
    Icon: MiMoIcon,
  },
  ollama: { name: 'Ollama', description: 'Local LLM models via Ollama', Icon: OllamaIcon },
  'ollama-cloud': {
    name: 'Ollama Cloud',
    description: "Ollama's hosted inference for large models",
    Icon: OllamaIcon,
  },
  bedrock: { name: 'AWS Bedrock', description: 'AWS Bedrock foundation models', Icon: BedrockIcon },
  openrouter: {
    name: 'OpenRouter',
    description: 'Unified access to many providers',
    Icon: OpenRouterIcon,
  },
  together: {
    name: 'Together AI',
    description: "Together AI's open-source model inference",
    Icon: TogetherIcon,
  },
  fireworks: {
    name: 'Fireworks AI',
    description: "Fireworks AI's fast open-source inference",
    Icon: FireworksIcon,
  },
  mistral: { name: 'Mistral', description: "Mistral AI's chat and code models", Icon: MistralIcon },
  vllm: { name: 'vLLM', description: 'Self-hosted vLLM (OpenAI-compatible)', Icon: VLLMIcon },
  litellm: { name: 'LiteLLM', description: 'Self-hosted LiteLLM proxy gateway', Icon: LiteLLMIcon },
  baseten: {
    name: 'Baseten',
    description: "Baseten's hosted open-source inference",
    Icon: BasetenIcon,
  },
  zai: { name: 'Z.ai', description: "Z.ai's GLM models (OpenAI-compatible)", Icon: ZaiIcon },
  sakana: { name: 'Sakana AI', description: "Sakana AI's Fugu models", Icon: SakanaIcon },
  meta: { name: 'Meta', description: 'Muse Spark via the Meta Model API', Icon: MetaProviderIcon },
} as const

function ProviderCard({ id }: { id: ProviderId }) {
  const p = PROVIDERS[id]
  if (!p) return null
  const { Icon } = p
  return (
    <div className='flex items-center gap-3 rounded-xl border border-[hsl(var(--fd-border))] bg-[hsl(var(--fd-card))] px-3.5 py-3 shadow-[0_1px_3px_hsl(220_13%_10%/0.05)] dark:shadow-[0_1px_3px_hsl(0_0%_0%/0.3)]'>
      <span className='flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-[hsl(var(--fd-border))] dark:bg-white/95'>
        <Icon className='size-6' />
      </span>
      <div className='min-w-0'>
        <div className='truncate font-semibold text-[0.8125rem] text-[hsl(var(--fd-foreground))]'>
          {p.name}
        </div>
        <div className='truncate text-[0.6875rem] text-[hsl(var(--fd-muted-foreground))]'>
          {p.description}
        </div>
      </div>
    </div>
  )
}

/**
 * A responsive grid of provider logo cards. `ids` selects which providers to show
 * (in order); omit to show all supported providers.
 */
export function ProviderGrid({ ids, caption }: { ids?: ProviderId[]; caption?: ReactNode }) {
  const list = ids ?? (Object.keys(PROVIDERS) as ProviderId[])
  return (
    <figure className='my-6'>
      <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4'>
        {list.map((id) => (
          <ProviderCard key={id} id={id} />
        ))}
      </div>
      {caption && (
        <figcaption className='mt-3 text-[0.75rem] text-[hsl(var(--fd-muted-foreground))] italic'>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
