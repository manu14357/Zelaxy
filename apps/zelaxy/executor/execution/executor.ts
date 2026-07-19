import { BlockPathCalculator } from '@/lib/block-path-calculator'
import { createLogger } from '@/lib/logs/console/logger'
import type { BlockOutput } from '@/blocks/types'
import { BlockType, isMetadataOnlyBlockType, isTriggerBlockType } from '@/executor/consts'
import type { DAG, DAGNode } from '@/executor/dag/builder'
import { DAGBuilder } from '@/executor/dag/builder'
import { BlockExecutor } from '@/executor/execution/block-executor'
import { EdgeManager } from '@/executor/execution/edge-manager'
import { ExecutionEngine } from '@/executor/execution/engine'
import { ExecutionState } from '@/executor/execution/state'
import { createBlockHandlers } from '@/executor/handlers/registry'
import { LoopManager } from '@/executor/loops/loops'
import { LoopOrchestrator } from '@/executor/orchestrators/loop'
import { NodeExecutionOrchestrator } from '@/executor/orchestrators/node'
import { ParallelOrchestrator } from '@/executor/orchestrators/parallel'
import { PathTracker } from '@/executor/path/path'
import { InputResolver } from '@/executor/resolver/resolver'
import type {
  BlockLog,
  BlockState,
  ExecutionContext,
  ExecutionResult,
  NormalizedBlockOutput,
  StreamingExecution,
} from '@/executor/types'
import {
  buildBranchNodeId,
  buildParallelSentinelEndId,
  buildParallelSentinelStartId,
  buildSentinelEndId,
  buildSentinelStartId,
  extractBaseBlockId,
} from '@/executor/utils/subflow-utils'
import type { SerializedBlock, SerializedWorkflow } from '@/serializer/types'

const logger = createLogger('DAGExecutor')

export interface DAGExecutorOptions {
  workflow: SerializedWorkflow
  currentBlockStates?: Record<string, BlockOutput>
  envVarValues?: Record<string, string>
  workflowInput?: any
  workflowVariables?: Record<string, any>
  contextExtensions?: {
    executionId?: string
    workspaceId?: string
    userId?: string
    onBlockComplete?: (log: BlockLog) => void | Promise<void>
    onExecutionStart?: (workflowId: string, executionId?: string) => void | Promise<void>
    onExecutionComplete?: (result: ExecutionResult) => void | Promise<void>
    isCancelled?: () => boolean
    checkCancelled?: () => Promise<boolean>
    stream?: boolean
    selectedOutputIds?: string[]
    edges?: Array<{ source: string; target: string }>
    onStream?: (streamingExecution: StreamingExecution) => Promise<string>
  }
}

/**
 * Sentinel/orchestrator DAG executor — the workflow execution engine. Builds the workflow into a
 * DAG (with loop/parallel sentinel nodes), then drives it with the {@link ExecutionEngine}: nodes
 * flow through the {@link NodeExecutionOrchestrator} (regular blocks → handlers via
 * {@link BlockExecutor}; sentinels → loop/parallel orchestrators) and the {@link EdgeManager}
 * decides downstream readiness. The {@link Executor} facade validates input and delegates here.
 */
export class DAGExecutor {
  private workflow: SerializedWorkflow
  private environmentVariables: Record<string, string>
  private workflowInput: any
  private workflowVariables: Record<string, any>
  private initialBlockStates: Record<string, BlockOutput>
  private contextExtensions: NonNullable<DAGExecutorOptions['contextExtensions']>
  private dagBuilder = new DAGBuilder()

  constructor(options: DAGExecutorOptions) {
    this.workflow = options.workflow
    this.environmentVariables = options.envVarValues ?? {}
    this.workflowInput = options.workflowInput ?? {}
    this.workflowVariables = options.workflowVariables ?? {}
    this.initialBlockStates = options.currentBlockStates ?? {}
    this.contextExtensions = options.contextExtensions ?? {}
  }

