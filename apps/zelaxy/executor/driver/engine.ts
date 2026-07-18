import { serializeContext, unsupportedPauseReason } from '@/lib/execution/context-serializer'
import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { BlockRunner } from '@/executor/driver/block-executor'
import type { EdgeManager } from '@/executor/driver/edge-manager'
import type { DriverRuntime } from '@/executor/driver/runtime'
import {
  extractErrorMessage,
  sanitizeError,
  trackWorkflowTelemetry,
} from '@/executor/driver/runtime'
import type { LoopManager } from '@/executor/loops/loops'
import type { ParallelManager } from '@/executor/parallels/parallels'
import type {
  BlockLog,
  ExecutionContext,
  ExecutionResult,
  NormalizedBlockOutput,
  PauseMetadata,
  StreamingExecution,
} from '@/executor/types'
import { streamingResponseFormatProcessor } from '@/executor/utils'
import type { SerializedBlock, SerializedWorkflow } from '@/serializer/types'
import { useExecutionStore } from '@/stores/execution/store'

const logger = createLogger('ExecutionEngine')

/**
 * Drives a workflow to completion: builds the execution context, then repeatedly asks the
 * {@link EdgeManager} for the next ready layer, runs it via the {@link BlockRunner}, advances loops
 * and parallels, and stops at completion, cancellation, or a pause. Also handles debug single-step
 * ({@link continueExecution}) and resume-after-pause ({@link resumeFromPause}).
 */
export class ExecutionEngine {
  constructor(
    private workflow: SerializedWorkflow,
    private loopManager: LoopManager,
    private parallelManager: ParallelManager,
    private edgeManager: EdgeManager,
    private blockRunner: BlockRunner,
    private runtime: DriverRuntime
  ) {}

  /**
   * Detects a human-in-the-loop / async-wait pause in a just-executed layer's outputs.
   *
   * Returns a paused ExecutionResult carrying the serialized context (for the caller to persist and
   * later resume), or null if nothing paused. A pause inside an active loop or parallel, or more
   * than one pause in a layer, is not yet resumable, so it is returned as an error result — failing
   * safe rather than resuming wrong state.
   */
  private detectPause(outputs: any[], context: ExecutionContext): ExecutionResult | null {
    const paused = outputs.filter(
      (o) => o && typeof o === 'object' && o._pauseMetadata && o.status === 'waiting'
    )
    if (paused.length === 0) {
      return null
    }

    const startTime = context.metadata.startTime ?? new Date().toISOString()
    const baseMeta = {
      duration: Date.now() - new Date(startTime).getTime(),
      startTime,
      endTime: new Date().toISOString(),
    }

    if (paused.length > 1) {
      return {
        success: false,
        output: {},
        error: 'More than one block paused in the same step, which cannot be resumed yet',
        logs: context.blockLogs,
        metadata: baseMeta,
      }
    }

    const meta = paused[0]._pauseMetadata as PauseMetadata
    const unsupported = unsupportedPauseReason(context)
    if (unsupported) {
      return {
        success: false,
        output: {},
        error: unsupported,
        logs: context.blockLogs,
        metadata: baseMeta,
      }
    }

    logger.info('Execution paused', { blockId: meta.blockId, pauseKind: meta.pauseKind })

    return {
      success: false,
      output: {},
      logs: context.blockLogs,
      metadata: { ...baseMeta, paused: true } as any,
      paused: {
        contextId: meta.contextId ?? '',
        blockId: meta.blockId ?? paused[0].blockId ?? '',
        pauseKind: meta.pauseKind === 'time' ? 'time' : 'human-in-the-loop',
        resumeAt: (paused[0] as any).resumeAt ?? meta.resumeAt,
        snapshot: serializeContext(context),
      },
    }
  }

