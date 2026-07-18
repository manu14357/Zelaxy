import { createLogger } from '@/lib/logs/console/logger'
import { BlockType, EDGE } from '@/executor/consts'
import type { DAG } from '@/executor/dag/builder'
import type { EdgeManager } from '@/executor/execution/edge-manager'
import type { NodeExecutionOrchestrator } from '@/executor/orchestrators/node'
import type { ExecutionContext, ExecutionResult, NormalizedBlockOutput } from '@/executor/types'
import { buildSentinelEndId, buildSentinelStartId } from '@/executor/utils/subflow-utils'

const logger = createLogger('DAGExecutionEngine')

/** Hard ceiling on node executions to guarantee termination if loop coordination misbehaves. */
const MAX_NODE_EXECUTIONS = 100_000

/**
 * Drives a built DAG to completion. Maintains a ready-queue of nodes whose incoming edges have all
 * been activated, executes them (concurrently) via the node orchestrator, and after each completion
 * asks the {@link EdgeManager} which downstream nodes became ready. Loops and parallels advance
 * through their sentinel nodes, which the orchestrators drive.
 */
export class ExecutionEngine {
  private readyQueue: string[] = []
  private executing = new Set<Promise<void>>()
  private queueLock: Promise<void> = Promise.resolve()
  private finalOutput: NormalizedBlockOutput = {}
  private responseLocked = false
  private stoppedEarly = false
  private errorFlag = false
  private executionError: Error | null = null
  private nodeExecutions = 0

  constructor(
    private context: ExecutionContext,
    private dag: DAG,
    private edgeManager: EdgeManager,
    private nodeOrchestrator: NodeExecutionOrchestrator
  ) {}

  async run(triggerBlockId?: string): Promise<ExecutionResult> {
    const startTime = new Date()
    this.context.metadata.startTime = this.context.metadata.startTime ?? startTime.toISOString()

    try {
      this.initializeQueue(triggerBlockId)

      while (this.hasWork()) {
        if (this.errorFlag || this.stoppedEarly) break
        await this.processQueue()
      }

      await this.waitForAllExecutions()

      if (this.errorFlag && this.executionError && !this.responseLocked) {
        throw this.executionError
      }

      const endTime = new Date()
      this.context.metadata.endTime = endTime.toISOString()
      this.context.metadata.duration = endTime.getTime() - startTime.getTime()

      return {
        success: true,
        output: this.finalOutput,
        logs: this.context.blockLogs,
        metadata: {
          duration: this.context.metadata.duration,
          startTime: this.context.metadata.startTime,
          endTime: this.context.metadata.endTime,
        },
      }
    } catch (error: any) {
      const endTime = new Date()
      this.context.metadata.endTime = endTime.toISOString()
      this.context.metadata.duration = endTime.getTime() - startTime.getTime()

      return {
        success: false,
        output: this.finalOutput,
        error: error?.message ?? String(error),
        logs: this.context.blockLogs,
        metadata: {
          duration: this.context.metadata.duration,
          startTime: this.context.metadata.startTime,
          endTime: this.context.metadata.endTime,
        },
      }
    }
  }

  private hasWork(): boolean {
    return this.readyQueue.length > 0 || this.executing.size > 0
  }

  private initializeQueue(triggerBlockId?: string): void {
    if (triggerBlockId) {
      this.addToQueue(triggerBlockId)
      return
    }

    const startNode = Array.from(this.dag.nodes.values()).find(
      (node) =>
        node.block.metadata?.id === BlockType.STARTER ||
        node.block.metadata?.category === 'triggers'
    )
    if (startNode) {
      this.addToQueue(startNode.id)
    } else {
      logger.warn('No start node found in DAG')
    }
  }

  private addToQueue(nodeId: string): void {
    if (!this.readyQueue.includes(nodeId)) {
      this.readyQueue.push(nodeId)
    }
  }

  private addMultipleToQueue(nodeIds: string[]): void {
    for (const nodeId of nodeIds) this.addToQueue(nodeId)
  }

