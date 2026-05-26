import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { BlockHandler, ExecutionContext, PauseMetadata } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('HumanInTheLoopBlockHandler')

function getBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  return ''
}

function generateContextId(blockId: string, executionId?: string): string {
  return `hitl-${blockId}-${executionId ?? 'unknown'}-${Date.now()}`
}

export class HumanInTheLoopBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.HUMAN_IN_THE_LOOP
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    ctx: ExecutionContext
  ): Promise<any> {
    const contextId = generateContextId(block.id, ctx.executionId)
    const executionId = ctx.executionId
    const workflowId = ctx.workflowId
    const timestamp = new Date().toISOString()

    let resumeLinks: string[] | undefined
    if (executionId && workflowId) {
      const baseUrl = getBaseUrl()
      if (baseUrl) {
        resumeLinks = [
          `${baseUrl}/api/resume/${executionId}?contextId=${contextId}&approved=true`,
          `${baseUrl}/api/resume/${executionId}?contextId=${contextId}&approved=false`,
        ]
      }
    }

    const pauseMetadata: PauseMetadata = {
      contextId,
      blockId: block.id,
      resumeLinks,
      pauseKind: 'human-in-the-loop',
    }

    logger.info('Human-in-the-loop block pausing execution', {
      blockId: block.id,
      contextId,
      hasResumeLinks: (resumeLinks?.length ?? 0) > 0,
    })

    const title = inputs.title ?? block.metadata?.name ?? 'Human Review Required'
    const message = inputs.message ?? inputs.description ?? ''

    return {
      status: 'waiting',
      contextId,
      title,
      message,
      resumeLinks,
      timestamp,
      _pauseMetadata: pauseMetadata,
    }
  }
}
