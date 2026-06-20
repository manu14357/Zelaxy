import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Mistral AI — Mistral's proprietary and open models (Mistral Large/Small, Ministral, Codestral,
 * Pixtral). OpenAI-compatible Chat Completions API at api.mistral.ai. Curated catalog.
 */
export const mistralProvider = createOpenAICompatibleProvider({
  id: 'mistral',
  name: 'Mistral',
  description: "Mistral AI's chat and code models",
  baseURL: 'https://api.mistral.ai/v1',
})
