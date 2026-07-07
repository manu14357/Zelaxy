import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { BlockHandler, ExecutionContext, PauseMetadata } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('WaitBlockHandler')

/** Maximum in-process (synchronous) wait: 5 minutes */
const MAX_INPROCESS_WAIT_MS = 5 * 60 * 1000

/** Maximum async wait: 30 days */
const MAX_ASYNC_WAIT_MS = 30 * 24 * 60 * 60 * 1000

const UNIT_TO_MS = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
} as const

type WaitUnit = keyof typeof UNIT_TO_MS

function isWaitUnit(value: string): value is WaitUnit {
  return value in UNIT_TO_MS
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class WaitBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.WAIT
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    ctx: ExecutionContext
  ): Promise<any> {
    const isAsync = inputs.async === true || inputs.async === 'true'
    const timeValue = Number.parseFloat(inputs.timeValue ?? '10')
    const timeUnit = isAsync ? (inputs.timeUnitLong ?? 'minutes') : (inputs.timeUnit ?? 'seconds')

    if (!Number.isFinite(timeValue) || timeValue <= 0) {
      throw new Error('Wait amount must be a positive number')
    }
    if (!isWaitUnit(timeUnit)) throw new Error(`Unknown wait unit: ${timeUnit}`)
    if (isAsync && timeUnit === 'seconds') throw new Error('Seconds are not allowed in async mode')

    const waitMs = Math.round(timeValue * UNIT_TO_MS[timeUnit])

    if (!isAsync) {
      if (waitMs > MAX_INPROCESS_WAIT_MS) {
        throw new Error(
          'Wait time exceeds maximum of 5 minutes; enable async mode for longer waits'
        )
      }
      await sleep(waitMs)
      // waitedMs/resumedAt/mode match the block's declared outputs so `<wait.waitedMs>` etc.
      // resolve for downstream blocks; waitDuration/status are kept for backward compatibility.
      return {
        waitDuration: waitMs,
        status: 'completed',
        waitedMs: waitMs,
        resumedAt: new Date().toISOString(),
        mode: 'sync',
      }
    }

    // Async mode: suspend execution
    if (waitMs > MAX_ASYNC_WAIT_MS) {
      throw new Error('Wait time exceeds maximum of 30 days')
    }

    const contextId = `${block.id}-wait-${Date.now()}`
    const resumeAt = new Date(Date.now() + waitMs).toISOString()

    const pauseMetadata: PauseMetadata = {
      contextId,
      blockId: block.id,
      resumeAt,
      pauseKind: 'time',
    }

    logger.info('Wait block scheduling async resume', { blockId: block.id, resumeAt })

    return {
      waitDuration: waitMs,
      status: 'waiting',
      resumeAt,
      waitedMs: waitMs,
      resumedAt: resumeAt,
      mode: 'async',
      _pauseMetadata: pauseMetadata,
    }
  }
}
