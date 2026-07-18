import { serializeContext } from '@/lib/execution/context-serializer'
import { createLogger } from '@/lib/logs/console/logger'
import { BlockType, EDGE } from '@/executor/consts'
import type { DAG } from '@/executor/dag/builder'
import type { EdgeManager } from '@/executor/execution/edge-manager'
import type { NodeExecutionOrchestrator } from '@/executor/orchestrators/node'
import type {
  ExecutionContext,
  ExecutionResult,
  NormalizedBlockOutput,
  PauseMetadata,
} from '@/executor/types'

const logger = createLogger('DAGExecutionEngine')

/** Hard ceiling on node executions to guarantee termination if loop coordination misbehaves. */
const MAX_NODE_EXECUTIONS = 100_000

export interface EngineHooks {
  /** Synchronous in-process cancellation flag (browser manual runs, `cancel()`). */
  isCancelled?: () => boolean
  /** Cross-instance cancellation probe (worker runs). */
  checkCancelled?: () => Promise<boolean>
}

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
  private cancelled = false
  private pausedMeta: PauseMetadata | null = null

  constructor(
    private context: ExecutionContext,
    private dag: DAG,
    private edgeManager: EdgeManager,
    private nodeOrchestrator: NodeExecutionOrchestrator,
    private hooks: EngineHooks = {}
  ) {}

  async run(triggerBlockId?: string, seedNodeIds?: string[]): Promise<ExecutionResult> {
    const startTime = new Date()
    this.context.metadata.startTime = this.context.metadata.startTime ?? startTime.toISOString()

    try {
      if (await this.isCancelled()) {
        return this.cancelledResult(startTime)
      }

      if (seedNodeIds && seedNodeIds.length > 0) {
        this.addMultipleToQueue(seedNodeIds)
      } else {
        this.initializeQueue(triggerBlockId)
      }

      while (this.hasWork()) {
        if (this.errorFlag || this.stoppedEarly || this.pausedMeta) break
        if (await this.isCancelled()) {
          this.cancelled = true
          break
        }
        await this.processQueue()
      }

      await this.waitForAllExecutions()

      if (this.errorFlag && this.executionError && !this.responseLocked) {
        throw this.executionError
      }

      if (this.cancelled) {
        return this.cancelledResult(startTime)
      }

      if (this.pausedMeta) {
        return this.pausedResult(startTime)
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

    // Prefer the manual starter, then any trigger node — matching how the DAG's reachable set was
    // resolved, so a workflow with both a starter and a schedule/webhook trigger starts consistently.
    const nodes = Array.from(this.dag.nodes.values())
    const startNode =
      nodes.find((node) => node.block.metadata?.id === BlockType.STARTER) ??
      nodes.find((node) => node.block.metadata?.category === 'triggers')
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

    // A human-in-the-loop or async-wait block halts the run: record the pause and stop scheduling
    // downstream nodes so the caller can persist the snapshot and resume later.
    if (output._pauseMetadata && (output as any).status === 'waiting') {
      this.pausedMeta = output._pauseMetadata as PauseMetadata
      return
    }

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

    // A block error with no `error` edge to catch it fails the whole run, matching the legacy driver
    // (a caught error instead flows down the error edge below).
    if (this.isUnhandledError(node, output)) {
      this.errorFlag = true
      this.executionError = new Error(String(output.error))
      return
    }

    const readyNodes = this.edgeManager.processOutgoingEdges(node, output, false)
    this.addMultipleToQueue(readyNodes)
  }

  private isUnhandledError(
    node: {
      block: { metadata?: { id?: string } }
      outgoingEdges: Map<string, { sourceHandle?: string }>
    },
    output: NormalizedBlockOutput
  ): boolean {
    if (output.error === undefined) return false

    const type = node.block.metadata?.id
    if (type === 'mssql' || type === 'mysql') return false

    const hasData =
      output.data !== undefined && !(Array.isArray(output.data) && output.data.length === 0)
    if (hasData) return false

    for (const [, edge] of node.outgoingEdges) {
      if (edge.sourceHandle === EDGE.ERROR) return false
    }
    return true
  }

  private async isCancelled(): Promise<boolean> {
    if (this.cancelled || this.hooks.isCancelled?.()) return true
    if (this.hooks.checkCancelled) {
      try {
        return await this.hooks.checkCancelled()
      } catch {
        return false
      }
    }
    return false
  }

  private cancelledResult(startTime: Date): ExecutionResult {
    this.context.metadata.endTime = new Date().toISOString()
    this.context.metadata.duration = Date.now() - startTime.getTime()
    return {
      success: false,
      output: this.finalOutput,
      error: 'Workflow execution was cancelled',
      logs: this.context.blockLogs,
    }
  }

  private pausedResult(startTime: Date): ExecutionResult {
    const meta = this.pausedMeta!
    const startIso = this.context.metadata.startTime ?? startTime.toISOString()
    const baseMeta = {
      duration: Date.now() - new Date(startIso).getTime(),
      startTime: startIso,
      endTime: new Date().toISOString(),
    }
    return {
      success: false,
      output: {},
      logs: this.context.blockLogs,
      metadata: { ...baseMeta, paused: true } as any,
      paused: {
        contextId: meta.contextId ?? '',
        blockId: meta.blockId ?? '',
        pauseKind: meta.pauseKind === 'time' ? 'time' : 'human-in-the-loop',
        resumeAt: meta.resumeAt,
        snapshot: serializeContext(this.context),
      },
    } as ExecutionResult
  }
}