  /**
   * Consults the injected cross-instance cancellation probe, if one was supplied.
   *
   * Returns false (do not cancel) when no probe is set or the probe throws — a manual browser run
   * has no probe, and an infrastructure blip must not abort a healthy server-side run.
   */
  private async checkDistributedCancellation(): Promise<boolean> {
    if (!this.runtime.checkCancelled) {
      return false
    }
    try {
      return await this.runtime.checkCancelled()
    } catch (error) {
      logger.warn('Distributed cancellation check failed; continuing execution', { error })
      return false
    }
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
    const { setIsExecuting, setIsDebugging, setPendingBlocks, reset } = useExecutionStore.getState()
    const startTime = new Date()
    let finalOutput: NormalizedBlockOutput = {}

    // Track workflow execution start
    trackWorkflowTelemetry('workflow_execution_started', {
      workflowId,
      blockCount: this.workflow.blocks.length,
      connectionCount: this.workflow.connections.length,
      startTime: startTime.toISOString(),
    })

    this.validateWorkflow(startBlockId)

    const context = this.createExecutionContext(workflowId, startTime, startBlockId)

    // Notify listeners that execution has started
    try {
      await this.runtime.onExecutionStart?.(workflowId, this.runtime.contextExtensions.executionId)
    } catch (e) {
      logger.warn('onExecutionStart callback error:', e)
    }

    try {
      // Only manage global execution state for parent executions
      if (!this.runtime.isChildExecution) {
        setIsExecuting(true)

        if (this.runtime.isDebugging) {
          setIsDebugging(true)
        }
      }

      let hasMoreLayers = true
      let iteration = 0
      const maxIterations = 100 // Safety limit for infinite loops

      while (hasMoreLayers && iteration < maxIterations && !this.runtime.cancelled) {
        // Cross-instance cancellation: a run started by a webhook or schedule executes in the
        // worker, so a stop request issued elsewhere can only reach it through a shared signal.
        // Checked between layers; the in-process flag above still handles browser-side manual runs.
        if (await this.checkDistributedCancellation()) {
          this.runtime.cancelled = true
          break
        }

        const nextLayer = this.edgeManager.getNextExecutionLayer(context)

        if (this.runtime.isDebugging) {
          // In debug mode, update the pending blocks and wait for user interaction
          setPendingBlocks(nextLayer)

          // If there are no more blocks, we're done
          if (nextLayer.length === 0) {
            hasMoreLayers = false
          } else {
            // Return early to wait for manual stepping
            // The caller (useWorkflowExecution) will handle resumption
            return {
              success: true,
              output: finalOutput,
              metadata: {
                duration: Date.now() - startTime.getTime(),
                startTime: context.metadata.startTime!,
                pendingBlocks: nextLayer,
                isDebugSession: true,
                context: context, // Include context for resumption
                workflowConnections: this.workflow.connections.map((conn: any) => ({
                  source: conn.source,
                  target: conn.target,
                })),
              },
              logs: context.blockLogs,
            }
          }
        } else {
          // Normal execution without debug mode
          if (nextLayer.length === 0) {
            hasMoreLayers = false
          } else {
            const outputs = await this.blockRunner.executeLayer(nextLayer, context)

            // A human-in-the-loop or async-wait block halts the run: carry the state out and stop
            // rather than executing downstream blocks.
            const paused = this.detectPause(outputs, context)
            if (paused) {
              return paused
            }

            for (const output of outputs) {
              if (
                output &&
                typeof output === 'object' &&
                'stream' in output &&
                'execution' in output
              ) {
                if (context.onStream) {
                  const streamingExec = output as StreamingExecution
                  const [streamForClient, streamForExecutor] = streamingExec.stream.tee()

                  // Apply response format processing to the client stream if needed
                  const blockId = (streamingExec.execution as any).blockId

                  // Get response format from initial block states (passed from useWorkflowExecution)
                  // The initialBlockStates contain the subblock values including responseFormat
                  let responseFormat: any
                  if (this.runtime.initialBlockStates?.[blockId]) {
                    const blockState = this.runtime.initialBlockStates[blockId] as any
                    responseFormat = blockState.responseFormat
                  }

                  const processedClientStream = streamingResponseFormatProcessor.processStream(
                    streamForClient,
                    blockId,
                    context.selectedOutputIds || [],
                    responseFormat
                  )

                  const clientStreamingExec = { ...streamingExec, stream: processedClientStream }

                  try {
                    // Handle client stream with proper error handling
                    await context.onStream(clientStreamingExec)
                  } catch (streamError: any) {
                    logger.error('Error in onStream callback:', streamError)
                    // Continue execution even if stream callback fails
                  }

                  // Process executor stream with proper cleanup
                  const reader = streamForExecutor.getReader()
                  const decoder = new TextDecoder()
                  let fullContent = ''

                  try {
                    while (true) {
                      const { done, value } = await reader.read()
                      if (done) break
                      fullContent += decoder.decode(value, { stream: true })
                    }

                    const blockId = (streamingExec.execution as any).blockId
                    const blockState = context.blockStates.get(blockId)
                    if (blockState?.output) {
                      // Check if we have response format - if so, preserve structured response
                      let responseFormat: any
                      if (this.runtime.initialBlockStates?.[blockId]) {
                        const initialBlockState = this.runtime.initialBlockStates[blockId] as any
                        responseFormat = initialBlockState.responseFormat
                      }

                      if (responseFormat && fullContent) {
                        // For structured responses, always try to parse the raw streaming content
                        // The streamForExecutor contains the raw JSON response, not the processed display text
                        try {
                          const parsedContent = JSON.parse(fullContent)
                          // Preserve metadata but spread parsed fields at root level (same as manual execution)
                          const structuredOutput = {
                            ...parsedContent,
                            tokens: blockState.output.tokens,
                            toolCalls: blockState.output.toolCalls,
                            providerTiming: blockState.output.providerTiming,
                            cost: blockState.output.cost,
                          }
                          blockState.output = structuredOutput

                          // Also update the corresponding block log with the structured output
                          const blockLog = context.blockLogs.find((log) => log.blockId === blockId)
                          if (blockLog) {
                            blockLog.output = structuredOutput
                          }
                        } catch (parseError) {
                          // If parsing fails, fall back to setting content
                          blockState.output.content = fullContent
                        }
                      } else {
                        // No response format, use standard content setting
                        blockState.output.content = fullContent
                      }
                    }
                  } catch (readerError: any) {
                    logger.error('Error reading stream for executor:', readerError)
                    // Set partial content if available
                    const blockId = (streamingExec.execution as any).blockId
                    const blockState = context.blockStates.get(blockId)
                    if (blockState?.output && fullContent) {
                      // Check if we have response format for error handling too
                      let responseFormat: any
                      if (this.runtime.initialBlockStates?.[blockId]) {
                        const initialBlockState = this.runtime.initialBlockStates[blockId] as any
                        responseFormat = initialBlockState.responseFormat
                      }

                      if (responseFormat) {
                        // For structured responses, always try to parse the raw streaming content
                        // The streamForExecutor contains the raw JSON response, not the processed display text
                        try {
                          const parsedContent = JSON.parse(fullContent)
                          const structuredOutput = {
                            ...parsedContent,
                            tokens: blockState.output.tokens,
                            toolCalls: blockState.output.toolCalls,
                            providerTiming: blockState.output.providerTiming,
                            cost: blockState.output.cost,
                          }
                          blockState.output = structuredOutput

                          // Also update the corresponding block log with the structured output
                          const blockLog = context.blockLogs.find((log) => log.blockId === blockId)
                          if (blockLog) {
                            blockLog.output = structuredOutput
                          }
                        } catch (parseError) {
                          // If parsing fails, fall back to setting content
                          blockState.output.content = fullContent
                        }
                      } else {
                        // No response format, use standard content setting
                        blockState.output.content = fullContent
                      }
                    }
                  } finally {
                    try {
                      reader.releaseLock()
                    } catch (releaseError: any) {
                      // Reader might already be released
                      logger.debug('Reader already released:', releaseError)
                    }
                  }
                }
              }
            }

            const normalizedOutputs = outputs
              .filter(
                (output) =>
                  !(
                    typeof output === 'object' &&
                    output !== null &&
                    'stream' in output &&
                    'execution' in output
                  )
              )
              .map((output) => output as NormalizedBlockOutput)

            if (normalizedOutputs.length > 0) {
              finalOutput = normalizedOutputs[normalizedOutputs.length - 1]
            }
            // Process loop iterations - this will activate external paths when loops complete
            await this.loopManager.processLoopIterations(context)

            // Process parallel iterations - similar to loops but conceptually for parallel execution
            await this.parallelManager.processParallelIterations(context)

            // Continue execution for any newly activated paths
            // Only stop execution if there are no more blocks to execute
            const updatedNextLayer = this.edgeManager.getNextExecutionLayer(context)
            if (updatedNextLayer.length === 0) {
              hasMoreLayers = false
            }
          }
        }

        iteration++
      }

      // Handle cancellation
      if (this.runtime.cancelled) {
        trackWorkflowTelemetry('workflow_execution_cancelled', {
          workflowId,
          duration: Date.now() - startTime.getTime(),
          blockCount: this.workflow.blocks.length,
          executedBlockCount: context.executedBlocks.size,
          startTime: startTime.toISOString(),
        })

        return {
          success: false,
          output: finalOutput,
          error: 'Workflow execution was cancelled',
          logs: context.blockLogs,
        }
      }

      const endTime = new Date()
      context.metadata.endTime = endTime.toISOString()
      const duration = endTime.getTime() - startTime.getTime()

      trackWorkflowTelemetry('workflow_execution_completed', {
        workflowId,
        duration,
        blockCount: this.workflow.blocks.length,
        executedBlockCount: context.executedBlocks.size,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        success: true,
      })

      const successResult: ExecutionResult = {
        success: true,
        output: finalOutput,
        metadata: {
          duration: duration,
          startTime: context.metadata.startTime!,
          endTime: context.metadata.endTime!,
          workflowConnections: this.workflow.connections.map((conn: any) => ({
            source: conn.source,
            target: conn.target,
          })),
        },
        logs: context.blockLogs,
      }

      // Notify listeners that execution has completed
      try {
        await this.runtime.onExecutionComplete?.(successResult)
      } catch (e) {
        logger.warn('onExecutionComplete callback error:', e)
      }

      return successResult
    } catch (error: any) {
      logger.error('Workflow execution failed:', sanitizeError(error))

      // Track workflow execution failure
      trackWorkflowTelemetry('workflow_execution_failed', {
        workflowId,
        duration: Date.now() - startTime.getTime(),
        error: extractErrorMessage(error),
        executedBlockCount: context.executedBlocks.size,
        blockLogs: context.blockLogs.length,
      })

      const errorResult: ExecutionResult = {
        success: false,
        output: finalOutput,
        error: extractErrorMessage(error),
        logs: context.blockLogs,
      }

      // Notify listeners that execution has completed (with error)
      try {
        await this.runtime.onExecutionComplete?.(errorResult)
      } catch (e) {
        logger.warn('onExecutionComplete callback error:', e)
      }

      return errorResult
    } finally {
      // Only reset global state for parent executions
      if (!this.runtime.isChildExecution && !this.runtime.isDebugging) {
        reset()
      }
    }
  }

