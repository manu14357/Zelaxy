import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Ollama Cloud — Ollama's hosted inference (large models you can't run locally), exposed at an
 * OpenAI-compatible endpoint and authenticated with an API key. Distinct from the local `ollama`
 * provider. Open catalog: cloud model ids are tags like `gpt-oss:120b` (the `ollama-cloud/` prefix
 * is stripped before the call).
 */
export const ollamaCloudProvider = createOpenAICompatibleProvider({
  id: 'ollama-cloud',
  name: 'Ollama Cloud',
  description: "Ollama's hosted inference for large models",
  baseURL: 'https://ollama.com/v1',
  modelPrefix: 'ollama-cloud/',
})
