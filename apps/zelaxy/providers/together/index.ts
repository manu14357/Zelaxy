import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Together AI — hosted inference for open-source models (Llama, Qwen, DeepSeek, Mixtral, …).
 * OpenAI-compatible API; catalog ids are Together's native model ids (no prefix). Open catalog —
 * users may add any Together model id via custom models.
 */
export const togetherProvider = createOpenAICompatibleProvider({
  id: 'together',
  name: 'Together',
  description: "Together AI's hosted open-source model inference",
  baseURL: 'https://api.together.xyz/v1',
})