  async execute(workflowId: string, triggerBlockId?: string): Promise<ExecutionResult> {
    // Resolve the single entry point once, so the DAG's reachable set, the engine's start queue, and
    // the seeded start block all agree. (They previously resolved independently and could disagree —
    // e.g. a manual run of a trigger workflow whose trigger the browser hook strips before serializing
    // left the engine with no starter/trigger node to queue, so nothing ran.)
    const entryBlockId = this.resolveEntryBlockId(triggerBlockId)
    const dag = this.buildDag(entryBlockId)

    // Note: `initialBlockStates` (the UI's `currentBlockStates`) holds each block's raw subblock
    // *config* values (e.g. `responseFormat`, used by BlockExecutor for streaming) — not prior
    // execution outputs. It must never seed `ExecutionState`: doing so marked every block in the
    // workflow as already-`executed`, so the orchestrator's `hasExecuted()` gate short-circuited
    // every node before it ever reached a handler — a manual run "succeeded" having run nothing.
    const state = new ExecutionState()

    const context = this.createExecutionContext(workflowId, state, entryBlockId)
    const { engine } = this.buildPipeline(dag, state, context)
    logger.info('Running DAG executor', {
      workflowId,
      entryBlockId,
      nodeCount: dag.nodes.size,
      loopCount: dag.loopConfigs.size,
      parallelCount: dag.parallelConfigs.size,
    })

    try {
      await this.contextExtensions.onExecutionStart?.(
        workflowId,
        this.contextExtensions.executionId
      )
    } catch (e) {
      logger.warn('onExecutionStart callback error', { error: e })
    }

    const result = await engine.run(entryBlockId)

    try {
      await this.contextExtensions.onExecutionComplete?.(result)
    } catch (e) {
      logger.warn('onExecutionComplete callback error', { error: e })
    }

    return result
  }

  /**
   * Resumes a run that halted at a human-in-the-loop / async-wait gate. The paused block's output is
   * overwritten with the resolution and the run continues from that block's downstream, reusing the
   * restored context's block states and executed set (mutated in place so the caller observes it).
   */
  async resumeFromPause(
    context: ExecutionContext,
    blockId: string,
    resolution: Record<string, any>
  ): Promise<ExecutionResult> {
    const dag = this.buildDag()

    const state = new ExecutionState(
      context.blockStates as Map<string, BlockState>,
      context.executedBlocks as Set<string>
    )
    const resumedOutput = { status: 'completed', ...resolution } as unknown as NormalizedBlockOutput
    state.setBlockState(blockId, { output: resumedOutput, executed: true, executionTime: 0 })
    const resumedLog = context.blockLogs.find((l) => l.blockId === blockId)
    if (resumedLog) resumedLog.output = resumedOutput

    const { engine, edgeManager } = this.buildPipeline(dag, state, context)
    const resumedNode = dag.nodes.get(blockId)
    const seed = resumedNode
      ? edgeManager.processOutgoingEdges(resumedNode, resumedOutput, false)
      : []
    return engine.run(undefined, seed)
  }

  /** Debug single-stepping is not supported on the DAG executor (matches Sim's DAGExecutor). */
  async continueExecution(
    _pendingBlocks: string[],
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    return {
      success: false,
      output: {},
      logs: context.blockLogs ?? [],
      error: 'Debug step-through is not supported on the DAG executor',
      metadata: { duration: 0, startTime: new Date().toISOString() },
    }
  }

