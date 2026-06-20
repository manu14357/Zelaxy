import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * OpenRouter — unified gateway to 100+ models from many providers behind one API key.
 *
 * Catalog model ids are namespaced with an `openrouter/` prefix so they never collide with the
 * same underlying model offered by a first-party provider; the prefix is stripped before the API
 * call. Users can also add arbitrary OpenRouter model ids (unprefixed, e.g. `x-ai/grok-2`) via
 * custom models — those route by exact match and are sent as-is.
 */
export const openRouterProvider = createOpenAICompatibleProvider({
  id: 'openrouter',
  name: 'OpenRouter',
  description: 'Unified access to many models from multiple providers via OpenRouter',
  baseURL: 'https://openrouter.ai/api/v1',
  modelPrefix: 'openrouter/',
  defaultHeaders: {
    'HTTP-Referer': 'https://zelaxy.ai',
    'X-Title': 'Zelaxy',
  },
})
