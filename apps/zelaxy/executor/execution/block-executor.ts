import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { DAGNode } from '@/executor/dag/builder'
import { extractErrorMessage } from '@/executor/driver/runtime'
import type { BlockExecutionDelegate } from '@/executor/orchestrators/node'
import type { InputResolver } from '@/executor/resolver/resolver'
import type { BlockHandler, ExecutionContext, NormalizedBlockOutput } from '@/executor/types'
import { extractBaseBlockId } from '@/executor/utils/subflow-utils'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('DAGBlockExecutor')

/**
 * Resolves a node's inputs and dispatches it to the matching block handler, then normalizes and
 * logs the result. This is the {@link BlockExecutionDelegate} the node orchestrator calls for every
 * non-sentinel node; sentinels (loop/parallel start/end) are handled by the orchestrators instead.
 */
export class BlockExecutor implements BlockExecutionDelegate {
  constructor(
    private handlers: BlockHandler[],
    private resolver: InputResolver,
    private onBlockComplete?: (log: any) => void | Promise<void>
  ) {}

  async execute(
    ctx: ExecutionContext,
    node: DAGNode,
    block: SerializedBlock
  ): Promise<NormalizedBlockOutput> {
    // Starter/trigger nodes are pre-seeded during context creation; return their stored output.
    if (block.metadata?.id === BlockType.STARTER) {
      const seeded = ctx.blockStates.get(node.id)?.output ?? ctx.blockStates.get(block.id)?.output
      if (seeded) return seeded as NormalizedBlockOutput
    }

    const startedAt = new Date().toISOString()
    const start = performance.now()
    const log: any = {
      blockId: node.id,
      blockName: block.metadata?.name || '',
      blockType: block.metadata?.id || '',
      startedAt,
      endedAt: '',
      durationMs: 0,
      success: false,
    }

    // Parallel branch clones carry the virtual id (`body₍0₎`) as the node id; the resolver keys
    // subflow membership and references off the original block id, so resolve/execute against it.
    const resolveBlock: SerializedBlock = node.metadata.isParallelBranch
      ? { ...block, id: extractBaseBlockId(node.id) }
      : block

    try {
      const inputs = this.resolver.resolveInputs(resolveBlock, ctx)
      log.input = inputs

      const handler = this.handlers.find((h) => h.canHandle(resolveBlock))
      if (!handler) {
        throw new Error(`No handler found for block type: ${block.metadata?.id}`)
      }

      const rawOutput = await handler.execute(resolveBlock, inputs, ctx)

      const output: NormalizedBlockOutput =
        rawOutput && typeof rawOutput === 'object' && (rawOutput as any).error
          ? { error: (rawOutput as any).error, status: (rawOutput as any).status || 500 }
          : typeof rawOutput === 'object' && rawOutput !== null
            ? (rawOutput as NormalizedBlockOutput)
            : ({ result: rawOutput } as NormalizedBlockOutput)

      log.success = true
      log.output = output
      log.endedAt = new Date().toISOString()
      log.durationMs = Math.round(performance.now() - start)
      ctx.blockLogs.push(log)
      await this.notifyComplete(log)

      return output
    } catch (error: any) {
      const errorOutput: NormalizedBlockOutput = {
        error: extractErrorMessage(error),
        status: error?.status || 500,
      }
      log.success = false
      log.error = errorOutput.error
      log.output = errorOutput
      log.endedAt = new Date().toISOString()
      log.durationMs = Math.round(performance.now() - start)
      ctx.blockLogs.push(log)
      await this.notifyComplete(log)

      logger.error('Block execution failed', {
        nodeId: node.id,
        blockType: block.metadata?.id,
        error: errorOutput.error,
      })

      // Return the error output so the edge manager can route it down an `error` edge if one exists.
      return errorOutput
    }
  }

  private async notifyComplete(log: any): Promise<void> {
    try {
      await this.onBlockComplete?.(log)
    } catch (e) {
      logger.warn('onBlockComplete callback error', { error: e })
    }
  }
}
