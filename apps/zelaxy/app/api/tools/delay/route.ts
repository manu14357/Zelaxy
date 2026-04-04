import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import type { DelayToolParams, DelayToolResponse } from '@/tools/delay/types'

const logger = createLogger('DelayToolAPI')

export const dynamic = 'force-dynamic'

/** Maximum allowed delay: 1 hour in milliseconds */
const MAX_DELAY_MS = 3_600_000

/** Convert duration + unit to milliseconds */
function toMilliseconds(duration: number, unit: string): number {
  switch (unit) {
    case 'minutes':
      return duration * 60_000
    case 'hours':
      return duration * 3_600_000
    default:
      return duration * 1_000
  }
}

/**
 * POST - Pause execution for a specified duration
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const body: DelayToolParams = await request.json()

    logger.info(`[${requestId}] Processing delay request`)

    // Validate duration
    if (body.duration == null || typeof body.duration !== 'number' || body.duration <= 0) {
      logger.warn(`[${requestId}] Invalid duration: ${body.duration}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Duration must be a positive number.',
        },
        { status: 400 }
      )
    }

    // Validate unit
    const validUnits = ['seconds', 'minutes', 'hours']
    if (!body.unit || !validUnits.includes(body.unit)) {
      logger.warn(`[${requestId}] Invalid unit: ${body.unit}`)
      return NextResponse.json(
        {
          success: false,
          error: `Unit must be one of: ${validUnits.join(', ')}.`,
        },
        { status: 400 }
      )
    }

    const delayMs = toMilliseconds(body.duration, body.unit)

    // Cap at max delay
    if (delayMs > MAX_DELAY_MS) {
      logger.warn(`[${requestId}] Delay ${delayMs}ms exceeds maximum ${MAX_DELAY_MS}ms`)
      return NextResponse.json(
        {
          success: false,
          error: `Maximum delay is 1 hour (3600 seconds). Requested: ${body.duration} ${body.unit}.`,
        },
        { status: 400 }
      )
    }

    const startedAt = new Date().toISOString()

    // Perform the actual delay
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs))

    const completedAt = new Date().toISOString()

    const response: DelayToolResponse = {
      success: true,
      output: {
        delayed: true,
        duration: body.duration,
        unit: body.unit,
        delayMs,
        startedAt,
        completedAt,
      },
    }

    logger.info(`[${requestId}] Delay completed: ${body.duration} ${body.unit} (${delayMs}ms)`)
    return NextResponse.json(response)
  } catch (error) {
    logger.error(`[${requestId}] Error processing delay:`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process delay request.',
      },
      { status: 500 }
    )
  }
}
