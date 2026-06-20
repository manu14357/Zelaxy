import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { getBaseUrl } from '@/lib/urls/utils'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'
import { db } from '@/db'
import { workflow } from '@/db/schema'
import { processWorkflowExecution } from '@/worker/processor'

const logger = createLogger('A2AAgentAPI')

export const dynamic = 'force-dynamic'

/**
 * Agent-to-Agent (A2A) protocol endpoint — exposes a deployed Zelaxy workflow as an A2A agent.
 *
 *   GET  /api/a2a/{workflowId}   → the AgentCard (capability descriptor).
 *   POST /api/a2a/{workflowId}   → JSON-RPC 2.0; supports `message/send` (runs the workflow with the
 *                                  message text as input and returns the result as an A2A message).
 *
 * Auth reuses the v1 API-key middleware. The discovery card is also reachable at
 * `…/{workflowId}` per the A2A "agent URL" convention.
 */

interface ResolvedWorkflow {
  id: string
  name: string
  description: string | null
  userId: string
  workspaceId: string | null
  isDeployed: boolean
}

async function resolveWorkflow(
  request: NextRequest,
  workflowId: string
): Promise<
  { ok: true; userId: string; wf: ResolvedWorkflow } | { ok: false; response: NextResponse }
> {
  const rateLimit = await checkRateLimit(request, 'workflow-detail')
  if (!rateLimit.allowed) return { ok: false, response: createRateLimitResponse(rateLimit) }
  const userId = rateLimit.userId!

  const [wf] = await db
    .select({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      userId: workflow.userId,
      workspaceId: workflow.workspaceId,
      isDeployed: workflow.isDeployed,
    })
    .from(workflow)
    .where(eq(workflow.id, workflowId))
    .limit(1)

  if (!wf) {
    return { ok: false, response: NextResponse.json({ error: 'Agent not found' }, { status: 404 }) }
  }
  if (wf.workspaceId) {
    const accessError = await validateWorkspaceAccess(rateLimit, userId, wf.workspaceId)
    if (accessError) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Agent not found' }, { status: 404 }),
      }
    }
  } else if (wf.userId !== userId) {
    return { ok: false, response: NextResponse.json({ error: 'Agent not found' }, { status: 404 }) }
  }
  return { ok: true, userId, wf }
}

function buildAgentCard(wf: ResolvedWorkflow) {
  const url = `${getBaseUrl()}/api/a2a/${wf.id}`
  return {
    protocolVersion: '0.3.0',
    name: wf.name,
    description: wf.description || `Zelaxy workflow "${wf.name}" exposed as an A2A agent`,
    url,
    preferredTransport: 'JSONRPC',
    version: '1.0.0',
    capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
      {
        id: wf.id,
        name: wf.name,
        description: wf.description || `Run the ${wf.name} workflow`,
        tags: ['workflow'],
        examples: [],
      },
    ],
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params
  const resolved = await resolveWorkflow(request, workflowId)
  if (!resolved.ok) return resolved.response
  return NextResponse.json(buildAgentCard(resolved.wf))
}

/** Extract the plain-text content from an A2A message's parts. */
function extractText(message: any): string {
  const parts = Array.isArray(message?.parts) ? message.parts : []
  return parts
    .filter((p: any) => p?.kind === 'text' || typeof p?.text === 'string')
    .map((p: any) => p.text)
    .join('\n')
    .trim()
}

function jsonRpcError(id: unknown, code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, { status })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params
  const resolved = await resolveWorkflow(request, workflowId)
  if (!resolved.ok) return resolved.response
  const { wf } = resolved

  let rpc: any
  try {
    rpc = await request.json()
  } catch {
    return jsonRpcError(null, -32700, 'Parse error')
  }

  const { id, method, params } = rpc || {}
  if (rpc?.jsonrpc !== '2.0' || !method) {
    return jsonRpcError(id, -32600, 'Invalid Request')
  }

  if (method !== 'message/send') {
    return jsonRpcError(id, -32601, `Method not found: ${method}`)
  }

  if (!wf.isDeployed) {
    return jsonRpcError(id, -32000, 'Agent is not deployed')
  }

  const text = extractText(params?.message)
  if (!text) {
    return jsonRpcError(id, -32602, 'Invalid params: message has no text content')
  }

  try {
    const result = await processWorkflowExecution({
      workflowId: wf.id,
      userId: wf.userId,
      input: { input: text },
      triggerType: 'a2a',
    })

    const output = result.output
    const outText =
      typeof output === 'string'
        ? output
        : typeof output?.content === 'string'
          ? output.content
          : JSON.stringify(output ?? {})

    // A2A success → a Message from the agent.
    return NextResponse.json({
      jsonrpc: '2.0',
      id: id ?? null,
      result: {
        kind: 'message',
        role: 'agent',
        messageId: result.executionId,
        parts: [{ kind: 'text', text: outText }],
      },
    })
  } catch (error: any) {
    logger.error('A2A workflow execution failed', { workflowId, error: error?.message })
    return jsonRpcError(id, -32000, error?.message || 'Agent execution failed')
  }
}
