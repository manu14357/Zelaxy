// Worker-side job processors — extracted from former Trigger.dev task definitions.
// Each function contains the exact same logic that was previously inside task({ run: ... }).

import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { checkServerSideUsageLimits } from '@/lib/billing'
import type {
  WebhookExecutionPayload,
  WebhookExecutionResult,
  WorkflowExecutionPayload,
  WorkflowExecutionResult,
} from '@/lib/bullmq/types'
import { createLogger } from '@/lib/logs/console/logger'
import { LoggingSession } from '@/lib/logs/execution/logging-session'
import { buildTraceSpans } from '@/lib/logs/execution/trace-spans/trace-spans'
import { decryptSecret } from '@/lib/utils'
import { fetchAndProcessAirtablePayloads, formatWebhookInput } from '@/lib/webhooks/utils'
import {
  loadDeployedWorkflowState,
  loadWorkflowFromNormalizedTables,
} from '@/lib/workflows/db-helpers'
import { updateWorkflowRunCounts } from '@/lib/workflows/utils'
import { db } from '@/db'
import {
  environment as environmentTable,
  userStats,
  webhook,
  workflow as workflowTable,
} from '@/db/schema'
import { Executor } from '@/executor'
import { Serializer } from '@/serializer'
import { mergeSubblockState } from '@/stores/workflows/server-utils'

const workflowLogger = createLogger('WorkflowExecution')
const webhookLogger = createLogger('WebhookExecution')

// ─── Shared helpers ──────────────────────────────────────────────────────────

async function decryptEnvVars(
  userId: string,
  requestId: string,
  logger: ReturnType<typeof createLogger>
): Promise<Record<string, string>> {
  const [userEnv] = await db
    .select()
    .from(environmentTable)
    .where(eq(environmentTable.userId, userId))
    .limit(1)

  if (!userEnv) return {}

  const decryptionPromises = Object.entries((userEnv.variables as any) || {}).map(
    async ([key, encryptedValue]) => {
      try {
        const { decrypted } = await decryptSecret(encryptedValue as string)
        return [key, decrypted] as const
      } catch (error: any) {
        logger.error(`[${requestId}] Failed to decrypt environment variable "${key}":`, error)
        throw new Error(`Failed to decrypt environment variable "${key}": ${error.message}`)
      }
    }
  )

  const decryptedPairs = await Promise.all(decryptionPromises)
  return Object.fromEntries(decryptedPairs)
}

function processBlockStates(
  mergedStates: Record<string, any>
): Record<string, Record<string, any>> {
  return Object.entries(mergedStates).reduce(
    (acc, [blockId, blockState]) => {
      acc[blockId] = Object.entries((blockState as any).subBlocks).reduce(
        (subAcc: Record<string, any>, [key, subBlock]) => {
          subAcc[key] = (subBlock as any).value
          return subAcc
        },
        {} as Record<string, any>
      )
      return acc
    },
    {} as Record<string, Record<string, any>>
  )
}

// ─── Workflow Execution ──────────────────────────────────────────────────────

