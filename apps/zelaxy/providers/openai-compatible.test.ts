import { describe, expect, it } from 'vitest'
import { getProviderApiKeyEnvVar, resolveKeyAvailability } from '@/lib/providers/api-keys'
import {
  getModelPricing,
  getProviderModels,
  isKnownModel,
  setCustomModels,
  supportsCustomModels,
} from '@/providers/models'
import { getApiKey, getProviderFromModel, providers } from '@/providers/utils'

const NEW_PROVIDERS = [
  'openrouter',
  'together',
  'fireworks',
  'mistral',
  'vllm',
  'litellm',
  'baseten',
  'ollama-cloud',
] as const

describe('OpenAI-compatible providers (OpenRouter / Together / Fireworks / Mistral)', () => {
  it('registers each provider with a default model and a non-empty catalog', () => {
    for (const id of NEW_PROVIDERS) {
      expect(providers[id]).toBeDefined()
      expect(providers[id].defaultModel).toBeTruthy()
      expect(providers[id].models.length).toBeGreaterThan(0)
    }
  })

  it('routes catalog model ids to the right provider with pricing', () => {
    expect(getProviderFromModel('openrouter/openai/gpt-4o-mini')).toBe('openrouter')
    expect(getProviderFromModel('meta-llama/Llama-3.3-70B-Instruct-Turbo')).toBe('together')
    expect(getProviderFromModel('accounts/fireworks/models/llama-v3p3-70b-instruct')).toBe(
      'fireworks'
    )
    expect(getProviderFromModel('mistral-large-latest')).toBe('mistral')

    expect(isKnownModel('mistral-large-latest')).toBe(true)
    expect(getModelPricing('mistral-large-latest')).toEqual(
      expect.objectContaining({ input: 2, output: 6 })
    )
    expect(getModelPricing('openrouter/openai/gpt-4o-mini')).toEqual(
      expect.objectContaining({ input: 0.15, output: 0.6 })
    )
  })

  it('routes unknown ids via modelPatterns', () => {
    expect(getProviderFromModel('openrouter/some/brand-new-model')).toBe('openrouter')
    expect(getProviderFromModel('accounts/fireworks/models/brand-new')).toBe('fireworks')
    expect(getProviderFromModel('ministral-99b-latest')).toBe('mistral')
  })

  it('maps providers to env var names', () => {
    expect(getProviderApiKeyEnvVar('openrouter')).toBe('OPENROUTER_API_KEY')
    expect(getProviderApiKeyEnvVar('together')).toBe('TOGETHER_API_KEY')
    expect(getProviderApiKeyEnvVar('fireworks')).toBe('FIREWORKS_API_KEY')
    expect(getProviderApiKeyEnvVar('mistral')).toBe('MISTRAL_API_KEY')
  })

  it('aggregators accept custom model ids; mistral is a curated catalog', () => {
    expect(supportsCustomModels('openrouter')).toBe(true)
    expect(supportsCustomModels('together')).toBe(true)
    expect(supportsCustomModels('fireworks')).toBe(true)
    expect(supportsCustomModels('mistral')).toBe(false)

    setCustomModels('openrouter', ['x-ai/grok-2'])
    expect(getProviderModels('openrouter')).toContain('x-ai/grok-2')
    setCustomModels('openrouter', []) // cleanup
    expect(getProviderModels('openrouter')).not.toContain('x-ai/grok-2')
  })
})

describe('self-hosted OpenAI-compatible providers (vLLM / LiteLLM / Baseten / Ollama Cloud)', () => {
  it('routes prefixed catalog ids to the right provider', () => {
    expect(getProviderFromModel('vllm/meta-llama/Llama-3.1-8B-Instruct')).toBe('vllm')
    expect(getProviderFromModel('litellm/gpt-4o')).toBe('litellm')
    expect(getProviderFromModel('baseten/deepseek-ai/DeepSeek-V3')).toBe('baseten')
    expect(getProviderFromModel('ollama-cloud/gpt-oss:120b')).toBe('ollama-cloud')
  })

  it('routes user-added custom ids via the provider prefix pattern', () => {
    expect(getProviderFromModel('vllm/my/custom-served-model')).toBe('vllm')
    expect(getProviderFromModel('litellm/whatever-the-proxy-routes')).toBe('litellm')
    expect(getProviderFromModel('ollama-cloud/qwen3-coder:480b')).toBe('ollama-cloud')
    expect(supportsCustomModels('vllm')).toBe(true)
    expect(supportsCustomModels('litellm')).toBe(true)
    expect(supportsCustomModels('baseten')).toBe(true)
    expect(supportsCustomModels('ollama-cloud')).toBe(true)
  })

  it('vLLM / LiteLLM keys are optional (self-hosted, often no auth); the others require a key', () => {
    // No key set, not hosted → still available for vLLM/LiteLLM (optional credential).
    for (const provider of ['vllm', 'litellm'] as const) {
      const r = resolveKeyAvailability({
        provider,
        isHosted: false,
        hasServerEnv: () => false,
        userEnvVarNames: new Set(),
      })
      expect(r.available).toBe(true)
    }
    // getApiKey returns a placeholder for keyless self-hosted endpoints (so the request isn't blocked).
    expect(getApiKey('vllm', 'vllm/x', undefined as unknown as string)).toBe('empty')
    expect(getApiKey('litellm', 'litellm/x', 'sk-proxy')).toBe('sk-proxy')

    // Baseten / Ollama Cloud are hosted services — a key is required.
    const baseten = resolveKeyAvailability({
      provider: 'baseten',
      isHosted: false,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(),
    })
    expect(baseten.available).toBe(false)
    expect(baseten.envVar).toBe('BASETEN_API_KEY')
    expect(getProviderApiKeyEnvVar('ollama-cloud')).toBe('OLLAMA_CLOUD_API_KEY')
  })
})