  private async processQueue(): Promise<void> {
    while (this.readyQueue.length > 0) {
      if (this.errorFlag) break
      const nodeId = this.readyQueue.shift()
      if (!nodeId) continue
      this.trackExecution(this.executeNodeAsync(nodeId))
    }

    if (this.executing.size > 0 && !this.errorFlag) {
      await this.waitForAnyExecution()
    }
  }

  private trackExecution(promise: Promise<void>): void {
    const tracked = promise
      .catch((error) => {
        if (!this.errorFlag) {
          this.errorFlag = true
          this.executionError = error instanceof Error ? error : new Error(String(error))
        }
      })
      .finally(() => {
        this.executing.delete(tracked)
      })
    this.executing.add(tracked)
  }

  private async waitForAnyExecution(): Promise<void> {
    if (this.executing.size > 0) {
      await Promise.race([...this.executing])
    }
  }

  private async waitForAllExecutions(): Promise<void> {
    if (this.executing.size > 0) {
      await Promise.allSettled(this.executing)
    }
  }

  private async withQueueLock<T>(fn: () => Promise<T> | T): Promise<T> {
    const prev = this.queueLock
    let release!: () => void
    this.queueLock = new Promise((resolve) => {
      release = resolve
    })
    await prev
    try {
      return await fn()
    } finally {
      release()
    }
  }

  private async executeNodeAsync(nodeId: string): Promise<void> {
    if (++this.nodeExecutions > MAX_NODE_EXECUTIONS) {
      throw new Error(`DAG execution exceeded ${MAX_NODE_EXECUTIONS} node executions`)
    }
    const wasExecuted = this.context.executedBlocks.has(nodeId)
    const result = await this.nodeOrchestrator.executeNode(this.context, nodeId)
    if (!wasExecuted) {
      await this.withQueueLock(() =>
        this.handleNodeCompletion(nodeId, result.output, result.isFinalOutput)
      )
    }
  }

  private async handleNodeCompletion(
    nodeId: string,
    output: NormalizedBlockOutput,
    isFinalOutput: boolean
  ): Promise<void> {
    const node = this.dag.nodes.get(nodeId)
    if (!node) return

    if (this.stoppedEarly && this.responseLocked) return

    await this.nodeOrchestrator.handleNodeCompletion(this.context, nodeId, output)

    if (node.block.metadata?.id === BlockType.RESPONSE) {
      if (!this.responseLocked) {
        this.finalOutput = output
        this.responseLocked = true
      }
      this.stoppedEarly = true
      return
    }

    if (isFinalOutput && !this.responseLocked) {
      this.finalOutput = output
    }

    // A loop/parallel start that continues into its body prunes its own exit edge, so the
    // convergence block after the subflow only waits on the end sentinel's exit.
    if (
      node.metadata.isSentinel &&
      node.metadata.sentinelType === 'start' &&
      output.shouldExit !== true
    ) {
      for (const [, edge] of node.outgoingEdges) {
        if (edge.sourceHandle === EDGE.LOOP_EXIT || edge.sourceHandle === EDGE.PARALLEL_EXIT) {
          this.edgeManager.deactivateEdge(node.id, edge.target, edge.sourceHandle)
        }
      }
    }

    // A loop end that continues resets the loop subgraph for the next iteration before its
    // loop_continue edge re-activates the start sentinel.
    if (
      node.metadata.isSentinel &&
      node.metadata.sentinelType === 'end' &&
      node.metadata.loopId &&
      output.selectedRoute === EDGE.LOOP_CONTINUE
    ) {
      this.resetLoopForNextIteration(node.metadata.loopId)
    }

    const readyNodes = this.edgeManager.processOutgoingEdges(node, output, false)
    this.addMultipleToQueue(readyNodes)
  }

  private resetLoopForNextIteration(loopId: string): void {
    const config = this.dag.loopConfigs.get(loopId)
    if (!config) return

    const startId = buildSentinelStartId(loopId)
    const endId = buildSentinelEndId(loopId)
    const loopNodeIds = new Set<string>([startId, endId, ...config.nodes])

    for (const nodeId of loopNodeIds) {
      this.context.executedBlocks.delete(nodeId)
    }

    this.edgeManager.restoreLoopSubgraph(loopNodeIds, startId)
  }
}