  /**
   * Continues execution in debug mode from the current state.
   *
   * @param blockIds - Block IDs to execute in this step
   * @param context - The current execution context
   * @returns Updated execution result
   */
  async continueExecution(blockIds: string[], context: ExecutionContext): Promise<ExecutionResult> {
    const { setPendingBlocks } = useExecutionStore.getState()
    let finalOutput: NormalizedBlockOutput = {}

    // Check for cancellation
    if (this.runtime.cancelled) {
      return {
        success: false,
        output: finalOutput,
        error: 'Workflow execution was cancelled',
        logs: context.blockLogs,
      }
    }

    try {
      // Execute the current layer - using the original context, not a clone
      const outputs = await this.blockRunner.executeLayer(blockIds, context)

      if (outputs.length > 0) {
        const nonStreamingOutputs = outputs.filter(
          (o) => !(o && typeof o === 'object' && 'stream' in o)
        ) as NormalizedBlockOutput[]
        if (nonStreamingOutputs.length > 0) {
          finalOutput = nonStreamingOutputs[nonStreamingOutputs.length - 1]
        }
      }
      await this.loopManager.processLoopIterations(context)
      await this.parallelManager.processParallelIterations(context)
      const nextLayer = this.edgeManager.getNextExecutionLayer(context)
      setPendingBlocks(nextLayer)

      // Check if we've completed execution
      const isComplete = nextLayer.length === 0

      if (isComplete) {
        const endTime = new Date()
        context.metadata.endTime = endTime.toISOString()

        return {
          success: true,
          output: finalOutput,
          metadata: {
            duration: endTime.getTime() - new Date(context.metadata.startTime!).getTime(),
            startTime: context.metadata.startTime!,
            endTime: context.metadata.endTime!,
            pendingBlocks: [],
            isDebugSession: false,
            workflowConnections: this.workflow.connections.map((conn) => ({
              source: conn.source,
              target: conn.target,
            })),
          },
          logs: context.blockLogs,
        }
      }

      // Return the updated state for the next step
      return {
        success: true,
        output: finalOutput,
        metadata: {
          duration: Date.now() - new Date(context.metadata.startTime!).getTime(),
          startTime: context.metadata.startTime!,
          pendingBlocks: nextLayer,
          isDebugSession: true,
          context: context, // Return the same context object for continuity
        },
        logs: context.blockLogs,
      }
    } catch (error: any) {
      logger.error('Debug step execution failed:', sanitizeError(error))

      return {
        success: false,
        output: finalOutput,
        error: extractErrorMessage(error),
        logs: context.blockLogs,
      }
    }
  }

