import { createLogger } from '@/lib/logs/console/logger'
import { EDGE } from '@/executor/consts'
import type { DAG, DAGNode } from '@/executor/dag/builder'
import type { BlockStateController } from '@/executor/execution/state'
import type { LoopOrchestrator } from '@/executor/orchestrators/loop'
import type { ParallelOrchestrator } from '@/executor/orchestrators/parallel'
import type { ExecutionContext, NormalizedBlockOutput } from '@/executor/types'
import { extractBaseBlockId } from '@/executor/utils/subflow-utils'

const logger = createLogger('NodeExecutionOrchestrator')

export interface BlockExecutionDelegate {
  execute(ctx: ExecutionContext, node: DAGNode, block: any): Promise<NormalizedBlockOutput>
}

export interface NodeExecutionResult {
  nodeId: string
  output: NormalizedBlockOutput
  isFinalOutput: boolean
}

export class NodeExecutionOrchestrator {
  constructor(
    private dag: DAG,
    private state: BlockStateController,
    private blockExecutor: BlockExecutionDelegate,
    private loopOrchestrator: LoopOrchestrator,
    private parallelOrchestrator: ParallelOrchestrator
  ) {}

  async executeNode(ctx: ExecutionContext, nodeId: string): Promise<NodeExecutionResult> {
    const node = this.dag.nodes.get(nodeId)
    if (!node) throw new Error(`Node not found in DAG: ${nodeId}`)

    if (this.state.hasExecuted(nodeId)) {
      const output = this.state.getBlockOutput(nodeId) ?? {}
      return { nodeId, output, isFinalOutput: false }
    }

    const loopId = node.metadata.loopId
    if (loopId && !this.loopOrchestrator.getLoopScope(ctx, loopId)) {
      await this.loopOrchestrator.initializeLoopScope(ctx, loopId)
    }

    const parallelId = node.metadata.parallelId
    if (parallelId && !this.parallelOrchestrator.getParallelScope(ctx, parallelId)) {
      await this.parallelOrchestrator.initializeParallelScope(ctx, parallelId)
    }

    if (node.metadata.isSentinel) {
      const output = await this.handleSentinel(ctx, node)
      return { nodeId, output, isFinalOutput: node.outgoingEdges.size === 0 }
    }

    const output = await this.blockExecutor.execute(ctx, node, node.block)
    return { nodeId, output, isFinalOutput: node.outgoingEdges.size === 0 }
  }

  private async handleSentinel(
    ctx: ExecutionContext,
    node: DAGNode
  ): Promise<NormalizedBlockOutput> {
    const { sentinelType, loopId, parallelId, isParallelSentinel } = node.metadata

    if (isParallelSentinel) {
      return this.handleParallelSentinel(ctx, node, sentinelType, parallelId)
    }

    switch (sentinelType) {
      case 'start': {
        if (loopId) {
          const shouldExecute = await this.loopOrchestrator.evaluateInitialCondition(ctx, loopId)
          if (!shouldExecute) {
            return { sentinelStart: true, shouldExit: true, selectedRoute: EDGE.LOOP_EXIT }
          }
        }
        return { sentinelStart: true }
      }
      case 'end': {
        if (!loopId) return { shouldExit: true, selectedRoute: EDGE.LOOP_EXIT }
        const result = await this.loopOrchestrator.evaluateLoopContinuation(ctx, loopId)
        if (result.shouldContinue) {
          return { shouldContinue: true, shouldExit: false, selectedRoute: result.selectedRoute }
        }
        return {
          results: result.aggregatedResults ?? [],
          shouldContinue: false,
          shouldExit: true,
          selectedRoute: result.selectedRoute,
          totalIterations: result.totalIterations,
        }
      }
      default:
        logger.warn('Unknown sentinel type', { sentinelType })
        return {}
    }
  }

  private async handleParallelSentinel(
    ctx: ExecutionContext,
    node: DAGNode,
    sentinelType: string | undefined,
    parallelId: string | undefined
  ): Promise<NormalizedBlockOutput> {
    if (!parallelId) return {}

    if (sentinelType === 'start') {
      if (!this.parallelOrchestrator.getParallelScope(ctx, parallelId)) {
        await this.parallelOrchestrator.initializeParallelScope(ctx, parallelId)
      }
      const scope = this.parallelOrchestrator.getParallelScope(ctx, parallelId)
      if (scope?.isEmpty) {
        return { sentinelStart: true, shouldExit: true, selectedRoute: EDGE.PARALLEL_EXIT }
      }
      return { sentinelStart: true }
    }

    if (sentinelType === 'end') {
      const result = await this.parallelOrchestrator.aggregateParallelResults(ctx, parallelId)
      if (!result.allBranchesComplete) {
        return {
          results: [],
          sentinelEnd: true,
          selectedRoute: EDGE.PARALLEL_CONTINUE,
          totalBranches: result.totalBranches,
        }
      }
      return {
        results: result.results ?? [],
        sentinelEnd: true,
        selectedRoute: EDGE.PARALLEL_EXIT,
        totalBranches: result.totalBranches,
      }
    }

    return {}
  }

  async handleNodeCompletion(
    ctx: ExecutionContext,
    nodeId: string,
    output: NormalizedBlockOutput
  ): Promise<void> {
    const node = this.dag.nodes.get(nodeId)
    if (!node) return

    const { loopId, isParallelBranch, isSentinel } = node.metadata

    if (isSentinel) {
      this.handleRegularNodeCompletion(ctx, node, output)
    } else if (loopId) {
      this.loopOrchestrator.storeLoopNodeOutput(ctx, loopId, node.id, output)
    } else if (isParallelBranch) {
      const parallelId = this.parallelOrchestrator.findParallelIdForNode(
        extractBaseBlockId(node.id)
      )
      if (parallelId) {
        this.parallelOrchestrator.handleParallelBranchCompletion(ctx, parallelId, node.id, output)
        this.state.setBlockOutput(node.id, output)
      } else {
        this.handleRegularNodeCompletion(ctx, node, output)
      }
    } else {
      this.handleRegularNodeCompletion(ctx, node, output)
    }
  }

  private handleRegularNodeCompletion(
    ctx: ExecutionContext,
    node: DAGNode,
    output: NormalizedBlockOutput
  ): void {
    this.state.setBlockOutput(node.id, output)

    if (
      node.metadata.isSentinel &&
      node.metadata.sentinelType === 'end' &&
      output.selectedRoute === EDGE.LOOP_CONTINUE
    ) {
      if (node.metadata.loopId) {
        this.loopOrchestrator.clearLoopExecutionState(node.metadata.loopId, ctx)
        this.loopOrchestrator.restoreLoopEdges(node.metadata.loopId)
      }
    }

    if (
      node.metadata.isParallelSentinel &&
      node.metadata.sentinelType === 'end' &&
      output.selectedRoute === EDGE.PARALLEL_CONTINUE
    ) {
      this.state.deleteBlockState(node.id)
    }
  }
}
