import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Z.ai — GLM models via an OpenAI-compatible chat-completions API (api.z.ai). The catalog ids are
 * Z.ai's native model ids (no prefix). Z.ai only supports `tool_choice: "auto"` and caps output via
 * `max_tokens`, both of which the shared OpenAI-compatible factory already does.
 */
export const zaiProvider = createOpenAICompatibleProvider({
  id: 'zai',
  name: 'Z.ai',
  description: "Z.ai's GLM models via an OpenAI-compatible API",
  baseURL: 'https://api.z.ai/api/paas/v4',
})
