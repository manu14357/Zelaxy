import { describe, expect, it } from 'vitest'
import { getProviderApiKeyEnvVar, resolveKeyAvailability } from '@/lib/providers/api-keys'
import {
  getModelPricing,
  getProviderModels,
  isKnownModel,
  setCustomModels,
  supportsCustomModels,
} from '@/providers/models'
import { getProviderFromModel } from '@/providers/utils'

describe('MiMo provider', () => {
  it('registers MiMo models with pricing', () => {
    const models = getProviderModels('mimo')
    expect(models).toContain('mimo-v2.5-pro')
    expect(models).toContain('mimo-v2.5')
    expect(getModelPricing('mimo-v2.5-pro')).toEqual(
      expect.objectContaining({ input: 0.435, output: 0.87 })
    )
  })
  it('routes mimo model ids to the mimo provider', () => {
    expect(getProviderFromModel('mimo-v2.5-pro')).toBe('mimo')
    expect(getProviderFromModel('mimo-anything-new')).toBe('mimo') // via /^mimo/ pattern
  })
  it('registers the V2 series (routed to V2.5 pricing) with cached-input rates', () => {
    const models = getProviderModels('mimo')
    expect(models).toEqual(expect.arrayContaining(['mimo-v2-pro', 'mimo-v2-omni', 'mimo-v2-flash']))
    expect(getModelPricing('mimo-v2.5-pro')).toEqual(
      expect.objectContaining({ input: 0.435, cachedInput: 0.0036, output: 0.87 })
    )
  })
})

describe('MiMo Token Plan provider', () => {
  it('registers namespaced Token Plan models with USD-equivalent pricing', () => {
    const models = getProviderModels('mimo-token-plan')
    expect(models).toContain('mimo-token-plan/mimo-v2.5-pro')
    expect(models).toContain('mimo-token-plan/mimo-v2.5')
    // Credits are a linear transform of the overseas pay-as-you-go price, so the per-1M-token
    // numbers match the pay-as-you-go rate.
    expect(getModelPricing('mimo-token-plan/mimo-v2.5-pro')).toEqual(
      expect.objectContaining({ input: 0.435, cachedInput: 0.0036, output: 0.87 })
    )
  })
  it('routes namespaced model ids to the Token Plan provider (not the pay-as-you-go one)', () => {
    expect(getProviderFromModel('mimo-token-plan/mimo-v2.5-pro')).toBe('mimo-token-plan')
    expect(getProviderFromModel('mimo-token-plan/mimo-v2-omni')).toBe('mimo-token-plan')
    // Plain ids still resolve to pay-as-you-go.
    expect(getProviderFromModel('mimo-v2.5-pro')).toBe('mimo')
  })
})

describe('custom models', () => {
  it('adds a custom model that resolves + lists + prices (default 0)', () => {
    setCustomModels('nvidia', ['acme/custom-7b'])
    expect(getProviderModels('nvidia')).toContain('acme/custom-7b')
    expect(isKnownModel('acme/custom-7b')).toBe(true)
    expect(getModelPricing('acme/custom-7b')).toEqual(
      expect.objectContaining({ input: 0, output: 0 })
    )
    setCustomModels('nvidia', []) // cleanup
    expect(getProviderModels('nvidia')).not.toContain('acme/custom-7b')
  })

  it('only open-catalog providers support custom models (not first-party)', () => {
    expect(supportsCustomModels('nvidia')).toBe(true)
    expect(supportsCustomModels('bedrock')).toBe(true)
    // Curated/fixed catalogs are NOT custom-model providers.
    expect(supportsCustomModels('mimo')).toBe(false)
    expect(supportsCustomModels('groq')).toBe(false)
    expect(supportsCustomModels('cerebras')).toBe(false)
    expect(supportsCustomModels('anthropic')).toBe(false)
    expect(supportsCustomModels('openai')).toBe(false)
    expect(supportsCustomModels('google')).toBe(false)
  })

  it('setCustomModels is a no-op for unsupported providers', () => {
    setCustomModels('anthropic', ['claude-fake-9000'])
    expect(getProviderModels('anthropic')).not.toContain('claude-fake-9000')
  })
})

describe('provider API-key mapping + availability', () => {
  it('maps providers to env var names', () => {
    expect(getProviderApiKeyEnvVar('openai')).toBe('OPENAI_API_KEY')
    expect(getProviderApiKeyEnvVar('mimo')).toBe('XIAOMI_MIMO_API_KEY')
    expect(getProviderApiKeyEnvVar('mimo-token-plan')).toBe('XIAOMI_MIMO_TOKEN_PLAN_API_KEY')
    expect(getProviderApiKeyEnvVar('nvidia')).toBe('NVIDIA_API_KEY')
    expect(getProviderApiKeyEnvVar('ollama')).toBeNull()
  })

  it('ollama needs no key', () => {
    const r = resolveKeyAvailability({
      provider: 'ollama',
      isHosted: false,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(),
    })
    expect(r.available).toBe(true)
    expect(r.source).toBe('none-needed')
  })

  it('AWS Bedrock needs two keys (access key id + secret access key), region optional', () => {
    const missing = resolveKeyAvailability({
      provider: 'bedrock',
      isHosted: true,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(),
    })
    expect(missing.available).toBe(false)
    const requiredNames = missing.missing.filter((c) => !c.optional).map((c) => c.name)
    expect(requiredNames).toEqual(['BEDROCK_ACCESS_KEY_ID', 'BEDROCK_SECRET_ACCESS_KEY'])
    // Region is offered but optional.
    expect(missing.missing.some((c) => c.name === 'BEDROCK_REGION' && c.optional)).toBe(true)

    // Both required keys present → available (region not needed).
    const present = resolveKeyAvailability({
      provider: 'bedrock',
      isHosted: true,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(['BEDROCK_ACCESS_KEY_ID', 'BEDROCK_SECRET_ACCESS_KEY']),
    })
    expect(present.available).toBe(true)

    // Only one of the two → still unavailable.
    const partial = resolveKeyAvailability({
      provider: 'bedrock',
      isHosted: true,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(['BEDROCK_ACCESS_KEY_ID']),
    })
    expect(partial.available).toBe(false)
  })

  it('hosted openai/anthropic are covered by rotation', () => {
    const r = resolveKeyAvailability({
      provider: 'anthropic',
      isHosted: true,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(),
    })
    expect(r.available).toBe(true)
    expect(r.source).toBe('hosted')
  })

  it('BYOK provider is unavailable until the env var is set', () => {
    const missing = resolveKeyAvailability({
      provider: 'mimo',
      isHosted: true,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(),
    })
    expect(missing.available).toBe(false)
    expect(missing.envVar).toBe('XIAOMI_MIMO_API_KEY')

    const present = resolveKeyAvailability({
      provider: 'mimo',
      isHosted: true,
      hasServerEnv: () => false,
      userEnvVarNames: new Set(['XIAOMI_MIMO_API_KEY']),
    })
    expect(present.available).toBe(true)
    expect(present.source).toBe('user-env')
  })
})
