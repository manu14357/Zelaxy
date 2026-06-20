import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getCopilotModel } from '@/lib/copilot/config'
import { executeLocalTool, getToolsForMode } from '@/lib/copilot/tools/local-tools'
import { INTEGRATION_TOOL_DEFS } from '@/lib/copilot/tools/server-tools/actions/integration-tools'
import { ARENA_EXTRA_TOOL_DEFS } from '@/lib/copilot/tools/server-tools/tables/tables-tools'
import { getDecryptedEnvironmentVariables } from '@/lib/environment/utils'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { getProviderApiKeyEnvVar } from '@/lib/providers/api-keys'
import { saveWorkflowToNormalizedTables } from '@/lib/workflows/db-helpers'
import { db } from '@/db'
import { workflow } from '@/db/schema'
import { executeProviderRequest } from '@/providers'
import { isKnownModel } from '@/providers/models'
import { getApiKey, getProviderFromModel } from '@/providers/utils'

const logger = createLogger('ZelaxyArenaAgent')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .min(1),
  workspaceId: z.string().min(1),
  workflowId: z.string().optional(),
  // Optional user-selected model (falls back to the copilot default).
  model: z.string().optional(),
  // 'agent' (default) takes actions via tools; 'ask' answers/plans without executing anything.
  mode: z.enum(['agent', 'ask']).optional(),
  // Image attachments sent as multimodal vision content (base64 bytes or https URL).
  attachments: z
    .array(z.object({ type: z.literal('image'), data: z.string(), mediaType: z.string() }))
    .optional(),
})

const MAX_TOOL_ITERATIONS = 10

const sse = (event: Record<string, unknown>): Uint8Array =>
  new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)

/**
 * Build the ZelaxyArena system prompt with a lightweight workspace snapshot so the
 * agent can reference workflows by name (the "zelaxyarena knows your workspace" behavior).
 */