  /**
   * Resolves the single block the run starts from — the one the DAG's reachable set, the engine's
   * start queue, and the seeded start block must all agree on. A triggered run (scheduled/webhook)
   * passes its trigger id explicitly. A manual run (Run button) has no id, and the browser hook
   * strips trigger-category blocks before serializing, so fall back to the manual starter, then any
   * remaining trigger block, then the first root block (a non-metadata block with no incoming edge).
   * Mirrors {@link PathConstructor.findTriggerBlock}'s no-trigger branch so all three stay in sync.
   */
  private resolveEntryBlockId(triggerBlockId?: string): string | undefined {
    if (triggerBlockId) {
      const block = this.workflow.blocks.find((b) => b.id === triggerBlockId)
      if (block) return triggerBlockId
    }

    const starter = this.workflow.blocks.find(
      (b) => b.enabled && b.metadata?.id === BlockType.STARTER
    )
    if (starter) return starter.id

    const trigger = this.workflow.blocks.find(
      (b) => b.enabled && isTriggerBlockType(b.metadata?.id)
    )
    if (trigger) return trigger.id

    return this.findRootBlockId()
  }

  /** First enabled block with no incoming edge that isn't a layout-only node (loop/parallel/note). */
  private findRootBlockId(): string | undefined {
    const hasIncoming = new Set(this.workflow.connections.map((c) => c.target))
    const root = this.workflow.blocks.find(
      (b) => b.enabled && !hasIncoming.has(b.id) && !isMetadataOnlyBlockType(b.metadata?.id)
    )
    return root?.id
  }

  private buildDag(triggerBlockId?: string): DAG {
    const dag = this.dagBuilder.build(this.workflow, { triggerBlockId })
    this.normalizeNestedSubflowEdges(dag)
    this.expandParallelBranches(dag)
    return dag
  }

  private buildPipeline(
    dag: DAG,
    state: ExecutionState,
    context: ExecutionContext
  ): { engine: ExecutionEngine; edgeManager: EdgeManager } {
    const loopManager = new LoopManager(this.workflow.loops || {})
    const accessibleBlocksMap = BlockPathCalculator.calculateAccessibleBlocksForWorkflow(
      this.workflow
    )
    const resolver = new InputResolver(
      this.workflow,
      this.environmentVariables,
      this.workflowVariables,
      loopManager,
      accessibleBlocksMap
    )
    const pathTracker = new PathTracker(this.workflow)
    const handlers = createBlockHandlers({ pathTracker, resolver })

    const blockExecutor = new BlockExecutor(
      handlers,
      resolver,
      this.contextExtensions.onBlockComplete,
      this.initialBlockStates
    )
    const edgeManager = new EdgeManager(dag)
    const loopOrchestrator = new LoopOrchestrator(dag, state, edgeManager)
    const parallelOrchestrator = new ParallelOrchestrator(dag, state)
    const nodeOrchestrator = new NodeExecutionOrchestrator(
      dag,
      state,
      blockExecutor,
      loopOrchestrator,
      parallelOrchestrator
    )
    const engine = new ExecutionEngine(context, dag, edgeManager, nodeOrchestrator, {
      isCancelled: this.contextExtensions.isCancelled,
      checkCancelled: this.contextExtensions.checkCancelled,
    })
    return { engine, edgeManager }
  }

