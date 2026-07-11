import { getDecryptedEnvironmentVariables } from '@/lib/environment/utils'
import { getProviderApiKeyEnvVar } from '@/lib/providers/api-keys'
import { executeProviderRequest } from '@/providers'
import { DEFAULT_CHAT_MODEL, isKnownModel } from '@/providers/models'
import { getApiKey, getProviderFromModel } from '@/providers/utils'

export interface WandMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface WandGenerateInput {
  userId: string
  prompt: string
  systemPrompt?: string
  history?: WandMessage[]
  /** Raw provider key, or a `{{ENV_VAR}}` reference to a stored environment variable. Optional —
   * falls back to the provider's canonical env var, then hosted rotation / server keys. */
  apiKey?: string
  /** Any model id from the provider registry. Unknown/blank falls back to the default chat model. */
  model?: string
  stream?: boolean
}

const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful AI assistant. Generate content exactly as requested by the user.'
const TEMPERATURE = 0.3
const MAX_TOKENS = 10000

// A whole-value environment reference, e.g. "{{OPENAI_API_KEY}}" (not {{variable.x}}/{{block.field}}).
const ENV_REF = /^\{\{([^{}.]+)\}\}$/

const WAND_STREAM_HEADERS = {
  'Content-Type': 'text/plain',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  // Without these the response body is gzip-buffered until the stream closes, so streamed text only
  // appears all at once on completion. `X-Accel-Buffering: no` disables proxy buffering and
  // `Content-Encoding: none` disables compression (which buffers to fill frames). This is what makes
  // token-by-token streaming actually reach the client — matches ZelaxyArena and every other
  // streaming route in the app (copilot/chat, zelaxy-arena, tts, …).
  'X-Accel-Buffering': 'no',
  'Content-Encoding': 'none',
}

/** Error carrying an HTTP status so routes can surface a friendly message. */
export class WandError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

/**
 * Route a wand generation through the shared provider abstraction, so any provider/model in the
 * registry works (not just OpenAI). Resolves the API key from a `{{ENV_VAR}}` reference, a raw key,
 * or the provider's canonical env var, then hosted rotation / server fallback.
 *
 * Returns the raw `executeProviderRequest` result: a `ReadableStream` (when `stream`) or a
 * `ProviderResponse` (when not). Use `toWandNdjsonResponse` / `getWandContent` to consume it.
 */
export async function runWandGeneration(input: WandGenerateInput): Promise<any> {
  const {
    userId,
    prompt,
    systemPrompt,
    history = [],
    apiKey: rawApiKey,
    model: rawModel,
    stream = false,
  } = input

  const model = rawModel && isKnownModel(rawModel) ? rawModel : DEFAULT_CHAT_MODEL
  const providerId = getProviderFromModel(model)
  const envVars = await getDecryptedEnvironmentVariables(userId)

  // Resolve the caller-supplied key: {{ENV_VAR}} → decrypted secret; a raw key as-is; otherwise the
  // provider's canonical env var (e.g. ANTHROPIC_API_KEY) from the user's environment.
  const trimmedKey = (rawApiKey ?? '').trim()
  const envRef = trimmedKey.match(ENV_REF)
  let userKey: string | undefined
  if (envRef) userKey = envVars[envRef[1]]
  else if (trimmedKey) userKey = trimmedKey
  else {
    const canonical = getProviderApiKeyEnvVar(providerId)
    userKey = canonical ? envVars[canonical] : undefined
  }

  let apiKey: string
  try {
    // Adds hosted OpenAI/Anthropic key rotation and server-env fallback; may throw if none exists.
    apiKey = getApiKey(providerId, model, userKey)
  } catch {
    throw new WandError(
      `No API key configured for ${providerId}. Add one in the Agie setup (the key icon) or in Settings → Environment Variables — you can also reference an existing variable with {{VAR}}.`,
      503
    )
  }

  const messages: WandMessage[] = [
    ...history.filter((m) => m.role !== 'system'),
    { role: 'user', content: prompt },
  ]

  return executeProviderRequest(providerId, {
    model,
    systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
    messages: messages as any,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
    apiKey,
    stream,
    environmentVariables: envVars,
    userId,
  })
}

/** Extract the final text from a non-streaming provider response. */
export function getWandContent(resp: any): string {
  return (resp?.content ?? resp?.execution?.output?.content ?? '').trim()
}

/**
 * Convert a provider streaming result into the wand's line-delimited `{chunk, done}` JSON protocol,
 * which the client reader in use-wand.ts already understands. Handles a plain `ReadableStream`, a
 * `StreamingExecution` (`.stream`), and a non-streaming `ProviderResponse` (emitted as one chunk).
 */
export function toWandNdjsonResponse(resp: any): Response {
  const encoder = new TextEncoder()
  const readable: ReadableStream<any> | null =
    resp instanceof ReadableStream ? resp : (resp?.stream ?? null)

  if (!readable) {
    const text = getWandContent(resp)
    const body =
      `${JSON.stringify({ chunk: text, done: false })}\n` +
      `${JSON.stringify({ chunk: '', done: true })}\n`
    return new Response(body, { headers: WAND_STREAM_HEADERS })
  }

  return new Response(
    new ReadableStream({
      async start(controller) {
        const reader = readable.getReader()
        const decoder = new TextDecoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk =
              typeof value === 'string'
                ? value
                : decoder.decode(value as Uint8Array, { stream: true })
            if (chunk) {
              controller.enqueue(encoder.encode(`${JSON.stringify({ chunk, done: false })}\n`))
            }
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ chunk: '', done: true })}\n`))
        } catch {
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ error: 'Streaming failed', done: true })}\n`)
          )
        } finally {
          controller.close()
        }
      },
    }),
    { headers: WAND_STREAM_HEADERS }
  )
}

/** Map a provider/SDK error to a friendly message + HTTP status. */
export function mapWandError(error: any): { message: string; status: number } {
  if (error instanceof WandError) return { message: error.message, status: error.status }

  const status: number = error?.status ?? error?.response?.status ?? 500
  if (status === 401)
    return { message: 'Authentication failed. Please check your API key.', status }
  if (status === 429) return { message: 'Rate limit exceeded. Please try again later.', status }
  if (status >= 500 && status < 600) {
    return { message: 'The wand service is currently unavailable. Please try again later.', status }
  }
  return { message: 'Wand generation failed. Please try again later.', status: 500 }
}
