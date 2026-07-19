import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Sakana AI — the Fugu multi-agent models via an OpenAI-compatible API. Catalog ids are Sakana's
 * native model ids (no prefix).
 */
export const sakanaProvider = createOpenAICompatibleProvider({
  id: 'sakana',
  name: 'Sakana AI',
  description: "Sakana AI's Fugu models via an OpenAI-compatible API",
  baseURL: 'https://api.sakana.ai/v1',
})
