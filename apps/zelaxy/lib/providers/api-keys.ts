/**
 * Provider credential definitions + key-availability logic.
 *
 * Most providers authenticate with a single API key, but some need more than one field — AWS
 * Bedrock, for example, uses an access key id + secret access key (+ region). This module models
 * each provider's required credential fields and decides whether a usable credential set exists
 * (hosted rotation, server env, or the user's Environment Variables). The UI uses `missing` to
 * prompt for exactly the fields that aren't set yet.
 */

import type { ProviderId } from '@/providers/types'

export interface ProviderCredential {
  /** Environment-variable name the value is stored under. */
  name: string
  /** Human label for the prompt. */
  label: string
  /** Optional fields don't block availability (e.g. region with a default). */
  optional?: boolean
  placeholder?: string
}

/**
 * Required credential fields per provider. Empty = no key needed (local). AWS Bedrock is the
 * multi-field case: access key id + secret access key, with an optional region.
 */
export const PROVIDER_CREDENTIALS: Record<string, ProviderCredential[]> = {
  openai: [{ name: 'OPENAI_API_KEY', label: 'OpenAI API Key' }],
  'azure-openai': [{ name: 'AZURE_OPENAI_API_KEY', label: 'Azure OpenAI API Key' }],
  'azure-anthropic': [{ name: 'AZURE_ANTHROPIC_API_KEY', label: 'Azure Anthropic API Key' }],
  anthropic: [{ name: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key' }],
  google: [{ name: 'GEMINI_API_KEY', label: 'Gemini API Key' }],
  vertex: [{ name: 'VERTEX_ACCESS_TOKEN', label: 'Vertex AI Access Token (OAuth Bearer)' }],
  deepseek: [{ name: 'DEEPSEEK_API_KEY', label: 'DeepSeek API Key' }],
  xai: [{ name: 'XAI_API_KEY', label: 'xAI API Key' }],
  groq: [{ name: 'GROQ_API_KEY', label: 'Groq API Key' }],
  cerebras: [{ name: 'CEREBRAS_API_KEY', label: 'Cerebras API Key' }],
  nvidia: [{ name: 'NVIDIA_API_KEY', label: 'NVIDIA API Key' }],
  mimo: [{ name: 'XIAOMI_MIMO_API_KEY', label: 'Xiaomi MiMo API Key' }],
  'mimo-token-plan': [
    { name: 'XIAOMI_MIMO_TOKEN_PLAN_API_KEY', label: 'Xiaomi MiMo Token Plan API Key' },
  ],
  openrouter: [{ name: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key' }],
  together: [{ name: 'TOGETHER_API_KEY', label: 'Together AI API Key' }],
  zai: [{ name: 'ZAI_API_KEY', label: 'Z.ai API Key' }],
  sakana: [{ name: 'SAKANA_API_KEY', label: 'Sakana AI API Key' }],
  meta: [{ name: 'META_API_KEY', label: 'Meta API Key' }],
  fireworks: [{ name: 'FIREWORKS_API_KEY', label: 'Fireworks AI API Key' }],
  mistral: [{ name: 'MISTRAL_API_KEY', label: 'Mistral API Key' }],
  // Self-hosted endpoints — key is optional (many run without auth); the base URL is the real input.
  vllm: [{ name: 'VLLM_API_KEY', label: 'vLLM API Key (optional)', optional: true }],
  litellm: [{ name: 'LITELLM_API_KEY', label: 'LiteLLM API Key (optional)', optional: true }],
  baseten: [{ name: 'BASETEN_API_KEY', label: 'Baseten API Key' }],
  'ollama-cloud': [{ name: 'OLLAMA_CLOUD_API_KEY', label: 'Ollama Cloud API Key' }],
  bedrock: [
    { name: 'BEDROCK_ACCESS_KEY_ID', label: 'AWS Access Key ID' },
    { name: 'BEDROCK_SECRET_ACCESS_KEY', label: 'AWS Secret Access Key' },
    { name: 'BEDROCK_REGION', label: 'AWS Region', optional: true, placeholder: 'us-east-1' },
  ],
  ollama: [], // local — no credentials
}

export function getProviderCredentials(providerId: string): ProviderCredential[] {
  if (providerId in PROVIDER_CREDENTIALS) return PROVIDER_CREDENTIALS[providerId]
  const name = `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`
  return [{ name, label: `${providerId} API Key` }]
}

/** First credential env-var name (or null for keyless providers). Back-compat helper. */
export function getProviderApiKeyEnvVar(providerId: string): string | null {
  return getProviderCredentials(providerId)[0]?.name ?? null
}

/** Providers that never need a user key. */
export function providerNeedsNoKey(providerId: string): boolean {
  return getProviderCredentials(providerId).length === 0
}

export interface KeyAvailability {
  available: boolean
  provider: ProviderId
  /** First missing required env var (back-compat); null when available/keyless. */
  envVar: string | null
  /** All credential fields that still need a value (required + optional). */
  missing: ProviderCredential[]
  source?: 'none-needed' | 'hosted' | 'server-env' | 'user-env'
}

export function resolveKeyAvailability(params: {
  provider: ProviderId
  isHosted: boolean
  hasServerEnv: (name: string) => boolean
  userEnvVarNames: Set<string>
}): KeyAvailability {
  const { provider, isHosted, hasServerEnv, userEnvVarNames } = params
  const creds = getProviderCredentials(provider)

  if (creds.length === 0) {
    return { available: true, provider, envVar: null, missing: [], source: 'none-needed' }
  }

  // On the hosted platform, OpenAI + Anthropic are covered by server key rotation.
  if (isHosted && (provider === 'openai' || provider === 'anthropic')) {
    return { available: true, provider, envVar: creds[0].name, missing: [], source: 'hosted' }
  }

  const has = (name: string) => hasServerEnv(name) || userEnvVarNames.has(name)
  const requiredMissing = creds.filter((c) => !c.optional && !has(c.name))

  if (requiredMissing.length === 0) {
    const fromServer = creds.some((c) => hasServerEnv(c.name))
    return {
      available: true,
      provider,
      envVar: creds[0].name,
      missing: [],
      source: fromServer ? 'server-env' : 'user-env',
    }
  }

  // Not available — surface every field not yet set (so the UI can collect them all).
  return {
    available: false,
    provider,
    envVar: requiredMissing[0].name,
    missing: creds.filter((c) => !has(c.name)),
  }
}