  /**
   * Resumes a run that halted at a human-in-the-loop or async-wait block.
   *
   * The paused block's stored output was `{ status: 'waiting' }`; here it is overwritten with the
   * resolution (the human decision, or a completed wait) so downstream blocks read the real value.
   * Then the run continues to completion — or to the next pause, which is detected and returned the
   * same way, so a workflow with two approval gates pauses at each rather than blowing through the
   * second.
   */
  async resumeFromPause(
    context: ExecutionContext,
    blockId: string,
    resolution: Record<string, any>
  ): Promise<ExecutionResult> {
    const resumedOutput = { status: 'completed', ...resolution }

    const blockState = context.blockStates.get(blockId)
    if (blockState) {
      blockState.output = resumedOutput as any
    } else {
      context.blockStates.set(blockId, { output: resumedOutput, executed: true } as any)
    }
    const blockLog = context.blockLogs.find((log) => log.blockId === blockId)
    if (blockLog) {
      blockLog.output = resumedOutput as any
    }

    logger.info('Resuming paused execution', { blockId })

    let finalOutput: NormalizedBlockOutput = resumedOutput as any
    let iteration = 0
    const maxIterations = 100

    while (iteration < maxIterations) {
      iteration++

      if (await this.checkDistributedCancellation()) {
        this.runtime.cancelled = true
      }
      if (this.runtime.cancelled) {
        return {
          success: false,
          output: finalOutput,
          error: 'Workflow execution was cancelled',
          logs: context.blockLogs,
        }
      }

      const nextLayer = this.edgeManager.getNextExecutionLayer(context)
      if (nextLayer.length === 0) {
        break
      }

      const outputs = await this.blockRunner.executeLayer(nextLayer, context)

      const paused = this.detectPause(outputs, context)
      if (paused) {
        return paused
      }

      const normalized = outputs.filter(
        (o) => !(o && typeof o === 'object' && 'stream' in o)
      ) as NormalizedBlockOutput[]
      if (normalized.length > 0) {
        finalOutput = normalized[normalized.length - 1]
      }

      await this.loopManager.processLoopIterations(context)
      await this.parallelManager.processParallelIterations(context)
    }

    const startTime = context.metadata.startTime ?? new Date().toISOString()
    context.metadata.endTime = new Date().toISOString()

    return {
      success: true,
      output: finalOutput,
      logs: context.blockLogs,
      metadata: {
        duration: Date.now() - new Date(startTime).getTime(),
        startTime,
        endTime: context.metadata.endTime,
      },
    }
  }

