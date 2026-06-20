import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * Baseten — hosted inference for open-source and custom models via its OpenAI-compatible Model
 * APIs. Defaults to the shared Model APIs endpoint, but a dedicated deployment URL can be supplied
 * per-request (Agent block "Base URL" field) or via `BASETEN_BASE_URL`. Requires an API key. Open
 * catalog: model slugs are user-specific (the `baseten/` prefix is stripped before the call).
 */
export const basetenProvider = createOpenAICompatibleProvider({
  id: 'baseten',
  name: 'Baseten',
  description: "Baseten's hosted open-source and custom model inference",
  baseURL: 'https://inference.baseten.co/v1',
  modelPrefix: 'baseten/',
  envBaseUrlVar: 'BASETEN_BASE_URL',
})
