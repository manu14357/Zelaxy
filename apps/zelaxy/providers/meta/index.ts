import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Meta — the Muse Spark models via the Meta Model API (OpenAI-compatible). Catalog ids are Meta's
 * native model ids (no prefix). This is the LLM provider, distinct from the control-flow parallel
 * block or any Meta/Facebook OAuth integration.
 */
export const metaProvider = createOpenAICompatibleProvider({
  id: 'meta',
  name: 'Meta',
  description: "Meta's Muse Spark models via the Meta Model API (OpenAI-compatible)",
  baseURL: 'https://api.meta.ai/v1',
})