  /**
   * Removes the spurious sentinel edges the builder adds between a subflow and nodes that live
   * inside a *nested* child subflow. Such a node is a transitive member of the outer subflow, so the
   * builder wires the outer start/end straight to it; correct flow must go through the child's
   * sentinels only. Without this, a loop-in-loop miscounts.
   */
  private normalizeNestedSubflowEdges(dag: DAG): void {
    const subflows: Array<{ id: string; isLoop: boolean }> = [
      ...Array.from(dag.loopConfigs.keys()).map((id) => ({ id, isLoop: true })),
      ...Array.from(dag.parallelConfigs.keys()).map((id) => ({ id, isLoop: false })),
    ]

    for (const { id, isLoop } of subflows) {
      const config = dag.loopConfigs.get(id) ?? dag.parallelConfigs.get(id)
      const startId = isLoop ? buildSentinelStartId(id) : buildParallelSentinelStartId(id)
      const endId = isLoop ? buildSentinelEndId(id) : buildParallelSentinelEndId(id)
      const startNode = dag.nodes.get(startId)
      const endNode = dag.nodes.get(endId)
      if (!startNode || !endNode) continue

      const nestedInternal = new Set<string>()
      for (const child of config?.nodes ?? []) {
        if (!dag.loopConfigs.has(child) && !dag.parallelConfigs.has(child)) continue
        const childStart = dag.loopConfigs.has(child)
          ? buildSentinelStartId(child)
          : buildParallelSentinelStartId(child)
        const childEnd = dag.loopConfigs.has(child)
          ? buildSentinelEndId(child)
          : buildParallelSentinelEndId(child)
        for (const inner of this.collectSubflowDagNodeIds(dag, child)) {
          if (inner !== childStart && inner !== childEnd) nestedInternal.add(inner)
        }
      }

      for (const nodeId of nestedInternal) {
        for (const [key, edge] of Array.from(startNode.outgoingEdges)) {
          if (edge.target === nodeId) startNode.outgoingEdges.delete(key)
        }
        const node = dag.nodes.get(nodeId)
        if (node) {
          node.incomingEdges.delete(startId)
          for (const [key, edge] of Array.from(node.outgoingEdges)) {
            if (edge.target === endId) node.outgoingEdges.delete(key)
          }
        }
        endNode.incomingEdges.delete(nodeId)
      }
    }
  }

  /** All DAG node ids belonging to a subflow (its sentinels + members), recursing into nesting. */
  private collectSubflowDagNodeIds(dag: DAG, subflowId: string): Set<string> {
    const isLoop = dag.loopConfigs.has(subflowId)
    const start = isLoop ? buildSentinelStartId(subflowId) : buildParallelSentinelStartId(subflowId)
    const end = isLoop ? buildSentinelEndId(subflowId) : buildParallelSentinelEndId(subflowId)
    const ids = new Set<string>([start, end])
    const config = dag.loopConfigs.get(subflowId) ?? dag.parallelConfigs.get(subflowId)
    for (const nodeId of config?.nodes ?? []) {
      if (dag.loopConfigs.has(nodeId) || dag.parallelConfigs.has(nodeId)) {
        for (const nested of this.collectSubflowDagNodeIds(dag, nodeId)) ids.add(nested)
      } else {
        ids.add(nodeId)
      }
    }
    return ids
  }

  /**
   * Expands a parallel's single-branch template (built as `<node>₍0₎`) into one branch per
   * distribution item, cloning the branch nodes and wiring the start sentinel to each clone and each
   * clone to the end sentinel. Covers the common single-level parallel; nested subflow expansion is
   * not yet handled.
   */
  private expandParallelBranches(dag: DAG): void {
    for (const [parallelId, config] of dag.parallelConfigs) {
      const total = this.branchCount(config)
      if (total <= 1) continue

      const startId = buildParallelSentinelStartId(parallelId)
      const endId = buildParallelSentinelEndId(parallelId)
      const startNode = dag.nodes.get(startId)
      const endNode = dag.nodes.get(endId)
      if (!startNode || !endNode) continue

      const templates = Array.from(dag.nodes.values()).filter(
        (n) =>
          n.metadata.isParallelBranch &&
          n.metadata.parallelId === parallelId &&
          (n.metadata.branchIndex ?? 0) === 0
      )
      if (templates.length === 0) continue
      for (const t of templates) t.metadata.branchTotal = total

      for (let i = 1; i < total; i++) {
        for (const t of templates) {
          const cloneId = buildBranchNodeId(extractBaseBlockId(t.id), i)
          const clone: DAGNode = {
            id: cloneId,
            block: { ...t.block, id: cloneId },
            incomingEdges: new Set([startId]),
            outgoingEdges: new Map([['end', { target: endId, sourceHandle: 'parallel_exit' }]]),
            metadata: { ...t.metadata, branchIndex: i, branchTotal: total },
          }
          dag.nodes.set(cloneId, clone)
          startNode.outgoingEdges.set(`start-${cloneId}`, { target: cloneId })
          endNode.incomingEdges.add(cloneId)
        }
      }
    }
  }

