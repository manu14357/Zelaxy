import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  authenticateCopilotRequestSessionOnly,
  createBadRequestResponse,
  createInternalServerErrorResponse,
  createRequestTracker,
  createUnauthorizedResponse,
  type NotificationStatus,
} from '@/lib/copilot/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getRedisClient } from '@/lib/redis'

const logger = createLogger('CopilotConfirmAPI')

// Schema for confirmation request
const ConfirmationSchema = z.object({
  toolCallId: z.string().min(1, 'Tool call ID is required'),
  status: z.enum(['success', 'error', 'accepted', 'rejected', 'background'] as const, {
    errorMap: () => ({ message: 'Invalid notification status' }),
  }),
  message: z.string().optional(), // Optional message for background moves or additional context
})

/**
 * Update tool call status in Redis
 */
type UpdateOutcome = 'updated' | 'no-waiter' | 'error'

async function updateToolCallStatus(
  toolCallId: string,
  status: NotificationStatus,
  message?: string
): Promise<UpdateOutcome> {
  const redis = getRedisClient()
  if (!redis) {
    logger.warn('updateToolCallStatus: Redis client not available')
    return 'error'
  }

  try {
    const key = `tool_call:${toolCallId}`
    // Fail fast: in the live (direct-chat) flow the tool already ran server-side and there is no
    // Redis waiter, so a missing key is EXPECTED — don't block for a full minute. The legacy
    // interrupt flow sets the key up-front, so it is found on the first poll anyway.
    const timeout = 4000
    const pollInterval = 100 // Poll every 100ms
    const startTime = Date.now()

    logger.info('Polling for tool call in Redis', { toolCallId, key, timeout })

    // Poll until the key exists or timeout
    while (Date.now() - startTime < timeout) {
      const exists = await redis.exists(key)
      if (exists) {
        logger.info('Tool call found in Redis, updating status', {
          toolCallId,
          key,
          pollDuration: Date.now() - startTime,
        })
        break
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    // Final check if key exists after polling
    const exists = await redis.exists(key)
    if (!exists) {
      logger.warn('Tool call not found in Redis after polling timeout', {
        toolCallId,
        key,
        timeout,
        pollDuration: Date.now() - startTime,
      })
      return 'no-waiter'
    }

    // Store both status and message as JSON
    const toolCallData = {
      status,
      message: message || null,
      timestamp: new Date().toISOString(),
    }

    await redis.set(key, JSON.stringify(toolCallData), 'EX', 86400) // Keep 24 hour expiry

    logger.info('Tool call status updated in Redis', {
      toolCallId,
      key,
      status,
      pollDuration: Date.now() - startTime,
    })
    return 'updated'
  } catch (error) {
    logger.error('Failed to update tool call status in Redis', {
      toolCallId,
      status,
      message,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return 'error'
  }
}

/**
 * POST /api/copilot/confirm
 * Update tool call status (Accept/Reject)
 */
export async function POST(req: NextRequest) {
  const tracker = createRequestTracker()

  try {
    // Authenticate user using consolidated helper
    const { userId: authenticatedUserId, isAuthenticated } =
      await authenticateCopilotRequestSessionOnly()

    if (!isAuthenticated) {
      return createUnauthorizedResponse()
    }

    const body = await req.json()
    const { toolCallId, status, message } = ConfirmationSchema.parse(body)

    logger.info(`[${tracker.requestId}] Tool call confirmation request`, {
      userId: authenticatedUserId,
      toolCallId,
      status,
      messageLength: message?.length ?? 0,
    })

    // Update the tool call status in Redis
    const outcome = await updateToolCallStatus(toolCallId, status, message)

    if (outcome === 'no-waiter') {
      // No Redis waiter for this tool call. In the live (direct-chat) flow the tool already ran
      // server-side, so there is nothing to confirm — this is expected, NOT an error. Return a
      // benign no-op so the client doesn't surface a failure.
      logger.info(`[${tracker.requestId}] No waiter for tool call — treating confirm as no-op`, {
        userId: authenticatedUserId,
        toolCallId,
        status,
      })
      return NextResponse.json({ success: true, noOp: true, toolCallId, status })
    }

    if (outcome === 'error') {
      // Genuine infra failure (Redis unavailable / set failed) — surface it.
      logger.error(`[${tracker.requestId}] Failed to update tool call status`, {
        userId: authenticatedUserId,
        toolCallId,
        status,
      })
      return createBadRequestResponse('Failed to update tool call status or tool call not found')
    }

    const duration = tracker.getDuration()
    logger.info(`[${tracker.requestId}] Tool call confirmation completed`, {
      userId: authenticatedUserId,
      toolCallId,
      status,
      internalStatus: status,
      duration,
    })

    return NextResponse.json({
      success: true,
      message: message || `Tool call ${toolCallId} has been ${status.toLowerCase()}`,
      toolCallId,
      status,
    })
  } catch (error) {
    const duration = tracker.getDuration()

    if (error instanceof z.ZodError) {
      logger.error(`[${tracker.requestId}] Request validation error:`, {
        duration,
        errors: error.errors,
      })
      return createBadRequestResponse(
        `Invalid request data: ${error.errors.map((e) => e.message).join(', ')}`
      )
    }

    logger.error(`[${tracker.requestId}] Unexpected error:`, {
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return createInternalServerErrorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}