  /**
   * Validates that the workflow meets requirements for execution.
   * Checks for starter block, webhook trigger block, or schedule trigger block, connections, and loop configurations.
   *
   * @param startBlockId - Optional specific block to start from
   * @throws Error if workflow validation fails
   */
  validateWorkflow(startBlockId?: string): void {
    let validationBlock: SerializedBlock | undefined

    if (startBlockId) {
      // If starting from a specific block (webhook trigger or schedule trigger), validate that block exists
      const startBlock = this.workflow.blocks.find((block) => block.id === startBlockId)
      if (!startBlock || !startBlock.enabled) {
        throw new Error(`Start block ${startBlockId} not found or disabled`)
      }
      validationBlock = startBlock
      // Trigger blocks (webhook and schedule) can have incoming connections, so no need to check that
    } else {
      // Default validation for starter block
      const starterBlock = this.workflow.blocks.find(
        (block) => block.metadata?.id === BlockType.STARTER
      )
      if (!starterBlock || !starterBlock.enabled) {
        throw new Error('Workflow must have an enabled starter block')
      }
      validationBlock = starterBlock

      const incomingToStarter = this.workflow.connections.filter(
        (conn) => conn.target === starterBlock.id
      )
      if (incomingToStarter.length > 0) {
        throw new Error('Starter block cannot have incoming connections')
      }

      // Check if there are any trigger blocks on the canvas
      const hasTriggerBlocks = this.workflow.blocks.some((block) => {
        return block.metadata?.category === 'triggers' || block.config?.params?.triggerMode === true
      })

      // Only check outgoing connections for starter blocks if there are no trigger blocks
      if (!hasTriggerBlocks) {
        const outgoingFromStarter = this.workflow.connections.filter(
          (conn) => conn.source === starterBlock.id
        )
        if (outgoingFromStarter.length === 0) {
          throw new Error('Starter block must have at least one outgoing connection')
        }
      }
    }

    const blockIds = new Set(this.workflow.blocks.map((block) => block.id))
    for (const conn of this.workflow.connections) {
      if (!blockIds.has(conn.source)) {
        throw new Error(`Connection references non-existent source block: ${conn.source}`)
      }
      if (!blockIds.has(conn.target)) {
        throw new Error(`Connection references non-existent target block: ${conn.target}`)
      }
    }

    for (const [loopId, loop] of Object.entries(this.workflow.loops || {})) {
      for (const nodeId of loop.nodes) {
        if (!blockIds.has(nodeId)) {
          throw new Error(`Loop ${loopId} references non-existent block: ${nodeId}`)
        }
      }

      if (Number(loop.iterations) <= 0) {
        throw new Error(`Loop ${loopId} must have a positive iterations value`)
      }

      if (loop.loopType === 'forEach') {
        if (
          !loop.forEachItems ||
          (typeof loop.forEachItems === 'string' && loop.forEachItems.trim() === '')
        ) {
          throw new Error(`forEach loop ${loopId} requires a collection to iterate over`)
        }
      }
    }
  }