export async function processWorkflowExecution(
  payload: WorkflowExecutionPayload
): Promise<WorkflowExecutionResult> {
  const workflowId = payload.workflowId
  const executionId = uuidv4()
  const requestId = executionId.slice(0, 8)

  workflowLogger.info(`[${requestId}] Starting workflow execution: ${workflowId}`, {
    userId: payload.userId,
    triggerType: payload.triggerType,
    executionId,
  })

  const triggerType = payload.triggerType || 'api'
  const loggingSession = new LoggingSession(workflowId, executionId, triggerType, requestId)

  try {
    const usageCheck = await checkServerSideUsageLimits(payload.userId)
    if (usageCheck.isExceeded) {
      workflowLogger.warn(
        `[${requestId}] User ${payload.userId} has exceeded usage limits. Skipping workflow execution.`,
        {
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
          workflowId: payload.workflowId,
        }
      )
      throw new Error(
        usageCheck.message ||
          'Usage limit exceeded. Please upgrade your plan to continue using workflows.'
      )
    }

    const workflowData = await loadDeployedWorkflowState(workflowId)

    const [workflowRecord] = await db
      .select({ workspaceId: workflowTable.workspaceId })
      .from(workflowTable)
      .where(eq(workflowTable.id, workflowId))
      .limit(1)
    const workspaceId = workflowRecord?.workspaceId || ''

    const { blocks, edges, loops, parallels } = workflowData
    const mergedStates = mergeSubblockState(blocks, {})
    const processedBlockStates = processBlockStates(mergedStates)

    const decryptedEnvVars = await decryptEnvVars(payload.userId, requestId, workflowLogger)

    await loggingSession.safeStart({
      userId: payload.userId,
      workspaceId,
      variables: decryptedEnvVars,
    })

    const serializer = new Serializer()
    const serializedWorkflow = serializer.serializeWorkflow(
      mergedStates,
      edges,
      loops || {},
      parallels || {},
      true
    )

    const executor = new Executor({
      workflow: serializedWorkflow,
      currentBlockStates: processedBlockStates,
      envVarValues: decryptedEnvVars,
      workflowInput: payload.input || {},
      workflowVariables: {},
      contextExtensions: { executionId, workspaceId },
    })

    loggingSession.setupExecutor(executor)

    const result = await executor.execute(workflowId)
    const executionResult = 'stream' in result && 'execution' in result ? result.execution : result

    workflowLogger.info(`[${requestId}] Workflow execution completed: ${workflowId}`, {
      success: executionResult.success,
      executionTime: executionResult.metadata?.duration,
      executionId,
    })

    if (!executionResult.success) {
      workflowLogger.error(`[${requestId}] Workflow execution returned success:false`, {
        workflowId,
        error: executionResult.error,
        failedBlocks: executionResult.logs
          ?.filter((l: any) => l.success === false)
          .map((l: any) => ({
            blockId: l.blockId,
            blockName: l.blockName || l.blockType,
            error: l.error,
          })),
      })
    }

    if (executionResult.success) {
      await updateWorkflowRunCounts(workflowId)

      const statsUpdate =
        triggerType === 'api'
          ? { totalApiCalls: sql`total_api_calls + 1` }
          : triggerType === 'webhook'
            ? { totalWebhookTriggers: sql`total_webhook_triggers + 1` }
            : triggerType === 'schedule'
              ? { totalScheduledExecutions: sql`total_scheduled_executions + 1` }
              : { totalManualExecutions: sql`total_manual_executions + 1` }

      await db
        .update(userStats)
        .set({ ...statsUpdate, lastActive: sql`now()` })
        .where(eq(userStats.userId, payload.userId))
    }

    const { traceSpans, totalDuration } = buildTraceSpans(executionResult)

    await loggingSession.safeComplete({
      endedAt: new Date().toISOString(),
      totalDurationMs: totalDuration || 0,
      finalOutput: executionResult.output || {},
      traceSpans: traceSpans as any,
    })

    return {
      success: executionResult.success,
      workflowId: payload.workflowId,
      executionId,
      output: executionResult.output,
      executedAt: new Date().toISOString(),
      metadata: payload.metadata,
    }
  } catch (error: any) {
    workflowLogger.error(`[${requestId}] Workflow execution failed: ${workflowId}`, {
      error: error.message,
      stack: error.stack,
    })

    await loggingSession.safeCompleteWithError({
      endedAt: new Date().toISOString(),
      totalDurationMs: 0,
      error: {
        message: error.message || 'Workflow execution failed',
        stackTrace: error.stack,
      },
    })

    throw error
  }
}

// ─── Webhook Execution ───────────────────────────────────────────────────────

