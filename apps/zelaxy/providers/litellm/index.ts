import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * LiteLLM — a self-hosted proxy/gateway that exposes many upstream providers behind one
 * OpenAI-compatible API. The base URL points at the user's proxy (Agent block "Base URL" field or
 * the `LITELLM_BASE_URL` env var); auth depends on the proxy config, so the key is optional. Open
 * catalog: model ids are whatever the proxy routes (the `litellm/` prefix is stripped before the
 * call).
 */
export const litellmProvider = createOpenAICompatibleProvider({
  id: 'litellm',
  name: 'LiteLLM',
  description: 'Self-hosted LiteLLM proxy with an OpenAI-compatible API',
  baseURL: '',
  modelPrefix: 'litellm/',
  envBaseUrlVar: 'LITELLM_BASE_URL',
})
