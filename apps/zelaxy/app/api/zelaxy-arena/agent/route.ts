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
import { listTables } from '@/lib/table'
import {
  loadWorkflowFromNormalizedTables,
  saveWorkflowToNormalizedTables,
} from '@/lib/workflows/db-helpers'
import { db } from '@/db'
import { account, knowledgeBase, workflow } from '@/db/schema'
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
  // Resources the user @-mentioned in the composer — resolved to real content server-side.
  contexts: z.array(z.object({ type: z.string(), id: z.string(), label: z.string() })).optional(),
})

/**
 * Resolve @-mentioned workspace resources into real content the agent can use, so "edit this
 * workflow" / "use this data" actually carries the referenced content (not just a name + id).
 */
async function resolveMentionedContexts(
  contexts: Array<{ type: string; id: string; label: string }> | undefined
): Promise<string> {
  if (!contexts || contexts.length === 0) return ''
  const parts: string[] = []
  for (const ctx of contexts.slice(0, 8)) {
    try {
      if (ctx.type === 'workflow') {
        const state: any = await loadWorkflowFromNormalizedTables(ctx.id)
        if (state?.blocks) {
          const blocks = Object.values(state.blocks)
            .map((b: any) => `  - ${b.name} (${b.type}, id: ${b.id})`)
            .join('\n')
          parts.push(`Workflow "${ctx.label}" (id: ${ctx.id}) — current blocks:\n${blocks}`)
        } else {
          parts.push(`Workflow "${ctx.label}" (id: ${ctx.id})`)
        }
      } else {
        // knowledge / file — name the resource; the agent has tools to read it on demand.
        parts.push(`${ctx.type} "${ctx.label}" (id: ${ctx.id})`)
      }
    } catch {
      parts.push(`${ctx.type} "${ctx.label}" (id: ${ctx.id})`)
    }
  }
  return parts.length > 0
    ? `REFERENCED RESOURCES (the user @-mentioned these — act on them):\n${parts.join('\n')}`
    : ''
}

// No iteration cap: the tool-execution loop runs until the model stops calling tools (task done),
// the client presses Stop, or the platform request budget (maxDuration) is hit. A fixed cap used to
// cut long multi-step tasks (deep research + many table inserts) off mid-work. Runaway identical
// loops are still prevented by the exact-args dedup cache (executedToolCalls) below.
//
// Per-tool-result cap. Generous enough that batched metadata / a full page scrape is never
// truncated mid-result (which made the model re-fetch and burn extra tool calls), but NOT so large
// that one result can blow the model's context window. Total accumulated tool output across the
// (uncapped) loop is bounded separately by compactHistory() below.
const MAX_TOOL_RESULT_CHARS = 100_000
// Because the tool loop is uncapped, tool results would otherwise pile up in `messages` every
// iteration until they overflow the model's context window — which surfaces as the agent "stopping
// mid-response" (the provider throws a context-length error). compactHistory() keeps the total live
// tool output under this budget by shrinking the OLDEST tool results to a short placeholder, so a
// long task can run for as many steps as it needs. ~75k tokens of tool output stays live at once.
const MAX_HISTORY_TOOL_CHARS = 300_000
// Never shrink the most recent N tool results — those are the ones the model needs for its next step.
const KEEP_RECENT_TOOL_RESULTS = 6
const TRIMMED_MARKER = '[older tool result trimmed to fit context]'

// Bound the running context so an uncapped, many-step run never overflows the model window. Only the
// CONTENT of the oldest `tool` messages is shortened; message order and assistant↔tool pairing are
// preserved (required by every provider), and user/assistant/system turns are never touched.
function compactHistory(messages: any[]): void {
  const toolIdxs: number[] = []
  for (let i = 0; i < messages.length; i++) {
    if (messages[i]?.role === 'tool' && typeof messages[i].content === 'string') toolIdxs.push(i)
  }
  let total = 0
  for (const i of toolIdxs) total += messages[i].content.length
  if (total <= MAX_HISTORY_TOOL_CHARS) return
  const trimmable = toolIdxs.slice(0, Math.max(0, toolIdxs.length - KEEP_RECENT_TOOL_RESULTS))
  for (const i of trimmable) {
    if (total <= MAX_HISTORY_TOOL_CHARS) break
    const original = messages[i].content as string
    if (original.startsWith(TRIMMED_MARKER)) continue
    messages[i] = {
      ...messages[i],
      content: `${TRIMMED_MARKER} (${original.length} chars omitted; re-run the tool if you still need this data)`,
    }
    total = total - original.length + messages[i].content.length
  }
}