export async function processWebhookExecution(
  payload: WebhookExecutionPayload
): Promise<WebhookExecutionResult> {
  const executionId = uuidv4()
  const requestId = executionId.slice(0, 8)

  webhookLogger.info(`[${requestId}] Starting webhook execution`, {
    webhookId: payload.webhookId,
    workflowId: payload.workflowId,
    provider: payload.provider,
    userId: payload.userId,
    executionId,
  })

  const loggingSession = new LoggingSession(payload.workflowId, executionId, 'webhook', requestId)

  try {
    const usageCheck = await checkServerSideUsageLimits(payload.userId)
    if (usageCheck.isExceeded) {
      webhookLogger.warn(
        `[${requestId}] User ${payload.userId} has exceeded usage limits. Skipping webhook execution.`,
        {
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
          workflowId: payload.workflowId,
        }
      )
      throw new Error(
        usageCheck.message ||
          'Usage limit exceeded. Please upgrade your plan to continue using webhooks.'
      )
    }

    webhookLogger.info(`[${requestId}] DIAG: Loading workflow from normalized tables`)
    const workflowData = await loadWorkflowFromNormalizedTables(payload.workflowId)
    if (!workflowData) {
      throw new Error(`Workflow not found: ${payload.workflowId}`)
    }
    webhookLogger.info(`[${requestId}] DIAG: Workflow loaded`, {
      blockCount: workflowData.blocks ? Object.keys(workflowData.blocks).length : 0,
      edgeCount: workflowData.edges?.length || 0,
      hasLoops: !!workflowData.loops && Object.keys(workflowData.loops).length > 0,
      hasParallels: !!workflowData.parallels && Object.keys(workflowData.parallels).length > 0,
    })

    const [workflowRecord] = await db
      .select({ workspaceId: workflowTable.workspaceId })
      .from(workflowTable)
      .where(eq(workflowTable.id, payload.workflowId))
      .limit(1)
    const workspaceId = workflowRecord?.workspaceId || ''

    const { blocks, edges, loops, parallels } = workflowData

    webhookLogger.info(`[${requestId}] DIAG: Decrypting env vars for user ${payload.userId}`)
    const decryptedEnvVars = await decryptEnvVars(payload.userId, requestId, webhookLogger)
    webhookLogger.info(`[${requestId}] DIAG: Env vars decrypted`, {
      count: Object.keys(decryptedEnvVars).length,
      keys: Object.keys(decryptedEnvVars),
    })

    await loggingSession.safeStart({
      userId: payload.userId,
      workspaceId,
      variables: decryptedEnvVars,
    })

    const mergedStates = mergeSubblockState(blocks, {})
    const processedBlockStates = processBlockStates(mergedStates)
    const workflowVariables = {}

    const serializer = new Serializer()
    const serializedWorkflow = serializer.serializeWorkflow(
      mergedStates,
      edges,
      loops || {},
      parallels || {},
      true
    )

    // --- Airtable special case ---
    if (payload.provider === 'airtable') {
      webhookLogger.info(
        `[${requestId}] Processing Airtable webhook via fetchAndProcessAirtablePayloads`
      )

      const [webhookRecord] = await db
        .select()
        .from(webhook)
        .where(eq(webhook.id, payload.webhookId))
        .limit(1)

      if (!webhookRecord) {
        throw new Error(`Webhook record not found: ${payload.webhookId}`)
      }

      const webhookData = {
        id: payload.webhookId,
        provider: payload.provider,
        providerConfig: webhookRecord.providerConfig,
      }

      const mockWorkflow = { id: payload.workflowId, userId: payload.userId }

      const airtableInput = await fetchAndProcessAirtablePayloads(
        webhookData,
        mockWorkflow,
        requestId
      )

      if (airtableInput) {
        webhookLogger.info(`[${requestId}] Executing workflow with Airtable changes`)

        const executor = new Executor({
          workflow: serializedWorkflow,
          currentBlockStates: processedBlockStates,
          envVarValues: decryptedEnvVars,
          workflowInput: airtableInput,
          workflowVariables,
          contextExtensions: { executionId, workspaceId },
        })

        loggingSession.setupExecutor(executor)

        const result = await executor.execute(payload.workflowId, payload.blockId)
        const executionResult =
          'stream' in result && 'execution' in result ? result.execution : result

        webhookLogger.info(`[${requestId}] Airtable webhook execution completed`, {
          success: executionResult.success,
          workflowId: payload.workflowId,
        })

        if (executionResult.success) {
          await updateWorkflowRunCounts(payload.workflowId)
          await db
            .update(userStats)
            .set({
              totalWebhookTriggers: sql`total_webhook_triggers + 1`,
              lastActive: sql`now()`,
            })
            .where(eq(userStats.userId, payload.userId))
        }

        const { traceSpans, totalDuration } = buildTraceSpans(executionResult)

        await loggingSession.safeComplete({
          endedAt: new Date().toISOString(),
          totalDurationMs: totalDuration || 0,
          finalOutput: executionResult.output || {},
          traceSpans: traceSpans as any,
        })

        return {
          success: executionResult.success,
          workflowId: payload.workflowId,
          executionId,
          output: executionResult.output,
          executedAt: new Date().toISOString(),
          provider: payload.provider,
        }
      }

      // No Airtable changes to process
      webhookLogger.info(`[${requestId}] No Airtable changes to process`)

      await loggingSession.safeComplete({
        endedAt: new Date().toISOString(),
        totalDurationMs: 0,
        finalOutput: { message: 'No Airtable changes to process' },
        traceSpans: [],
      })

      return {
        success: true,
        workflowId: payload.workflowId,
        executionId,
        output: { message: 'No Airtable changes to process' },
        executedAt: new Date().toISOString(),
        provider: payload.provider,
      }
    }

    // --- Standard webhook flow ---
    const mockWebhook = { provider: payload.provider, blockId: payload.blockId }
    const mockWorkflow = { id: payload.workflowId, userId: payload.userId }
    const mockRequest = {
      headers: new Map(Object.entries(payload.headers)),
    } as any

    webhookLogger.info(`[${requestId}] DIAG: formatWebhookInput starting`, {
      provider: payload.provider,
      blockId: payload.blockId,
      bodyKeys: payload.body ? Object.keys(payload.body) : [],
      headerCount: Object.keys(payload.headers).length,
    })

    const input = formatWebhookInput(mockWebhook, mockWorkflow, payload.body, mockRequest)

    webhookLogger.info(`[${requestId}] DIAG: formatWebhookInput result`, {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input) : [],
      inputPreview: input ? JSON.stringify(input).slice(0, 500) : 'null',
    })

    if (!input && payload.provider === 'whatsapp') {
      webhookLogger.info(`[${requestId}] No messages in WhatsApp payload, skipping execution`)
      await loggingSession.safeComplete({
        endedAt: new Date().toISOString(),
        totalDurationMs: 0,
        finalOutput: { message: 'No messages in WhatsApp payload' },
        traceSpans: [],
      })
      return {
        success: true,
        workflowId: payload.workflowId,
        executionId,
        output: { message: 'No messages in WhatsApp payload' },
        executedAt: new Date().toISOString(),
        provider: payload.provider,
      }
    }

    webhookLogger.info(`[${requestId}] DIAG: Creating executor`, {
      blockCount: serializedWorkflow.blocks.length,
      connectionCount: serializedWorkflow.connections.length,
      blockTypes: serializedWorkflow.blocks.map(
        (b: any) => `${b.metadata?.id || 'unknown'}:${b.metadata?.name || b.id}`
      ),
      hasEnvVars: Object.keys(decryptedEnvVars).length > 0,
      envVarKeys: Object.keys(decryptedEnvVars),
      processEnvKeys: [
        'NEXT_PUBLIC_APP_URL',
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY_1',
        'ANTHROPIC_API_KEY_1',
        'BETTER_AUTH_URL',
        'BETTER_AUTH_SECRET',
        'INTERNAL_API_SECRET',
      ].filter((k) => !!process.env[k]),
    })

    const executor = new Executor({
      workflow: serializedWorkflow,
      currentBlockStates: processedBlockStates,
      envVarValues: decryptedEnvVars,
      workflowInput: input || {},
      workflowVariables,
      startBlockId: payload.blockId,
      contextExtensions: { executionId, workspaceId },
    })

    loggingSession.setupExecutor(executor)

    webhookLogger.info(`[${requestId}] DIAG: Executor created, starting execution`)

    const result = await executor.execute(payload.workflowId, payload.blockId)
    const executionResult = 'stream' in result && 'execution' in result ? result.execution : result

    webhookLogger.info(`[${requestId}] Webhook execution completed`, {
      success: executionResult.success,
      workflowId: payload.workflowId,
      provider: payload.provider,
      error: executionResult.error || undefined,
      blockLogCount: executionResult.logs?.length || 0,
    })

    if (!executionResult.success) {
      webhookLogger.error(`[${requestId}] DIAG: Webhook execution FAILED`, {
        workflowId: payload.workflowId,
        provider: payload.provider,
        error: executionResult.error,
        allBlockLogs: executionResult.logs?.map((l: any) => ({
          blockId: l.blockId,
          blockName: l.blockName || l.blockType,
          blockType: l.blockType,
          success: l.success,
          error: l.error,
          durationMs: l.durationMs,
          inputPreview: l.input ? JSON.stringify(l.input).slice(0, 300) : undefined,
          outputPreview: l.output ? JSON.stringify(l.output).slice(0, 300) : undefined,
        })),
      })
    }

    if (executionResult.success) {
      await updateWorkflowRunCounts(payload.workflowId)
      await db
        .update(userStats)
        .set({
          totalWebhookTriggers: sql`total_webhook_triggers + 1`,
          lastActive: sql`now()`,
        })
        .where(eq(userStats.userId, payload.userId))
    }

    const { traceSpans, totalDuration } = buildTraceSpans(executionResult)

    await loggingSession.safeComplete({
      endedAt: new Date().toISOString(),
      totalDurationMs: totalDuration || 0,
      finalOutput: executionResult.output || {},
      traceSpans: traceSpans as any,
    })

    return {
      success: executionResult.success,
      workflowId: payload.workflowId,
      executionId,
      output: executionResult.output,
      executedAt: new Date().toISOString(),
      provider: payload.provider,
    }
  } catch (error: any) {
    webhookLogger.error(`[${requestId}] Webhook execution failed`, {
      error: error.message,
      stack: error.stack,
      workflowId: payload.workflowId,
      provider: payload.provider,
    })

    try {
      await loggingSession.safeCompleteWithError({
        endedAt: new Date().toISOString(),
        totalDurationMs: 0,
        error: {
          message: error.message || 'Webhook execution failed',
          stackTrace: error.stack,
        },
      })
    } catch (loggingError) {
      webhookLogger.error(`[${requestId}] Failed to complete logging session`, loggingError)
    }

    throw error
  }
}
