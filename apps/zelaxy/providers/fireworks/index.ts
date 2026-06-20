import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Fireworks AI — fast hosted inference for open-source models. OpenAI-compatible API; catalog ids
 * are Fireworks' native `accounts/fireworks/models/...` ids (no prefix). Open catalog — users may
 * add any Fireworks model id via custom models.
 */
export const fireworksProvider = createOpenAICompatibleProvider({
  id: 'fireworks',
  name: 'Fireworks',
  description: "Fireworks AI's fast open-source model inference",
  baseURL: 'https://api.fireworks.ai/inference/v1',
})
