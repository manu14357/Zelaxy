import { BlockPathCalculator } from '@/lib/block-path-calculator'
import { createLogger } from '@/lib/logs/console/logger'
import type { BlockOutput } from '@/blocks/types'
import { BlockType } from '@/executor/consts'
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
import type { BlockLog, BlockState, ExecutionContext, ExecutionResult } from '@/executor/types'
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
  }
}

/**
 * Sentinel/orchestrator DAG executor. Builds the workflow into a DAG (with loop/parallel sentinel
 * nodes), then drives it with the {@link ExecutionEngine}: nodes flow through the
 * {@link NodeExecutionOrchestrator} (regular blocks → handlers via {@link BlockExecutor}; sentinels
 * → loop/parallel orchestrators) and the {@link EdgeManager} decides downstream readiness.
 *
 * This is the DAG path referenced by the migration plan. It is gated behind a flag in the executor
 * entry point and runs alongside the legacy driver until it reaches parity.
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
    const dag = this.dagBuilder.build(this.workflow, { triggerBlockId })

    const state = new ExecutionState()
    for (const [blockId, output] of Object.entries(this.initialBlockStates)) {
      state.setBlockState(blockId, {
        output: output as any,
        executed: true,
        executionTime: 0,
      })
    }

    const context = this.createExecutionContext(workflowId, state)

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
      this.contextExtensions.onBlockComplete
    )
    const edgeManager = new EdgeManager(dag)
    const loopOrchestrator = new LoopOrchestrator(dag, state)
    const parallelOrchestrator = new ParallelOrchestrator(dag, state)
    const nodeOrchestrator = new NodeExecutionOrchestrator(
      dag,
      state,
      blockExecutor,
      loopOrchestrator,
      parallelOrchestrator
    )

    const engine = new ExecutionEngine(context, dag, edgeManager, nodeOrchestrator)
    logger.info('Running DAG executor', {
      workflowId,
      nodeCount: dag.nodes.size,
      loopCount: dag.loopConfigs.size,
      parallelCount: dag.parallelConfigs.size,
    })
    return engine.run(triggerBlockId)
  }

  private createExecutionContext(workflowId: string, state: ExecutionState): ExecutionContext {
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
      activeExecutionPath: new Set(),
      workflow: this.workflow,
      workflowVariables: this.workflowVariables,
    }

    this.seedStartBlock(context, state)
    return context
  }

  /**
   * Seeds the trigger/starter block's output so downstream blocks can resolve `{{start.input}}`.
   * Mirrors the shapes the legacy driver produces for structured (inputFormat), chat, API and
   * primitive inputs.
   */
  private seedStartBlock(context: ExecutionContext, state: ExecutionState): void {
    const startBlock = this.workflow.blocks.find(
      (b) => b.metadata?.id === BlockType.STARTER || b.metadata?.category === 'triggers'
    )
    if (!startBlock) return
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