  private branchCount(config: any): number {
    const raw = config?.distribution ?? config?.items
    if (Array.isArray(raw)) return raw.length
    if (typeof config?.count === 'number') return config.count
    return 1
  }

  private createExecutionContext(
    workflowId: string,
    state: ExecutionState,
    entryBlockId?: string
  ): ExecutionContext {
    const context: ExecutionContext = {
      workflowId,
      workspaceId: this.contextExtensions.workspaceId,
      executionId: this.contextExtensions.executionId,
      userId: this.contextExtensions.userId,
      blockStates: state.getBlockStates() as Map<string, BlockState>,
      blockLogs: [],
      metadata: { startTime: new Date().toISOString(), duration: 0 },
      environmentVariables: this.environmentVariables,
      decisions: { router: new Map(), condition: new Map() },
      loopIterations: new Map(),
      loopItems: new Map(),
      completedLoops: new Set(),
      executedBlocks: state.getExecutedBlocks() as Set<string>,
      // Populated with all enabled blocks so a snapshot taken on pause can be resumed by the legacy
      // resume path (which schedules from activeExecutionPath); the DAG scheduler itself ignores it.
      activeExecutionPath: new Set(
        this.workflow.blocks.filter((b) => b.enabled !== false).map((b) => b.id)
      ),
      workflow: this.workflow,
      workflowVariables: this.workflowVariables,
      stream: this.contextExtensions.stream ?? false,
      selectedOutputIds: this.contextExtensions.selectedOutputIds ?? [],
      edges: this.contextExtensions.edges ?? [],
      onStream: this.contextExtensions.onStream,
    }

    this.seedStartBlock(state, entryBlockId)
    return context
  }

  /**
   * Seeds the trigger/starter block's output so downstream blocks can resolve `{{start.input}}`.
   * Mirrors the shapes the legacy driver produces for structured (inputFormat), chat, API and
   * primitive inputs. Only a genuine start block (the manual starter or a trigger) carries the
   * workflow input; a plain root block (a trigger workflow run manually with its trigger stripped)
   * has nothing to seed — it just executes and produces its own output.
   */
  private seedStartBlock(state: ExecutionState, entryBlockId?: string): void {
    if (!entryBlockId) return
    const startBlock = this.workflow.blocks.find((b) => b.id === entryBlockId)
    if (!startBlock) return

    const isStartBlock =
      startBlock.metadata?.id === BlockType.STARTER ||
      isTriggerBlockType(startBlock.metadata?.id) ||
      startBlock.metadata?.category === 'triggers'
    if (!isStartBlock) return

    if (state.getBlockStates().has(startBlock.id)) return

    const output = this.buildStartOutput(startBlock)
    state.setBlockState(startBlock.id, { output: output as any, executed: false, executionTime: 0 })
  }

  private buildStartOutput(startBlock: SerializedBlock): Record<string, any> {
    const input = this.workflowInput
    const inputFormat = startBlock.config?.params?.inputFormat

    if (Array.isArray(inputFormat) && inputFormat.length > 0) {
      const structured: Record<string, any> = {}
      for (const field of inputFormat) {
        if (!field?.name) continue
        let value = input?.input?.[field.name] ?? input?.[field.name]
        if (value === undefined && input?.input !== undefined && inputFormat.length === 1) {
          value = input.input
        }
        structured[field.name] = value
      }
      return { input: structured, conversationId: input?.conversationId, ...structured }
    }

    if (input && typeof input === 'object') {
      if ('input' in input && 'conversationId' in input) {
        return { input: input.input, conversationId: input.conversationId }
      }
      const spread = { ...input }
      if (!('input' in spread)) spread.input = ''
      return spread
    }

    return { input }
  }
}
