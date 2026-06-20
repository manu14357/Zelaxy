import { createOpenAICompatibleProvider } from '@/providers/openai-compatible'

/**
 * vLLM — self-hosted OpenAI-compatible inference server. The base URL points at the user's own
 * server (per-request "Base URL" field on the Agent block, or the `VLLM_BASE_URL` env var); most
 * deployments run without auth, so an API key is optional. Open catalog: the served model id is
 * whatever the server exposes, so users add their own ids (the `vllm/` prefix is stripped before
 * the call).
 */
export const vllmProvider = createOpenAICompatibleProvider({
  id: 'vllm',
  name: 'vLLM',
  description: 'Self-hosted vLLM server with an OpenAI-compatible API',
  baseURL: '',
  modelPrefix: 'vllm/',
  envBaseUrlVar: 'VLLM_BASE_URL',
})