async function buildSystemPrompt(workspaceId: string, nativeThinking = false): Promise<string> {
  let workflowList = '(none yet)'
  try {
    const rows = await db
      .select({ id: workflow.id, name: workflow.name })
      .from(workflow)
      .where(eq(workflow.workspaceId, workspaceId))
      .limit(100)
    if (rows.length > 0) {
      workflowList = rows.map((r) => `- ${r.name} (id: ${r.id})`).join('\n')
    }
  } catch (e) {
    logger.warn('Failed to load workspace workflow snapshot', { e })
  }

  // With native extended thinking the model reasons in its own channel — only request an explicit
  // <thinking> block when the provider lacks native reasoning.
  const reasoningInstruction = nativeThinking
    ? ''
    : 'REASONING: for any non-trivial request (building/editing a workflow, multi-step actions, ambiguous asks), first think through your plan briefly inside a single <thinking>…</thinking> block — what the user wants, which blocks/tools to use, the order of steps — then give your answer/actions AFTER the closing tag. Keep the thinking concise. For simple questions you may skip it.\n\n'

  return `You are ZelaxyArena, the workspace-wide AI assistant for Zelaxy. You know the user's entire workspace and take action directly on their behalf.

${reasoningInstruction}You can:
- Build and edit workflows from a natural-language description (use the build_workflow / edit_workflow tools).
- Rename and delete workflows by name (rename_workflow, delete_workflow). Always confirm before deleting.
- Run a deployed workflow by name (run_workflow) — the workflow must be deployed as an API.
- Inspect the current workflow, available blocks/tools, and execution logs.
- Create, query, add, update, delete, and export workspace data tables (list_tables, query_table, create_table, insert_table_row, update_table_row, delete_table_rows, export_table). To update or delete specific rows, call query_table first to get each row's _rowId.
- List scheduled (cron) workflows in the workspace (list_scheduled_jobs).
- Create and list knowledge bases (create_knowledge_base, list_knowledge_bases).
- Take direct actions by calling external webhooks/APIs (http_request).
- Send Slack messages and emails via connected accounts (send_slack_message, send_email).
- Read and set workspace environment variables.
- Search the Zelaxy documentation.

When the user asks about data ("how many leads…", "add a row…", "create a table…"), use the table tools. Refer to tables by name.

When the user asks you to create or modify a workflow, ALWAYS use the build_workflow or edit_workflow tool with a complete YAML definition — do not just describe it. After building, briefly summarize what you created and that it has opened in the resource panel for review.

IMPORTANT — use only REAL block types. Before building a workflow, call get_blocks_and_tools to see the valid block types, and get_blocks_metadata for the exact inputs + a YAML example of each block you'll use. Never invent block types. Common ones: 'starter' (trigger), 'agent' (LLM step), 'api' (HTTP request — NOT 'api_call'), 'function' (code), 'condition'/'router' (branching), 'jina'/'firecrawl' (web scraping), 'slack'/'gmail' (messaging), 'knowledge' (RAG search).

The build_workflow YAML MUST be a single document with a top-level \`version\` and a \`blocks\` map (NOT a bare list of blocks). Exact shape:

\`\`\`yaml
version: "1.0"
blocks:
  start:
    type: starter
    name: "Start"
    inputs:
      startWorkflow: "manual"
    connections:
      outgoing:
        - target: scrape
  scrape:
    type: jina
    name: "Scrape URL"
    inputs:
      url: "{{start.input}}"
    connections:
      outgoing:
        - target: summarize
  summarize:
    type: agent
    name: "Summarize"
    inputs:
      model: "claude-sonnet-4-6"
      userPrompt: "Summarize: {{scrape.content}}"
    connections:
      outgoing:
        - target: notify
  notify:
    type: slack
    name: "Post to Slack"
    inputs:
      channel: "#general"
      text: "{{summarize.content}}"
\`\`\`

Every block lives UNDER \`blocks:\`, keyed by a short id, with \`type\` (a real block type), \`name\`, \`inputs\` (real sub-block ids), and \`connections.outgoing[].target\`. Use the per-block \`yamlExample\` from get_blocks_metadata for each block's inputs.

MODELS: for any agent/router/evaluator block's \`model\`, use ONLY a real Zelaxy model id. Valid ids include: claude-sonnet-4-6 (the default), claude-opus-4-8, claude-haiku-4-5, gpt-5.1, gpt-4o, gemini-3-pro-preview, mimo-v2.5-pro. Do NOT use dated ids (e.g. "claude-sonnet-4-20250514"), provider-prefixed ids (e.g. "anthropic/..."), or models from other platforms — they don't exist here. When unsure, use claude-sonnet-4-6.

Refer to workspace objects by name. Workflows currently in this workspace:
${workflowList}

Be concise, take initiative, and prefer doing over asking.`
}

/**
 * Persist a freshly-built workflow state as a real, openable workflow in the workspace.
 * build_workflow only produces a preview state; this turns it into a saved workflow.
 */