  /**
   * Creates the initial execution context with predefined states.
   * Sets up the starter block, webhook trigger block, or schedule trigger block and its connections in the active execution path.
   *
   * @param workflowId - Unique identifier for the workflow execution
   * @param startTime - Execution start time
   * @param startBlockId - Optional specific block to start from
   * @returns Initialized execution context
   */
  private createExecutionContext(
    workflowId: string,
    startTime: Date,
    startBlockId?: string
  ): ExecutionContext {
    const context: ExecutionContext = {
      workflowId,
      workspaceId: this.runtime.contextExtensions.workspaceId,
      executionId: this.runtime.contextExtensions.executionId,
      userId: this.runtime.contextExtensions.userId,
      blockStates: new Map(),
      blockLogs: [],
      metadata: {
        startTime: startTime.toISOString(),
        duration: 0, // Initialize with zero, will be updated throughout execution
      },
      environmentVariables: this.runtime.environmentVariables,
      decisions: {
        router: new Map(),
        condition: new Map(),
      },
      loopIterations: new Map(),
      loopItems: new Map(),
      completedLoops: new Set(),
      executedBlocks: new Set(),
      activeExecutionPath: new Set(),
      workflow: this.workflow,
      // Add streaming context from contextExtensions
      stream: this.runtime.contextExtensions.stream || false,
      selectedOutputIds: this.runtime.contextExtensions.selectedOutputIds || [],
      edges: this.runtime.contextExtensions.edges || [],
      onStream: this.runtime.contextExtensions.onStream,
    }

    Object.entries(this.runtime.initialBlockStates).forEach(([blockId, output]) => {
      context.blockStates.set(blockId, {
        output: output as NormalizedBlockOutput,
        executed: true,
        executionTime: 0,
      })
    })

    // Initialize loop iterations
    if (this.workflow.loops) {
      for (const loopId of Object.keys(this.workflow.loops)) {
        // Start all loops at iteration 0
        context.loopIterations.set(loopId, 0)
      }
    }

    // Determine which block to initialize as the starting point
    let initBlock: SerializedBlock | undefined
    if (startBlockId) {
      // Starting from a specific block (webhook trigger or schedule trigger)
      initBlock = this.workflow.blocks.find((block) => block.id === startBlockId)
    } else {
      // Default to starter block
      initBlock = this.workflow.blocks.find((block) => block.metadata?.id === BlockType.STARTER)
    }

    if (initBlock) {
      // Initialize the starting block with the workflow input
      try {
        const blockParams = initBlock.config.params
        const inputFormat = blockParams?.inputFormat

        // If input format is defined, structure the input according to the schema
        if (inputFormat && Array.isArray(inputFormat) && inputFormat.length > 0) {
          // Create structured input based on input format
          const structuredInput: Record<string, any> = {}

          // Process each field in the input format
          for (const field of inputFormat) {
            if (field.name && field.type) {
              // Get the field value from workflow input if available
              let inputValue: any

              // First try to access via input.field if workflowInput.input is an object
              if (
                this.runtime.workflowInput?.input &&
                typeof this.runtime.workflowInput.input === 'object' &&
                !Array.isArray(this.runtime.workflowInput.input) &&
                this.runtime.workflowInput.input[field.name] !== undefined
              ) {
                inputValue = this.runtime.workflowInput.input[field.name]
              }
              // Then try direct field access
              else if (this.runtime.workflowInput?.[field.name] !== undefined) {
                inputValue = this.runtime.workflowInput[field.name]
              }
              // Special case: if workflowInput.input is a primitive (string/number/boolean)
              // and this is the first/primary field, use the input value directly
              else if (
                this.runtime.workflowInput?.input !== undefined &&
                typeof this.runtime.workflowInput.input !== 'object' &&
                inputFormat.length === 1
              ) {
                inputValue = this.runtime.workflowInput.input
              }

              logger.info(
                `[Executor] Processing input field ${field.name} (${field.type}):`,
                inputValue !== undefined ? JSON.stringify(inputValue) : 'undefined'
              )

              // Convert the value to the appropriate type
              let typedValue = inputValue
              if (inputValue !== undefined) {
                if (field.type === 'number' && typeof inputValue !== 'number') {
                  typedValue = Number(inputValue)
                } else if (field.type === 'boolean' && typeof inputValue !== 'boolean') {
                  typedValue = inputValue === 'true' || inputValue === true
                } else if (
                  (field.type === 'object' || field.type === 'array') &&
                  typeof inputValue === 'string'
                ) {
                  try {
                    typedValue = JSON.parse(inputValue)
                  } catch (e) {
                    logger.warn(`Failed to parse ${field.type} input for field ${field.name}:`, e)
                  }
                }
              }

              // Add the field to structured input
              structuredInput[field.name] = typedValue
            }
          }

          // Check if we managed to process any fields - if not, use the raw input
          const hasProcessedFields = Object.keys(structuredInput).length > 0

          // If no fields matched the input format, extract the raw input to use instead
          const rawInputData =
            this.runtime.workflowInput?.input !== undefined
              ? this.runtime.workflowInput.input // Use the input value
              : this.runtime.workflowInput // Fallback to direct input

          // Use the structured input if we processed fields, otherwise use raw input
          const finalInput = hasProcessedFields ? structuredInput : rawInputData

          // Initialize the starting block with structured input (flattened)
          const blockOutput = {
            input: finalInput,
            conversationId: this.runtime.workflowInput?.conversationId, // Add conversationId to root
            ...finalInput, // Add input fields directly at top level
          }

          // Add files if present (for all trigger types)
          if (
            this.runtime.workflowInput?.files &&
            Array.isArray(this.runtime.workflowInput.files)
          ) {
            blockOutput.files = this.runtime.workflowInput.files
          }

          logger.info(`[Executor] Starting block output:`, JSON.stringify(blockOutput, null, 2))

          context.blockStates.set(initBlock.id, {
            output: blockOutput,
            executed: true,
            executionTime: 0,
          })

          // Create a block log for the starter block if it has files
          // This ensures files are captured in trace spans and execution logs
          this.createStartedBlockWithFilesLog(initBlock, blockOutput, context)
        } else {
          // Handle structured input (like API calls or chat messages)
          if (this.runtime.workflowInput && typeof this.runtime.workflowInput === 'object') {
            // Check if this is a chat workflow input (has both input and conversationId)
            if (
              Object.hasOwn(this.runtime.workflowInput, 'input') &&
              Object.hasOwn(this.runtime.workflowInput, 'conversationId')
            ) {
              // Chat workflow: extract input, conversationId, and files to root level
              const starterOutput: any = {
                input: this.runtime.workflowInput.input,
                conversationId: this.runtime.workflowInput.conversationId,
              }

              // Add files if present
              if (
                this.runtime.workflowInput.files &&
                Array.isArray(this.runtime.workflowInput.files)
              ) {
                starterOutput.files = this.runtime.workflowInput.files
              }

              context.blockStates.set(initBlock.id, {
                output: starterOutput,
                executed: true,
                executionTime: 0,
              })

              // Create a block log for the starter block if it has files
              // This ensures files are captured in trace spans and execution logs
              this.createStartedBlockWithFilesLog(initBlock, starterOutput, context)
            } else {
              // API workflow: spread the raw data directly (no wrapping)
              // Ensure `input` key always exists so {{start.input}} references don't fail
              const starterOutput = { ...this.runtime.workflowInput }
              if (!Object.hasOwn(starterOutput, 'input')) {
                starterOutput.input = ''
              }

              context.blockStates.set(initBlock.id, {
                output: starterOutput,
                executed: true,
                executionTime: 0,
              })
            }
          } else {
            // Fallback for primitive input values
            const starterOutput = {
              input: this.runtime.workflowInput,
            }

            context.blockStates.set(initBlock.id, {
              output: starterOutput,
              executed: true,
              executionTime: 0,
            })
          }
        }
      } catch (e) {
        logger.warn('Error processing starter block input format:', e)

        // Error handler fallback - use appropriate structure
        let blockOutput: any
        if (this.runtime.workflowInput && typeof this.runtime.workflowInput === 'object') {
          // Check if this is a chat workflow input (has both input and conversationId)
          if (
            Object.hasOwn(this.runtime.workflowInput, 'input') &&
            Object.hasOwn(this.runtime.workflowInput, 'conversationId')
          ) {
            // Chat workflow: extract input, conversationId, and files to root level
            blockOutput = {
              input: this.runtime.workflowInput.input,
              conversationId: this.runtime.workflowInput.conversationId,
            }

            // Add files if present
            if (
              this.runtime.workflowInput.files &&
              Array.isArray(this.runtime.workflowInput.files)
            ) {
              blockOutput.files = this.runtime.workflowInput.files
            }
          } else {
            // API workflow: spread the raw data directly (no wrapping)
            // Ensure `input` key always exists so {{start.input}} references don't fail
            blockOutput = { ...this.runtime.workflowInput }
            if (!Object.hasOwn(blockOutput, 'input')) {
              blockOutput.input = ''
            }
          }
        } else {
          // Primitive input
          blockOutput = {
            input: this.runtime.workflowInput,
          }
        }

        logger.info(
          '[Executor] Fallback starting block output:',
          JSON.stringify(blockOutput, null, 2)
        )

        context.blockStates.set(initBlock.id, {
          output: blockOutput,
          executed: true,
          executionTime: 0,
        })
        this.createStartedBlockWithFilesLog(initBlock, blockOutput, context)
      }
      // Ensure the starting block is in the active execution path
      context.activeExecutionPath.add(initBlock.id)
      // Mark the starting block as executed
      context.executedBlocks.add(initBlock.id)

      // Add all blocks connected to the starting block to the active execution path
      const connectedToStartBlock = this.workflow.connections
        .filter((conn) => conn.source === initBlock.id)
        .map((conn) => conn.target)

      connectedToStartBlock.forEach((blockId) => {
        context.activeExecutionPath.add(blockId)
      })
    }

    return context
  }

  /**
   * Creates a block log for the starter block if it contains files.
   * This ensures files are captured in trace spans and execution logs.
   */
  private createStartedBlockWithFilesLog(
    initBlock: SerializedBlock,
    blockOutput: any,
    context: ExecutionContext
  ): void {
    if (blockOutput.files && Array.isArray(blockOutput.files) && blockOutput.files.length > 0) {
      const starterBlockLog: BlockLog = {
        blockId: initBlock.id,
        blockName: initBlock.metadata?.name || 'Start',
        blockType: initBlock.metadata?.id || 'start',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        success: true,
        input: this.runtime.workflowInput,
        output: blockOutput,
        durationMs: 0,
      }
      context.blockLogs.push(starterBlockLog)
    }
  }
}
