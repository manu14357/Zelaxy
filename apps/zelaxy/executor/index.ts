import { createLogger } from '@/lib/logs/console/logger'
import type { BlockOutput } from '@/blocks/types'
import { DAGExecutor } from '@/executor/execution/executor'
import { validateWorkflow } from '@/executor/execution/validate'
import type {
  BlockLog,
  ExecutionContext,
  ExecutionResult,
  StreamingExecution,
} from '@/executor/types'
import type { SerializedWorkflow } from '@/serializer/types'

const logger = createLogger('Executor')

/**
 * Public entry point for running a workflow.
 *
 * Parses the accepted constructor shapes, validates the workflow, and delegates every run to the
 * sentinel/orchestrator {@link DAGExecutor}. The facade owns the mutable run state — the completion
 * callbacks and the cancellation flag — and threads them into each DAGExecutor it builds, so a
 * later `cancel()` or `setOnBlockComplete()` is observed by the running engine.
 */
export class Executor {
  private actualWorkflow: SerializedWorkflow
  private initialBlockStates: Record<string, BlockOutput>
  private environmentVariables: Record<string, string>
  private workflowInput: any
  private workflowVariables: Record<string, any>
  private contextExtensions: any = {}
  private cancelled = false
  private checkCancelled?: () => Promise<boolean>
  private onBlockComplete?: (blockLog: BlockLog) => void | Promise<void>
  private onExecutionStart?: (workflowId: string, executionId?: string) => void | Promise<void>
  private onExecutionComplete?: (result: ExecutionResult) => void | Promise<void>

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
            checkCancelled?: () => Promise<boolean>
          }
          startBlockId?: string
        },
    initialBlockStates: Record<string, BlockOutput> = {},
    environmentVariables: Record<string, string> = {},
    workflowInput?: any,
    workflowVariables: Record<string, any> = {}
  ) {
    let constructorStartBlockId: string | undefined
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
        this.contextExtensions = options.contextExtensions
        this.onBlockComplete = options.contextExtensions.onBlockComplete
        this.onExecutionStart = options.contextExtensions.onExecutionStart
        this.onExecutionComplete = options.contextExtensions.onExecutionComplete
        this.checkCancelled = options.contextExtensions.checkCancelled
      }
    } else {
      this.actualWorkflow = workflowParam
      resolvedInput = workflowInput ?? {}
    }

    this.initialBlockStates = initialBlockStates
    this.environmentVariables = environmentVariables
    this.workflowInput = resolvedInput
    this.workflowVariables = workflowVariables

    validateWorkflow(this.actualWorkflow, constructorStartBlockId)
  }

  /** Sets the callback invoked after each block finishes (per-block log streaming). */
  public setOnBlockComplete(cb: (blockLog: BlockLog) => void | Promise<void>): void {
    this.onBlockComplete = cb
  }

  /** Sets the callback invoked when execution starts. */
  public setOnExecutionStart(
    cb: (workflowId: string, executionId?: string) => void | Promise<void>
  ): void {
    this.onExecutionStart = cb
  }

  /** Sets the callback invoked when execution completes (success or error). */
  public setOnExecutionComplete(cb: (result: ExecutionResult) => void | Promise<void>): void {
    this.onExecutionComplete = cb
  }

  /** Cancels the current workflow execution. */
  public cancel(): void {
    logger.info('Workflow execution cancelled')
    this.cancelled = true
  }

  async execute(
    workflowId: string,
    startBlockId?: string
  ): Promise<ExecutionResult | StreamingExecution> {
    return this.build().execute(workflowId, startBlockId)
  }

  async continueExecution(blockIds: string[], context: ExecutionContext): Promise<ExecutionResult> {
    return this.build().continueExecution(blockIds, context)
  }

  async resumeFromPause(
    context: ExecutionContext,
    blockId: string,
    resolution: Record<string, any>
  ): Promise<ExecutionResult> {
    return this.build().resumeFromPause(context, blockId, resolution)
  }

  /** Builds a DAGExecutor from the run inputs plus the current mutable callbacks/cancel flag. */
  private build(): DAGExecutor {
    return new DAGExecutor({
      workflow: this.actualWorkflow,
      currentBlockStates: this.initialBlockStates,
      envVarValues: this.environmentVariables,
      workflowInput: this.workflowInput,
      workflowVariables: this.workflowVariables,
      contextExtensions: {
        executionId: this.contextExtensions?.executionId,
        workspaceId: this.contextExtensions?.workspaceId,
        userId: this.contextExtensions?.userId,
        onBlockComplete: this.onBlockComplete,
        onExecutionStart: this.onExecutionStart,
        onExecutionComplete: this.onExecutionComplete,
        isCancelled: () => this.cancelled,
        checkCancelled: this.checkCancelled,
        stream: this.contextExtensions?.stream,
        selectedOutputIds: this.contextExtensions?.selectedOutputIds,
        edges: this.contextExtensions?.edges,
        onStream: this.contextExtensions?.onStream,
      },
    })
  }
}