async function persistBuiltWorkflow(
  workspaceId: string,
  userId: string,
  workflowState: any,
  description?: string
): Promise<{ id: string; name: string } | null> {
  try {
    const id = crypto.randomUUID()
    const name = description?.trim() || 'Untitled Workflow'
    const now = new Date()

    await db.insert(workflow).values({
      id,
      userId,
      workspaceId,
      folderId: null,
      name,
      description: description ?? '',
      state: workflowState,
      color: '#3B82F6',
      lastSynced: now,
      createdAt: now,
      updatedAt: now,
      isDeployed: false,
      collaborators: [],
      runCount: 0,
      variables: {},
      isPublished: false,
      marketplaceData: null,
    })

    const saveResult = await saveWorkflowToNormalizedTables(id, workflowState)
    if (!saveResult.success) {
      logger.error('Failed to persist built workflow state to normalized tables', {
        error: saveResult.error,
      })
    }
    return { id, name }
  } catch (e) {
    logger.error('persistBuiltWorkflow failed', { e })
    return null
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await getUserEntityPermissions(session.user.id, 'workspace', body.workspaceId)
  if (permission === null) {
    return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 })
  }

  const userId = session.user.id
  const { workspaceId, workflowId } = body

  const { provider: cfgProvider, model: defaultModel } = getCopilotModel('chat')
  // Honor a user-selected model when it's a known model in the registry; otherwise default.
  const model = body.model && isKnownModel(body.model) ? body.model : defaultModel
  const provider = getProviderFromModel(model) || cfgProvider

  // Load the user's stored Environment Variables and resolve the provider's key from them, so a
  // key added via the model picker actually takes effect. Also passed into provider execution so
  // multi-key providers (e.g. Bedrock) and tools can read them.
  const envVars = await getDecryptedEnvironmentVariables(userId)
  const keyEnvVar = getProviderApiKeyEnvVar(provider)
  const userKey = keyEnvVar ? envVars[keyEnvVar] : undefined

  let apiKey: string
  try {
    apiKey = getApiKey(provider, model, userKey)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No API key configured for the assistant model',
      },
      { status: 400 }
    )
  }

  const systemPrompt = await buildSystemPrompt(workspaceId, provider === 'anthropic')
  // Ask mode answers and plans without executing anything — withhold tools so the model can't act.
  const mode = body.mode ?? 'agent'
  const tools =
    mode === 'ask'
      ? undefined
      : [...getToolsForMode('agent'), ...ARENA_EXTRA_TOOL_DEFS, ...INTEGRATION_TOOL_DEFS]
  const systemPromptForMode =
    mode === 'ask'
      ? `${systemPrompt}\n\nMODE: ASK — Do NOT call any tools or take actions. Answer questions, explain the workspace, and outline plans only. If the user asks you to build/run/change something, describe how you would do it and suggest switching to Agent mode to execute.`
      : systemPrompt

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const messages: any[] = [...body.messages]

      // Stream a text answer over `msgs`, emitting each token chunk as a `content` event so the
      // client renders it in realtime (the client appends every `content` event as it arrives).
      // Tools are withheld so this call only produces text. Falls back to a single `content` event
      // if the provider returns a non-streaming response. Returns the accumulated text.
      // Providers that emit native extended-thinking as NDJSON reasoning deltas (see the anthropic
      // provider). For these we request thinking and split reasoning vs answer into separate events.
      const useThinking = provider === 'anthropic'

      const streamAnswer = async (msgs: any[]): Promise<string> => {
        const resp: any = await executeProviderRequest(provider, {
          model,
          systemPrompt: systemPromptForMode,
          messages: msgs as any,
          temperature: 0.4,
          maxTokens: 8000,
          apiKey,
          stream: true,
          thinking: useThinking,
          attachments: body.attachments,
          workflowId,
          userId,
          workspaceId,
          environmentVariables: envVars,
          isCopilotRequest: true,
        })
        const readable: ReadableStream<any> | null =
          resp instanceof ReadableStream ? resp : (resp?.stream ?? null)
        if (!readable) {
          const text = resp?.content ?? resp?.execution?.output?.content ?? ''
          if (text) controller.enqueue(sse({ type: 'content', data: text }))
          return text
        }
        const reader = readable.getReader()
        const decoder = new TextDecoder()
        let acc = ''

        if (useThinking) {
          // NDJSON stream: one {"reasoning":"…"} or {"text":"…"} per line. Reasoning is surfaced as
          // a separate `reasoning` event; answer text as `content`. Non-JSON lines fall back to text.
          let buf = ''
          const handleLine = (line: string) => {
            const t = line.trim()
            if (!t) return
            try {
              const obj = JSON.parse(t)
              if (typeof obj.reasoning === 'string') {
                controller.enqueue(sse({ type: 'reasoning', data: obj.reasoning }))
              } else if (typeof obj.text === 'string') {
                acc += obj.text
                controller.enqueue(sse({ type: 'content', data: obj.text }))
              }
            } catch {
              acc += line
              controller.enqueue(sse({ type: 'content', data: line }))
            }
          }
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf +=
              typeof value === 'string'
                ? value
                : decoder.decode(value as Uint8Array, { stream: true })
            let nl: number
            // biome-ignore lint/suspicious/noAssignInExpressions: streaming line split
            while ((nl = buf.indexOf('\n')) >= 0) {
              handleLine(buf.slice(0, nl))
              buf = buf.slice(nl + 1)
            }
          }
          if (buf.trim()) handleLine(buf)
          return acc
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk =
            typeof value === 'string'
              ? value
              : decoder.decode(value as Uint8Array, { stream: true })
          if (chunk) {
            acc += chunk
            controller.enqueue(sse({ type: 'content', data: chunk }))
          }
        }
        return acc
      }

      try {
        // Ask mode never calls tools — stream the answer directly (single model call, realtime).
        if (mode === 'ask') {
          await streamAnswer(messages)
          controller.enqueue(sse({ type: 'done' }))
          controller.close()
          return
        }

        let iteration = 0

        // Tool-execution loop: call the model, run any tool calls, feed results back. The model
        // turn is non-streaming so tool calls are reliable; the FINAL answer (the turn with no tool
        // calls) is then streamed token-by-token via streamAnswer for realtime output.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          iteration++
          const response = (await executeProviderRequest(provider, {
            model,
            systemPrompt: systemPromptForMode,
            messages: messages as any,
            temperature: 0.4,
            maxTokens: 8000,
            apiKey,
            stream: false,
            tools,
            attachments: body.attachments,
            workflowId,
            userId,
            workspaceId,
            environmentVariables: envVars,
            isCopilotRequest: true,
          })) as any

          const toolCalls = Array.isArray(response?.toolCalls) ? response.toolCalls : []

          if (toolCalls.length === 0 || iteration > MAX_TOOL_ITERATIONS) {
            await streamAnswer(messages)
            break
          }

          // Record the assistant turn that requested the tools.
          messages.push({ role: 'assistant', content: response.content || '', toolCalls })

          for (const toolCall of toolCalls) {
            const toolCallId =
              toolCall.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
            const args = {
              ...(toolCall.arguments || {}),
              workflowId: toolCall.arguments?.workflowId || workflowId,
              userId,
              workspaceId,
            }

            controller.enqueue(
              sse({
                type: 'tool_call',
                data: { id: toolCallId, name: toolCall.name, arguments: toolCall.arguments || {} },
              })
            )

            const result = await executeLocalTool(toolCall.name, args)

            controller.enqueue(
              sse({
                type: 'tool_result',
                toolCallId,
                name: toolCall.name,
                success: result.success,
                result: JSON.stringify(result.data ?? {}),
                error: result.error ?? null,
              })
            )

            // build_workflow only yields a preview — persist it as a real, openable workflow.
            // The state may sit at result.data.workflowState (BaseCopilotTool wrap) or top-level.
            const builtState = result.data?.workflowState ?? (result as any).workflowState
            if (toolCall.name === 'build_workflow' && result.success && builtState) {
              const created = await persistBuiltWorkflow(
                workspaceId,
                userId,
                builtState,
                result.data?.description ?? (result as any).description
              )
              if (created) {
                controller.enqueue(
                  sse({ type: 'workflow_created', workflowId: created.id, name: created.name })
                )
              }
            }

            // Feed a compact tool result back to the model for the next turn.
            const resultForModel = result.success
              ? (() => {
                  const data = result.data ?? {}
                  const compact = { ...data }
                  // Drop the heavy workflowState from the model context (client uses it, model doesn't need it).
                  if (compact.workflowState) compact.workflowState = undefined
                  return JSON.stringify(compact).slice(0, 4000)
                })()
              : `Error: ${result.error}`

            messages.push({
              role: 'tool',
              name: toolCall.name,
              tool_call_id: toolCallId,
              content: resultForModel,
            })
          }
        }

        controller.enqueue(sse({ type: 'done' }))
        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ZelaxyArena agent failed'
        logger.error(`[${requestId}] agent error`, { message })
        try {
          controller.enqueue(sse({ type: 'error', error: message }))
          controller.close()
        } catch {
          // already closed
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
