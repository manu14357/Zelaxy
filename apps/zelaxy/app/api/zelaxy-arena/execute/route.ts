import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { executeLocalTool, getToolsForMode } from '@/lib/copilot/tools/local-tools'
import { INTEGRATION_TOOL_DEFS } from '@/lib/copilot/tools/server-tools/actions/integration-tools'
import { ARENA_EXTRA_TOOL_DEFS } from '@/lib/copilot/tools/server-tools/tables/tables-tools'
import { getDecryptedEnvironmentVariables } from '@/lib/environment/utils'
import { createLogger } from '@/lib/logs/console/logger'
import { getProviderApiKeyEnvVar } from '@/lib/providers/api-keys'
import { listTables } from '@/lib/table'
import { db } from '@/db'
import { knowledgeBase, workflow } from '@/db/schema'
import { executeProviderRequest } from '@/providers'
import { DEFAULT_CHAT_MODEL } from '@/providers/models'
import type { ProviderResponse } from '@/providers/types'
import { getApiKey, getProviderFromModel } from '@/providers/utils'

const logger = createLogger('ZelaxyArenaExecuteAPI')

export const dynamic = 'force-dynamic'

const MAX_TOOL_ITERATIONS = 8
const MAX_TOOL_RESULT_CHARS = 40000

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
  workspaceId?: string
  userId?: string
}

/** Compact workspace snapshot so the in-workflow agent can reference real workflows/tables/KBs. */
async function buildWorkspaceSnapshot(workspaceId: string, envVarNames: string[]): Promise<string> {
  const [wfRes, tblRes, kbRes] = await Promise.allSettled([
    db
      .select({ id: workflow.id, name: workflow.name })
      .from(workflow)
      .where(eq(workflow.workspaceId, workspaceId))
      .limit(100),
    listTables(workspaceId),
    db
      .select({ id: knowledgeBase.id, name: knowledgeBase.name })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.workspaceId, workspaceId))
      .limit(100),
  ])
  const wf =
    wfRes.status === 'fulfilled' && wfRes.value.length
      ? wfRes.value.map((r) => `- ${r.name} (id: ${r.id})`).join('\n')
      : '(none)'
  const tbl =
    tblRes.status === 'fulfilled' && tblRes.value.length
      ? (tblRes.value as any[]).map((t) => `- ${t.name} (id: ${t.id})`).join('\n')
      : '(none)'
  const kb =
    kbRes.status === 'fulfilled' && kbRes.value.length
      ? kbRes.value.map((k) => `- ${k.name} (id: ${k.id})`).join('\n')
      : '(none)'
  const env = envVarNames.length ? envVarNames.map((n) => `- ${n}`).join('\n') : '(none)'
  return `WORKSPACE SNAPSHOT (refer to these by name):\nWorkflows:\n${wf}\n\nData tables:\n${tbl}\n\nKnowledge bases:\n${kb}\n\nEnvironment variables (reference as {{NAME}}):\n${env}`
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

  // The block can run as the FULL agent (tools + workspace snapshot) when it has workspace context.
  // Internal (block) calls authenticate via the service token, so the userId arrives in the body.
  const effectiveUserId = userId || body.userId
  const workspaceId = body.workspaceId
  const runAsAgent = !!workspaceId

  let result: ProviderResponse
  const allToolCalls: any[] = []
  try {
    const providerId = getProviderFromModel(model)
    // Resolve the provider key from the user's stored Environment Variables when present.
    const envVars = effectiveUserId ? await getDecryptedEnvironmentVariables(effectiveUserId) : {}
    const keyEnvVar = getProviderApiKeyEnvVar(providerId)
    const userKey = keyEnvVar ? envVars[keyEnvVar] : undefined
    const apiKey = getApiKey(providerId, model, userKey)

    let systemPrompt = body.systemPrompt || ''
    const tools = runAsAgent
      ? [
          // No open canvas here either — use the deployed-by-name run_workflow from ARENA_EXTRA.
          ...getToolsForMode('agent').filter((t) => t.id !== 'run_workflow'),
          ...ARENA_EXTRA_TOOL_DEFS,
          ...INTEGRATION_TOOL_DEFS,
        ]
      : undefined

    if (runAsAgent && workspaceId) {
      const snapshot = await buildWorkspaceSnapshot(workspaceId, Object.keys(envVars))
      systemPrompt = `${systemPrompt}\n\n${snapshot}`.trim()
    }

    const baseReq = {
      model,
      systemPrompt,
      temperature: typeof body.temperature === 'number' ? body.temperature : undefined,
      maxTokens: typeof body.maxTokens === 'number' ? body.maxTokens : undefined,
      apiKey,
      stream: false as const,
      environmentVariables: envVars,
      ...(workspaceId ? { workspaceId } : {}),
      ...(effectiveUserId ? { userId: effectiveUserId } : {}),
    }

    // Agentic loop: let the model call tools (build workflows, query tables, integrations) until it
    // produces a final text answer. Non-agent blocks fall through to a single completion.
    const convo: ArenaMessage[] = [...messages]
    let response = (await executeProviderRequest(providerId, {
      ...baseReq,
      messages: convo,
      tools,
    } as any)) as ProviderResponse

    if (runAsAgent) {
      let iteration = 0
      while (
        response.toolCalls &&
        response.toolCalls.length > 0 &&
        iteration < MAX_TOOL_ITERATIONS
      ) {
        iteration++
        convo.push({ role: 'assistant', content: response.content || '' })
        for (const call of response.toolCalls) {
          const args = (call as any).arguments || {}
          const enriched = {
            ...args,
            ...(workspaceId ? { workspaceId } : {}),
            ...(effectiveUserId ? { userId: effectiveUserId } : {}),
          }
          const toolResult = await executeLocalTool((call as any).name, enriched)
          allToolCalls.push({ name: (call as any).name, success: toolResult.success })
          const resultStr = JSON.stringify(toolResult.data ?? toolResult.error ?? {}).slice(
            0,
            MAX_TOOL_RESULT_CHARS
          )
          convo.push({ role: 'user', content: `Tool ${(call as any).name} result:\n${resultStr}` })
        }
        response = (await executeProviderRequest(providerId, {
          ...baseReq,
          messages: convo,
          tools,
        } as any)) as ProviderResponse
      }
    }

    result = response
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
    toolCalls: allToolCalls.length ? allToolCalls : (result.toolCalls ?? []),
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
