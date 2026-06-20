import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDecryptedEnvironmentVariables } from '@/lib/environment/utils'
import { createLogger } from '@/lib/logs/console/logger'
import { getProviderApiKeyEnvVar } from '@/lib/providers/api-keys'
import { executeProviderRequest } from '@/providers'
import { DEFAULT_CHAT_MODEL } from '@/providers/models'
import type { ProviderResponse } from '@/providers/types'
import { getApiKey, getProviderFromModel } from '@/providers/utils'

const logger = createLogger('ZelaxyArenaExecuteAPI')

export const dynamic = 'force-dynamic'

interface ArenaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ArenaExecuteBody {
  conversationId?: string
  messages?: ArenaMessage[] | string
  model?: string
  systemPrompt?: string
  tools?: unknown
  temperature?: number
  maxTokens?: number
}

/** Parse messages that may arrive as a JSON string (block long-input) or an array. */
function normalizeMessages(raw: ArenaExecuteBody['messages']): ArenaMessage[] {
  if (Array.isArray(raw)) return raw as ArenaMessage[]
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as ArenaMessage[]
    } catch {
      // Treat a plain string as a single user message
      return [{ role: 'user', content: raw }]
    }
  }
  return []
}

function ndjson(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`)
}

/**
 * ZelaxyArena execution endpoint.
 *
 * Runs an LLM completion for the ZelaxyArena block and streams the result back
 * as newline-delimited JSON events ({ type: 'chunk' } then { type: 'final' }),
 * which is the contract expected by ZelaxyArenaBlockHandler. Works for both the
 * streaming and non-streaming handler paths.
 */
export async function POST(request: NextRequest) {
  // Auth: internal service token (server-side execution) or an authenticated session.
  const authHeader = request.headers.get('authorization') || ''
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN
  const isInternal = !!serviceToken && authHeader === `Bearer ${serviceToken}`

  let userId: string | undefined
  if (!isInternal) {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = session.user.id
  }

  let body: ArenaExecuteBody
  try {
    body = (await request.json()) as ArenaExecuteBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const conversationId = body.conversationId || crypto.randomUUID()
  const model = body.model || DEFAULT_CHAT_MODEL
  const messages = normalizeMessages(body.messages)

  if (messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  let result: ProviderResponse
  try {
    const providerId = getProviderFromModel(model)
    // Resolve the provider key from the user's stored Environment Variables when present.
    const envVars = userId ? await getDecryptedEnvironmentVariables(userId) : {}
    const keyEnvVar = getProviderApiKeyEnvVar(providerId)
    const userKey = keyEnvVar ? envVars[keyEnvVar] : undefined
    const apiKey = getApiKey(providerId, model, userKey)

    const response = await executeProviderRequest(providerId, {
      model,
      systemPrompt: body.systemPrompt || '',
      messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : undefined,
      maxTokens: typeof body.maxTokens === 'number' ? body.maxTokens : undefined,
      apiKey,
      stream: false,
      environmentVariables: envVars,
    })

    // Non-streaming request returns a ProviderResponse.
    result = response as ProviderResponse
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ZelaxyArena execution failed'
    logger.error('ZelaxyArena execution failed', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const finalData = {
    content: result.content ?? '',
    model: result.model ?? model,
    conversationId,
    tokens: result.tokens ?? {},
    toolCalls: result.toolCalls ?? [],
    cost: result.cost,
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Emit the content as a single chunk (live-content path) then the final result.
      if (finalData.content) {
        controller.enqueue(ndjson({ type: 'chunk', content: finalData.content }))
      }
      controller.enqueue(ndjson({ type: 'final', data: finalData }))
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
