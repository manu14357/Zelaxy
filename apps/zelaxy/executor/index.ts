import { BlockPathCalculator } from '@/lib/block-path-calculator'
import { createLogger } from '@/lib/logs/console/logger'
import type { BlockOutput } from '@/blocks/types'
import { BlockRunner } from '@/executor/driver/block-executor'
import { EdgeManager } from '@/executor/driver/edge-manager'
import { ExecutionEngine } from '@/executor/driver/engine'
import type { DriverRuntime } from '@/executor/driver/runtime'
import { DAGExecutor } from '@/executor/execution/executor'
import { createBlockHandlers } from '@/executor/handlers/registry'
import { LoopManager } from '@/executor/loops/loops'
import { ParallelManager } from '@/executor/parallels/parallels'
import { PathTracker } from '@/executor/path/path'
import { InputResolver } from '@/executor/resolver/resolver'
import type {
  BlockLog,
  ExecutionContext,
  ExecutionResult,
  StreamingExecution,
} from '@/executor/types'
import type { SerializedWorkflow } from '@/serializer/types'
import { useGeneralStore } from '@/stores/settings/general/store'

const logger = createLogger('Executor')

/**
 * Whether execute() should route through the sentinel/orchestrator DAG executor. Default off — the
 * legacy driver remains the default until the DAG path reaches parity. Server-side flag only;
 * browser manual runs always use the legacy path (process.env is undefined there).
 */
function isDagExecutorEnabled(): boolean {
  return typeof process !== 'undefined' && process.env.EXECUTOR_USE_DAG === 'true'
}

/**
 * Public entry point for running a workflow.
 *
 * The Executor parses the constructor input, builds the shared execution components (input resolver,
 * loop/parallel managers, path tracker, block handlers) and the driver layer that runs on top of
 * them — an {@link EdgeManager} (readiness/routing), a {@link BlockRunner} (per-block execution) and
 * an {@link ExecutionEngine} (the scheduling loop). It then delegates every run to that engine while
 * owning the mutable runtime state (completion callbacks, cancellation flag) the driver reads.
 */
export class Executor {
  private engine: ExecutionEngine
  private runtime: DriverRuntime
  private actualWorkflow: SerializedWorkflow
  private blockHandlers: ReturnType<typeof createBlockHandlers>

  constructor(
    workflowParam:
      | SerializedWorkflow
      | {
          workflow: SerializedWorkflow
          currentBlockStates?: Record<string, BlockOutput>
          envVarValues?: Record<string, string>
          workflowInput?: any
          workflowVariables?: Record<string, any>
          contextExtensions?: {
            stream?: boolean
            selectedOutputIds?: string[]
            edges?: Array<{ source: string; target: string }>
            onStream?: (streamingExecution: StreamingExecution) => Promise<void>
            onBlockComplete?: (blockLog: BlockLog) => void | Promise<void>
            onExecutionStart?: (workflowId: string, executionId?: string) => void | Promise<void>
            onExecutionComplete?: (result: ExecutionResult) => void | Promise<void>
            executionId?: string
            workspaceId?: string
            userId?: string
            isChildExecution?: boolean
            /**
             * Lets a server-side caller stop a run started elsewhere.
             *
             * Injected rather than imported: this Executor also runs in the browser for manual
             * runs, and reaching for Redis here would pull ioredis into the client bundle. The
             * worker supplies a Redis-backed check; the browser supplies nothing and keeps using
             * the in-process flag, which is correct there since the executor being cancelled is
             * the one the user is looking at.
             */
            checkCancelled?: () => Promise<boolean>
          }
          startBlockId?: string
        },
    initialBlockStates: Record<string, BlockOutput> = {},
    environmentVariables: Record<string, string> = {},
    workflowInput?: any,
    workflowVariables: Record<string, any> = {}
  ) {
    // Normalize the two accepted constructor shapes into a single set of run inputs.
    let constructorStartBlockId: string | undefined
    let contextExtensions: any = {}
    let isChildExecution = false
    let onBlockComplete: DriverRuntime['onBlockComplete']
    let onExecutionStart: DriverRuntime['onExecutionStart']
    let onExecutionComplete: DriverRuntime['onExecutionComplete']
    let checkCancelled: (() => Promise<boolean>) | undefined
    let resolvedInput: any

    if (typeof workflowParam === 'object' && 'workflow' in workflowParam) {
      const options = workflowParam
      this.actualWorkflow = options.workflow
      initialBlockStates = options.currentBlockStates || {}
      environmentVariables = options.envVarValues || {}
      resolvedInput = options.workflowInput || {}
      workflowVariables = options.workflowVariables || {}
      constructorStartBlockId = options.startBlockId

      if (options.contextExtensions) {
        contextExtensions = options.contextExtensions
        isChildExecution = options.contextExtensions.isChildExecution || false
        onBlockComplete = options.contextExtensions.onBlockComplete
        onExecutionStart = options.contextExtensions.onExecutionStart
        onExecutionComplete = options.contextExtensions.onExecutionComplete
        checkCancelled = options.contextExtensions.checkCancelled

        if (contextExtensions.stream) {
          logger.info('Executor initialized with streaming enabled', {
            hasSelectedOutputIds: Array.isArray(contextExtensions.selectedOutputIds),
            selectedOutputCount: Array.isArray(contextExtensions.selectedOutputIds)
              ? contextExtensions.selectedOutputIds.length
              : 0,
            selectedOutputIds: contextExtensions.selectedOutputIds || [],
          })
        }
      }
    } else {
      this.actualWorkflow = workflowParam

      if (workflowInput) {
        resolvedInput = workflowInput
        logger.info('[Executor] Using workflow input:', JSON.stringify(resolvedInput, null, 2))
      } else {
        resolvedInput = {}
      }
    }

    this.runtime = {
      initialBlockStates,
      environmentVariables,
      workflowInput: resolvedInput,
      workflowVariables,
      contextExtensions,
      isChildExecution,
      isDebugging: useGeneralStore.getState().isDebugModeEnabled,
      cancelled: false,
      checkCancelled,
      onBlockComplete,
      onExecutionStart,
      onExecutionComplete,
    }

    const loopManager = new LoopManager(this.actualWorkflow.loops || {})
    const parallelManager = new ParallelManager(this.actualWorkflow.parallels || {})

    // Calculate accessible blocks for consistent reference resolution
    const accessibleBlocksMap = BlockPathCalculator.calculateAccessibleBlocksForWorkflow(
      this.actualWorkflow
    )

    const resolver = new InputResolver(
      this.actualWorkflow,
      environmentVariables,
      workflowVariables,
      loopManager,
      accessibleBlocksMap
    )
    const pathTracker = new PathTracker(this.actualWorkflow)

    // Single source of truth for handler registration (see handlers/registry.ts).
    // Keeping this centralized prevents the handler list from drifting and
    // silently dropping block handlers.
    this.blockHandlers = createBlockHandlers({ pathTracker, resolver })

    const edgeManager = new EdgeManager(this.actualWorkflow, parallelManager, pathTracker)
    const blockRunner = new BlockRunner(
      this.actualWorkflow,
      resolver,
      this.blockHandlers,
      parallelManager,
      edgeManager,
      this.runtime
    )
    this.engine = new ExecutionEngine(
      this.actualWorkflow,
      loopManager,
      parallelManager,
      edgeManager,
      blockRunner,
      this.runtime
    )

    this.engine.validateWorkflow(constructorStartBlockId)
  }