const sse = (event: Record<string, unknown>): Uint8Array =>
  new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)

/**
 * Build the ZelaxyArena system prompt with a lightweight workspace snapshot so the
 * agent can reference workflows by name (the "zelaxyarena knows your workspace" behavior).
 */
async function buildSystemPrompt(
  workspaceId: string,
  nativeThinking = false,
  envVarNames: string[] = [],
  userId?: string
): Promise<string> {
  // Pre-fetch the whole workspace snapshot in parallel and embed it below, so the agent does NOT
  // have to spend tool calls discovering what exists (the slow "list_tables / get_env / list_kb"
  // round-trips). Mirrors how the reference agent loads workspace state once, up front.
  let workflowList = '(none yet)'
  let tableList = '(none yet)'
  let kbList = '(none yet)'
  let accountList = '(none connected)'
  const [workflowRes, tableRes, kbRes, accountRes] = await Promise.allSettled([
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
    userId
      ? db
          .select({
            id: account.id,
            providerId: account.providerId,
            accountId: account.accountId,
          })
          .from(account)
          .where(eq(account.userId, userId))
          .limit(100)
      : Promise.resolve([]),
  ])
  if (workflowRes.status === 'fulfilled' && workflowRes.value.length > 0) {
    workflowList = workflowRes.value.map((r) => `- ${r.name} (id: ${r.id})`).join('\n')
  }
  if (tableRes.status === 'fulfilled' && tableRes.value.length > 0) {
    tableList = tableRes.value
      .map((t: any) => {
        const cols = (t.schema?.columns ?? []).map((c: any) => `${c.name}:${c.type}`).join(', ')
        return `- ${t.name} (id: ${t.id})${cols ? ` — columns: ${cols}` : ''}`
      })
      .join('\n')
  }
  if (kbRes.status === 'fulfilled' && kbRes.value.length > 0) {
    kbList = kbRes.value.map((k) => `- ${k.name} (id: ${k.id})`).join('\n')
  }
  if (accountRes.status === 'fulfilled' && Array.isArray(accountRes.value)) {
    // Connected OAuth integrations (exclude the email/password login row). The `id` is the
    // credentialId the integration tools (Slack/Gmail/etc.) need to pick the right account.
    const integrations = (accountRes.value as any[]).filter(
      (a) => a.providerId && a.providerId !== 'credential'
    )
    if (integrations.length > 0) {
      accountList = integrations
        .map((a) => `- ${a.providerId} (account: ${a.accountId}, credentialId: ${a.id})`)
        .join('\n')
    }
  }
  const envList = envVarNames.length > 0 ? envVarNames.map((n) => `- ${n}`).join('\n') : '(none)'

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
- Inspect/analyze a workflow the user REFERENCES — its definition and recent execution logs (get_user_workflow, get_workflow_console). The arena has NO "current" workflow: a workflow is only in scope if the user @-mentioned it (by name) or you just built one this turn. If the user asks to analyze "the workflow" but hasn't referenced one, ASK them which workflow (tell them to @-mention it) — do NOT call the inspect tools with no workflow, they'll just error.
- Create, query, add, update, delete, and export workspace data tables (list_tables, query_table, create_table, insert_table_row, update_table_row, delete_table_rows, export_table). To update or delete specific rows, call query_table first to get each row's _rowId.
- List scheduled (cron) workflows in the workspace (list_scheduled_jobs).
- Create and list knowledge bases (create_knowledge_base, list_knowledge_bases).
- Take direct actions by calling external webhooks/APIs (http_request).
- Send Slack messages and emails via connected accounts (send_slack_message, send_email).
- Read and set workspace environment variables.
- Search the Zelaxy documentation.
- RESEARCH anything: search the web (search_online), get a specific page's contents (scrape_page), or crawl a whole site (crawl_website). Figure out the best approach — search first, then get the contents of the most relevant page(s); crawl only when you need many pages. Cite the sources (URLs) you used.
- Create FILES & DOCUMENTS in the workspace from text (create_file — e.g. a research report, notes, markdown, or CSV) and append to them (append_file). Use a clear name with an extension. When you research a topic and produce a substantial answer, save it as a document with create_file (a descriptive ".md" name) so the user keeps it — the document opens in the side panel.

When the user asks about data ("how many leads…", "add a row…", "create a table…"), use the table tools. Refer to tables by name.

When the user asks you to create or modify a workflow, ALWAYS use the build_workflow or edit_workflow tool with a complete YAML definition — do not just describe it. Call build_workflow once with the complete, correct YAML. If the result contains \`workflowLint\` warnings or \`inputValidationErrors\`, FIX exactly those issues (e.g. a reference to a block that doesn't exist, a missing required field, a bad schedule) and call build_workflow ONE more time with the corrected YAML — then stop. Do NOT otherwise rebuild to "refine" unless the user asks. After it's clean, briefly summarize what you created and that it has opened in the resource panel for review.

IMPORTANT — use only REAL block types. Before building a workflow, call get_blocks_and_tools to see the valid block types, and get_blocks_metadata for the exact inputs + a YAML example of each block you'll use. Never invent block types or inputs. Common ones: 'starter' (manual/API run), 'agent' (LLM step), 'api' (HTTP request — NOT 'api_call'), 'function' (code), 'condition'/'router' (branching), 'jina'/'firecrawl' (web scraping), 'slack'/'gmail' (messaging), 'knowledge' (RAG search).

TRIGGERS — pick the right ENTRY block for HOW the workflow starts (exactly one):
- Runs on a SCHEDULE ("every hour", "daily", cron, recurring) → use the \`schedule\` trigger block as the first block. The \`starter\` block does NOT have a schedule/cron/triggerConfig input — never put scheduling on \`starter\`. Fetch the \`schedule\` block's metadata for its exact cron/interval inputs.
- Runs manually or via API → \`starter\` (startWorkflow: manual).
- Triggered by an incoming event (webhook / chat / incoming email) → the matching trigger block (\`webhook\`, \`api_trigger\`, \`chat_trigger\`, or a provider block in trigger mode).

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

BRANCHING (condition / router blocks) — a \`condition\` block has exactly THREE connections: ONE incoming edge (the block feeding into it) plus TWO outgoing branches — \`if\` (true) and \`else\` (false). Each branch is its own output, so a plain \`outgoing.target\` SILENTLY FAILS TO CONNECT (the path dead-ends) — you MUST wire the branches under \`connections.conditions\`, keyed by \`if\` / \`else if\` / \`else\`. ALWAYS connect BOTH \`if\` AND \`else\` to a real downstream block (a condition with one branch left dangling looks broken on the canvas):
\`\`\`yaml
  gate:
    type: condition
    name: "Has updates?"
    inputs:
      conditions:
        if: "{{format.result.hasUpdates}} == true"   # inputs.conditions is a MAP keyed by branch
    connections:
      conditions:
        if: store_rows      # runs when the condition is true
        else: done          # runs otherwise (omit if nothing should run)
\`\`\`
The branch keys in \`inputs.conditions\` and \`connections.conditions\` MUST match (\`if\` / \`else if\` / \`else\`). Only branch when the user needs a real fork — for a simple linear "do A then B then C", connect blocks straight through with \`outgoing\` and DON'T add a condition.

USE DEDICATED INTEGRATION BLOCKS, not raw \`api\`, when one exists: to message Telegram use the \`telegram\` block (inputs: botToken, chatId, text) — NOT an \`api\` POST to api.telegram.org. Likewise prefer \`slack\`, \`gmail\`, etc. over hand-built HTTP. Only use the \`api\` block when there is no dedicated block for that service.

BLOCK-OUTPUT REFERENCES (critical — this is where workflows silently break): to use one block's output in another, write \`{{<blockKey>.<field>}}\` where \`<blockKey>\` is the EXACT key you gave that block under \`blocks:\` (e.g. \`scrape\`, \`summarize\` — NOT a made-up name like \`search_sk\`), and \`<field>\` is a REAL output of that block per its get_blocks_metadata \`outputs\` (e.g. a jina/firecrawl block outputs \`.content\`; an api outputs \`.data\` — do NOT invent fields like \`.context\` or \`.result\`). An \`agent\` block's output depends on whether you set \`responseFormat\` (see AGENT / LLM BLOCKS below) — do NOT assume \`.content\` exists on an agent block without checking that. Every \`{{x.y}}\` you write MUST point at a block key that exists in THIS YAML. If you have three scrape blocks, give them distinct keys (e.g. \`scrape_sk\`, \`scrape_ats\`, \`scrape_tas\`) and reference each by its own key. The build result's \`workflowLint\` flags any reference whose block doesn't exist — fix those.

FUNCTION BLOCK CODE (JavaScript) — the \`{{...}}\` reference form above is for normal inputs (text, url, rows, prompts). Inside a \`function\` block's \`code\` you read an upstream block's output from the provided \`inputs\` object, keyed by that block's \`name\`: e.g. \`const data = inputs['Scrape Page'].content\` for a jina/firecrawl block (use bracket notation with the EXACT \`name\` you gave the block; \`inputs.myblock\` also works if the name is a single lowercase word). For an \`agent\` block upstream, follow the SAME rule as above — with \`responseFormat\` set, read the schema fields directly (\`inputs['Extract News'].articles\`, NOT \`inputs['Extract News'].content\` followed by \`JSON.parse\` — \`.content\` does not exist in that case and JSON.parse on it throws \`"undefined" is not valid JSON\`); without \`responseFormat\`, \`.content\` is a plain string (JSON.parse it yourself if you asked the model for JSON in the prompt). Environment variables are on \`environment\`: \`environment.MY_API_KEY\`. NEVER reference \`params\`, \`data\`, \`context\`, a bare block key, or any variable you didn't declare — only \`inputs\`, \`environment\`, \`console\`, and \`fetch\` are available, and using anything else throws "X is not defined". The block returns an object (\`return { rows, hasUpdates }\`); reference its fields downstream as \`{{<functionKey>.result.<field>}}\` (a function's output is always under \`.result\`).

AGENT / LLM BLOCKS: do NOT set a small \`timeout\` or \`maxTokens\` — leave them UNSET so safe defaults apply. A \`timeout\` of 10 (seconds) aborts a real model call with "signal timed out"; a \`maxTokens\` of 100 truncates the output and breaks any downstream JSON parsing. Only set them if the user explicitly asks, and then keep them generous (timeout ≥ 60, maxTokens ≥ 4000).

AGENT OUTPUT SHAPE — WITHOUT \`responseFormat\`: the output is \`{ content: "<model's text>", model, tokens, toolCalls }\` — downstream blocks read \`{{<blockKey>.content}}\`. WITH \`responseFormat\` set and the model returns valid JSON matching it: there is NO \`.content\` field at all — the parsed JSON's fields replace it directly on the output. E.g. a responseFormat schema \`{ type: "object", properties: { articles: { type: "array", ... } } }\` produces an output shaped \`{ articles: [...], tokens, toolCalls }\` — reference it downstream as \`{{<blockKey>.articles}}\`, and inside a function block as \`inputs['<Agent Block Name>'].articles\` — NEVER \`.content\` and NEVER \`JSON.parse(...)\` on it (there is nothing to parse; it is already a real object). This is the single most common cause of a workflow failing at its last step with "undefined is not valid JSON" — when you use \`responseFormat\` on an agent, make every downstream reference to that agent use the schema's actual top-level property names, not \`.content\`.

SCHEDULES: for a recurring run, the FIRST block is a \`schedule\` trigger. Express the cadence as a cron expression in its config — e.g. every 6 hours = \`0 */6 * * *\`, hourly = \`0 * * * *\`, daily 9am = \`0 9 * * *\`. Fetch the \`schedule\` block's metadata for the exact input ids (e.g. \`scheduleType: "custom"\` + \`cronExpression: "0 */6 * * *"\`), and set BOTH so it actually saves.

WORKFLOW VARIABLES vs TABLES: \`{{VAR}}\` (no dot) = a workspace environment variable/secret. \`{{variable.<name>}}\` = a workflow variable (declared in a \`variables\` block).

STORING ROWS IN A DATA TABLE — the exact flow (the table id is NOT something a function holds; it lives in the \`table\` block):
1. If the workflow needs to store into a table that doesn't exist yet, call create_table FIRST — it returns \`{ id, name }\`.
2. In the build_workflow YAML, add a \`table\` block (NOT a function — a function only transforms data and has NO table access; NOT an agent — it can't write rows) with \`inputs: { operation: "batch_insert_rows" (for an array of rows) or "insert_row", tableId: "<the table>", rows/data: "{{<prevBlock>.<field>}}" }\`.
3. For \`tableId\` you may put EITHER the id returned by create_table OR the table's NAME — build_workflow resolves a name to the real id automatically. So a \`function\` that shapes rows feeds the \`table\` block (\`rows: "{{format.result}}"\`); the \`table\` block does the actual write using its \`tableId\`.
Do this in ONE turn: create_table, then build_workflow referencing that table. Don't reference a table/variable you didn't create. Get the \`table\` block's metadata for its exact inputs.

MODELS: for any agent/router/evaluator block's \`model\`, use ONLY a real Zelaxy model id. Valid ids include: claude-sonnet-5 (the default), claude-fable-5, claude-opus-4-8, claude-haiku-4-5, gpt-5.6-terra, gpt-5.1, gpt-4o, gemini-3.5-flash, gemini-3.1-pro-preview, deepseek-v4-flash, mimo-v2.5-pro. Do NOT use dated ids (e.g. "claude-sonnet-4-20250514"), provider-prefixed ids (e.g. "anthropic/..."), or models from other platforms — they don't exist here. When unsure, use claude-sonnet-5.

VARIABLES & SECRETS: reference an environment variable / API key / secret with double braces — \`{{VARIABLE_NAME}}\` — e.g. an apiKey input: \`apiKey: "{{OPENAI_API_KEY}}"\`, or a token: \`botToken: "{{TELEGRAM_BOT_TOKEN}}"\`. This is the ONLY valid syntax. NEVER inline a real secret value, and NEVER use any other form (\`env.X\`, \`$X\`, \`process.env.X\`, \`\${X}\`, \`{X}\`, or a bare name). Block-output references use the same \`{{block.field}}\` form shown above. The available variable names are in the WORKSPACE SNAPSHOT below — reference those names verbatim; only call get_environment_variables if you need a name not listed.

WORKSPACE SNAPSHOT — current state, already loaded for you. Do NOT spend tool calls rediscovering this. Refer to these objects by name. Only call list_tables / get_environment_variables / list_knowledge_bases when you need FRESH row data or values beyond what's shown here.

Workflows:
${workflowList}

Data tables:
${tableList}

Knowledge bases:
${kbList}

Connected integrations (OAuth accounts — pass the credentialId when an integration tool needs an account):
${accountList}

Environment variables (names only — reference as {{NAME}}):
${envList}

EFFICIENCY — minimize tool calls so builds are fast:
- get_blocks_metadata accepts an ARRAY of block ids. Call it ONCE with ALL the blocks you'll use in a single batch — never per-block, never repeatedly. One call returns full metadata for every requested block.
- Call get_blocks_and_tools at most once. Do NOT call search_documentation unless block metadata is genuinely insufficient for what you need.
- Never re-list workflows/tables/knowledge bases/env vars that already appear in the snapshot above.

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

  const systemPrompt = await buildSystemPrompt(
    workspaceId,
    provider === 'anthropic',
    Object.keys(envVars),
    userId
  )
  // Ask mode answers and plans without executing anything — withhold tools so the model can't act.
  const mode = body.mode ?? 'agent'
  const tools =
    mode === 'ask'
      ? undefined
      : [
          // ZelaxyArena has no "open canvas", so drop the editor's run_workflow (open-canvas) tool —
          // the workspace agent uses the DEPLOYED-by-name run_workflow from ARENA_EXTRA_TOOL_DEFS.
          ...getToolsForMode('agent').filter((t) => t.id !== 'run_workflow'),
          ...ARENA_EXTRA_TOOL_DEFS,
          ...INTEGRATION_TOOL_DEFS,
        ]
  const systemPromptForMode =
    mode === 'ask'
      ? `${systemPrompt}\n\nMODE: ASK — Do NOT call any tools or take actions. Answer questions, explain the workspace, and outline plans only. If the user asks you to build/run/change something, describe how you would do it and suggest switching to Agent mode to execute.`
      : systemPrompt

  // Resolve any @-mentioned resources into real content and prepend it to the last user message
  // (scoped to this turn — not persisted to the displayed history).
  const resolvedContext = await resolveMentionedContexts(body.contexts)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const messages: any[] = [...body.messages]
      if (resolvedContext) {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            messages[i] = {
              ...messages[i],
              content: `${resolvedContext}\n\n${messages[i].content}`,
            }
            break
          }
        }
      }

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
          maxTokens: 16000,
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

        // Remember exact (tool + args) calls so a model that re-requests identical data (some
        // smaller models loop on this) gets the cached result + a nudge instead of a wasted turn.
        const executedToolCalls = new Map<string, string>()
        // The workflow persisted this turn (if any). If the model rebuilds, we UPDATE this one
        // instead of inserting a duplicate.
        let persistedWorkflowId: string | null = null
        // True once a build_workflow call has succeeded with NO lint/validation issues to fix. The
        // system prompt already says "call build_workflow once... do NOT rebuild unless asked", but
        // some models (small/budget ones especially) ignore it and immediately re-run the entire
        // build for no reason — regenerating slightly different YAML each time, so the exact-args
        // dedup above never catches it. A clean build has nothing left to fix, so any further
        // build_workflow/edit_workflow call this turn is redundant work, not a legitimate retry.
        let cleanBuildDone = false

        // A workflow the user @-mentioned (e.g. "analyze @My Workflow"). Lets read/inspect tools
        // (get_user_workflow, get_workflow_console, run_workflow, edit_workflow) target it when
        // nothing was built this turn — the arena otherwise has no ambient workflow.
        const mentionedWorkflowId = body.contexts?.find((c) => c.type === 'workflow')?.id

        // Tool-execution loop: call the model, run any tool calls, feed results back. The model
        // turn is non-streaming so tool calls are reliable. When the model stops calling tools, its
        // turn already contains the final answer — we emit THAT directly (no extra model call).
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // Server-authoritative abort: if the client stopped, don't run another LLM/tool round.
          if (req.signal.aborted) {
            logger.info('ZelaxyArena request aborted — stopping tool loop')
            break
          }
          // Keep the accumulated context under the model window so a long, many-step run never
          // overflows and stops mid-response — trims the oldest tool results in place.
          compactHistory(messages)
          // Start this turn's text as a fresh segment, then stream the model's narration token-by-
          // token via `onStreamText` (supporting providers emit text deltas live while still
          // returning tool calls unexecuted). `streamedText` tracks whether anything streamed so we
          // don't re-emit the whole content afterwards.
          controller.enqueue(sse({ type: 'segment_break' }))
          let streamedText = false
          const onStreamText = async (delta: string) => {
            if (!delta) return
            streamedText = true
            controller.enqueue(sse({ type: 'content', data: delta }))
            // Flush this delta to the socket before the next one so the text streams visibly instead
            // of buffering into one write (the reference's per-event setImmediate flush).
            await new Promise<void>((r) => setImmediate(r))
          }
          // Stream a document's content LIVE into the side panel as the model writes it (the file is
          // persisted later, when the create_file tool actually runs).
          const onFileStream = async (info: { name?: string; delta: string }) => {
            controller.enqueue(
              sse({ type: 'file_stream', name: info.name ?? null, delta: info.delta })
            )
            await new Promise<void>((r) => setImmediate(r))
          }

          const response = (await executeProviderRequest(provider, {
            model,
            systemPrompt: systemPromptForMode,
            // Generous output budget so a large document (create_file with a long .md body) isn't
            // truncated mid-content. It's a ceiling, not a fixed cost — short turns spend far less.
            maxTokens: 32000,
            messages: messages as any,
            temperature: 0.4,
            apiKey,
            stream: false,
            tools,
            attachments: body.attachments,
            workflowId,
            userId,
            workspaceId,
            environmentVariables: envVars,
            isCopilotRequest: true,
            onStreamText,
            onFileStream,
          })) as any

          const toolCalls = Array.isArray(response?.toolCalls) ? response.toolCalls : []

          if (toolCalls.length === 0) {
            // Final answer. If it already streamed live via onStreamText, it's on screen. Otherwise
            // the provider returned it whole (no live streaming this turn) — re-stream it token-by-
            // token via the reliable no-tools streaming path so the user always sees it type in.
            if (!streamedText) {
              await streamAnswer(messages)
            }
            break
          }

          // Record the assistant turn that requested the tools.
          messages.push({ role: 'assistant', content: response.content || '', toolCalls })

          // The pre-tool narration ("Let me pull the latest updates…") — already on screen if it
          // streamed live; otherwise emit it whole so the client can interleave it with the tool
          // groups that follow (the reference's messaging flow).
          if (!streamedText) {
            const interimText = typeof response.content === 'string' ? response.content.trim() : ''
            if (interimText) {
              controller.enqueue(sse({ type: 'content', data: interimText }))
              await new Promise((r) => setTimeout(r, 0))
            }
          }

          for (const toolCall of toolCalls) {
            const toolCallId =
              toolCall.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
            const args = {
              ...(toolCall.arguments || {}),
              // edit_workflow/run_workflow target the workflow JUST built this turn when the model
              // didn't supply an id — otherwise they fail with "workflowId is required" because the
              // arena has no ambient workflow context. `persistedWorkflowId` is set by build_workflow.
              workflowId:
                toolCall.arguments?.workflowId ||
                persistedWorkflowId ||
                workflowId ||
                mentionedWorkflowId,
              userId,
              workspaceId,
              // Make workspace-configured API keys (set in the in-app Environment Variables) available
              // to research/integration tools, which otherwise only see process env. Workspace keys
              // win; tools fall back to process env when a key isn't set here.
              _env: {
                EXA_API_KEY: envVars.EXA_API_KEY,
                SERPER_API_KEY: envVars.SERPER_API_KEY,
                JINA_API_KEY: envVars.JINA_API_KEY,
                FIRECRAWL_API_KEY: envVars.FIRECRAWL_API_KEY,
                TAVILY_API_KEY: envVars.TAVILY_API_KEY,
              },
            }

            controller.enqueue(
              sse({
                type: 'tool_call',
                data: { id: toolCallId, name: toolCall.name, arguments: toolCall.arguments || {} },
              })
            )

            // If the model re-requests the exact same call, return the cached result + a nudge to
            // stop re-fetching and proceed — avoids re-running the tool and breaks repeat loops.
            const dedupeKey = `${toolCall.name}:${JSON.stringify(toolCall.arguments ?? {})}`
            const cached = executedToolCalls.get(dedupeKey)
            if (cached !== undefined) {
              controller.enqueue(
                sse({
                  type: 'tool_result',
                  toolCallId,
                  name: toolCall.name,
                  success: true,
                  result: cached,
                })
              )
              messages.push({
                role: 'tool',
                name: toolCall.name,
                tool_call_id: toolCallId,
                content:
                  `You already called ${toolCall.name} with these exact arguments. Here is the same result again — do NOT call it a third time; use it and proceed with the task.\n${cached}`.slice(
                    0,
                    MAX_TOOL_RESULT_CHARS
                  ),
              })
              continue
            }

            // A model that ignores "call build_workflow once" and immediately re-runs the entire
            // build regenerates slightly different YAML each time (so the exact-args dedup above
            // never matches) even though the prior build already succeeded with nothing left to fix.
            // Skip re-running the (expensive) YAML conversion — tell the model it's done instead.
            if (toolCall.name === 'build_workflow' && persistedWorkflowId && cleanBuildDone) {
              const nudge = JSON.stringify({
                success: true,
                message:
                  'You already successfully built this workflow and it has no outstanding lint or validation issues — it is DONE. Do not call build_workflow again this turn; summarize what you created and stop.',
                workflowId: persistedWorkflowId,
              })
              controller.enqueue(
                sse({
                  type: 'tool_result',
                  toolCallId,
                  name: toolCall.name,
                  success: true,
                  result: nudge,
                })
              )
              messages.push({
                role: 'tool',
                name: toolCall.name,
                tool_call_id: toolCallId,
                content: nudge,
              })
              continue
            }

            // Don't run a state-mutating tool after the user pressed Stop.
            if (req.signal.aborted) break

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
              const desc = result.data?.description ?? (result as any).description
              const lintIssues = (result.data as any)?.workflowLint?.length ?? 0
              const validationIssues = (result.data as any)?.inputValidationErrors?.length ?? 0
              if (lintIssues === 0 && validationIssues === 0) cleanBuildDone = true
              if (persistedWorkflowId) {
                // Model rebuilt — UPDATE the same workflow instead of creating a duplicate.
                await saveWorkflowToNormalizedTables(persistedWorkflowId, builtState).catch((e) =>
                  logger.error('Failed to update rebuilt workflow', { e })
                )
                controller.enqueue(
                  sse({
                    type: 'workflow_created',
                    workflowId: persistedWorkflowId,
                    name: desc || 'Workflow',
                  })
                )
              } else {
                const created = await persistBuiltWorkflow(workspaceId, userId, builtState, desc)
                if (created) {
                  persistedWorkflowId = created.id
                  controller.enqueue(
                    sse({ type: 'workflow_created', workflowId: created.id, name: created.name })
                  )
                }
              }
            }

            // Feed a compact tool result back to the model for the next turn.
            const resultForModel = result.success
              ? (() => {
                  const data = result.data ?? {}
                  const compact = { ...data }
                  // Drop the heavy workflowState from the model context (client uses it, model doesn't need it).
                  if (compact.workflowState) compact.workflowState = undefined
                  return JSON.stringify(compact).slice(0, MAX_TOOL_RESULT_CHARS)
                })()
              : `Error: ${result.error}`

            messages.push({
              role: 'tool',
              name: toolCall.name,
              tool_call_id: toolCallId,
              content: resultForModel,
            })
            // Cache for de-dup on subsequent identical calls (only successful results worth reusing).
            if (result.success) executedToolCalls.set(dedupeKey, resultForModel)
          }
        }

        controller.enqueue(sse({ type: 'done' }))
        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ZelaxyArena agent failed'
        // A client Stop closes the stream mid-flush; the resulting "Controller is already closed"
        // (or an abort) is EXPECTED, not a real failure — log it quietly, don't raise an error.
        if (req.signal.aborted || message.includes('already closed')) {
          logger.info(`[${requestId}] stream stopped by client`)
        } else {
          logger.error(`[${requestId}] agent error`, { message })
        }
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
      // Without these, the SSE body is gzip-buffered until the stream closes — so streamed text only
      // appears all at once on stop/completion. `X-Accel-Buffering: no` disables proxy buffering and
      // `Content-Encoding: none` disables compression (which buffers to fill frames). This matches
      // the reference and every other streaming route in this app (copilot/chat, chat, tts, …).
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  })
}