  /**
   * Sets the callback invoked after each block finishes executing.
   * Used by LoggingSession to stream per-block updates to the frontend.
   */
  public setOnBlockComplete(cb: (blockLog: BlockLog) => void | Promise<void>): void {
    this.runtime.onBlockComplete = cb
  }

  /**
   * Sets the callback invoked when execution starts.
   */
  public setOnExecutionStart(
    cb: (workflowId: string, executionId?: string) => void | Promise<void>
  ): void {
    this.runtime.onExecutionStart = cb
  }

  /**
   * Sets the callback invoked when execution completes (success or error).
   */
  public setOnExecutionComplete(cb: (result: ExecutionResult) => void | Promise<void>): void {
    this.runtime.onExecutionComplete = cb
  }

  /**
   * Cancels the current workflow execution.
   * Sets the cancellation flag to stop further execution.
   */
  public cancel(): void {
    logger.info('Workflow execution cancelled')
    this.runtime.cancelled = true
  }

  /**
   * Executes the workflow and returns the result.
   *
   * @param workflowId - Unique identifier for the workflow execution
   * @param startBlockId - Optional block ID to start execution from (for webhook or schedule triggers)
   * @returns Execution result containing output, logs, and metadata, or a stream, or combined execution and stream
   */
  async execute(
    workflowId: string,
    startBlockId?: string
  ): Promise<ExecutionResult | StreamingExecution> {
    if (isDagExecutorEnabled()) {
      const dag = new DAGExecutor({
        workflow: this.actualWorkflow,
        currentBlockStates: this.runtime.initialBlockStates,
        envVarValues: this.runtime.environmentVariables,
        workflowInput: this.runtime.workflowInput,
        workflowVariables: this.runtime.workflowVariables,
        contextExtensions: {
          executionId: this.runtime.contextExtensions?.executionId,
          workspaceId: this.runtime.contextExtensions?.workspaceId,
          userId: this.runtime.contextExtensions?.userId,
          onBlockComplete: this.runtime.onBlockComplete,
        },
      })
      return dag.execute(workflowId, startBlockId)
    }
    return this.engine.execute(workflowId, startBlockId)
  }

  /**
   * Continues execution in debug mode from the current state.
   *
   * @param blockIds - Block IDs to execute in this step
   * @param context - The current execution context
   * @returns Updated execution result
   */
  async continueExecution(blockIds: string[], context: ExecutionContext): Promise<ExecutionResult> {
    return this.engine.continueExecution(blockIds, context)
  }

  /**
   * Resumes a run that halted at a human-in-the-loop or async-wait block.
   *
   * @param context - The rehydrated execution context from the pause snapshot
   * @param blockId - The block that paused
   * @param resolution - The resolution to apply to the paused block's output
   * @returns The execution result after resuming to completion or the next pause
   */
  async resumeFromPause(
    context: ExecutionContext,
    blockId: string,
    resolution: Record<string, any>
  ): Promise<ExecutionResult> {
    return this.engine.resumeFromPause(context, blockId, resolution)
  }
}
