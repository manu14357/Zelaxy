import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { EdgeManager } from '@/executor/driver/edge-manager'
import type { DriverRuntime } from '@/executor/driver/runtime'
import {
  extractErrorMessage,
  sanitizeError,
  trackWorkflowTelemetry,
} from '@/executor/driver/runtime'
import type { ParallelManager } from '@/executor/parallels/parallels'
import type { InputResolver } from '@/executor/resolver/resolver'
import type {
  BlockHandler,
  BlockLog,
  ExecutionContext,
  NormalizedBlockOutput,
  StreamingExecution,
} from '@/executor/types'
import type { SerializedBlock, SerializedWorkflow } from '@/serializer/types'
import { useExecutionStore } from '@/stores/execution/store'
import { useConsoleStore } from '@/stores/panel/console/store'

const logger = createLogger('BlockRunner')

/**
 * Runs blocks: a whole ready layer in parallel, and each individual block with input resolution,
 * handler dispatch, logging, streaming-result capture, and error-path handling.
 */
export class BlockRunner {
  constructor(
    private workflow: SerializedWorkflow,
    private resolver: InputResolver,
    private blockHandlers: BlockHandler[],
    private parallelManager: ParallelManager,
    private edgeManager: EdgeManager,
    private runtime: DriverRuntime
  ) {}

  /**
   * Executes a layer of blocks in parallel.
   * Updates execution paths based on router and condition decisions.
   */
  async executeLayer(
    blockIds: string[],
    context: ExecutionContext
  ): Promise<(NormalizedBlockOutput | StreamingExecution)[]> {
    const { setActiveBlocks } = useExecutionStore.getState()

    try {
      // Set all blocks in this layer as active
      const activeBlockIds = new Set(blockIds)

      // For virtual block IDs (parallel execution), also add the actual block ID so it appears as executing as well in the UI
      blockIds.forEach((blockId) => {
        if (context.parallelBlockMapping?.has(blockId)) {
          const parallelInfo = context.parallelBlockMapping.get(blockId)
          if (parallelInfo) {
            activeBlockIds.add(parallelInfo.originalBlockId)
          }
        }
      })

      // Only manage active blocks for parent executions
      if (!this.runtime.isChildExecution) {
        setActiveBlocks(activeBlockIds)
      }

      const settledResults = await Promise.allSettled(
        blockIds.map((blockId) => this.executeBlock(blockId, context))
      )

      // Extract successful results and collect any errors
      const results: (NormalizedBlockOutput | StreamingExecution)[] = []
      const errors: Error[] = []

      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          errors.push(result.reason)
          // For failed blocks, we still need to add a placeholder result
          // so the results array matches the blockIds array length
          results.push({
            error: result.reason?.message || 'Block execution failed',
            status: 500,
          })
        }
      })

      // If there were any errors, log them but don't throw immediately
      // This allows successful blocks to complete their streaming
      if (errors.length > 0) {
        logger.warn(
          `Layer execution completed with ${errors.length} failed blocks out of ${blockIds.length} total`
        )

        // Only throw if ALL blocks failed
        if (errors.length === blockIds.length) {
          throw errors[0] // Throw the first error if all blocks failed
        }
      }

      blockIds.forEach((blockId) => {
        context.executedBlocks.add(blockId)
      })

      this.edgeManager.updateExecutionPaths(blockIds, context)

      return results
    } catch (error) {
      // If there's an uncaught error, clear all active blocks as a safety measure
      // Only manage active blocks for parent executions
      if (!this.runtime.isChildExecution) {
        setActiveBlocks(new Set())
      }
      throw error
    }
  }

  /**
   * Executes a single block with error handling and logging.
   * Handles virtual block IDs for parallel iterations.
   */
  async executeBlock(
    blockId: string,
    context: ExecutionContext
  ): Promise<NormalizedBlockOutput | StreamingExecution> {
    // Check if this is a virtual block ID for parallel execution
    let actualBlockId = blockId
    let parallelInfo:
      | { originalBlockId: string; parallelId: string; iterationIndex: number }
      | undefined

    if (context.parallelBlockMapping?.has(blockId)) {
      parallelInfo = context.parallelBlockMapping.get(blockId)
      actualBlockId = parallelInfo!.originalBlockId

      // Set the current virtual block ID in context so resolver can access it
      context.currentVirtualBlockId = blockId

      // Set up iteration-specific context BEFORE resolving inputs
      if (parallelInfo) {
        this.parallelManager.setupIterationContext(context, parallelInfo)
      }
    } else {
      // Clear currentVirtualBlockId for non-virtual blocks
      context.currentVirtualBlockId = undefined
    }

    const block = this.workflow.blocks.find((b) => b.id === actualBlockId)
    if (!block) {
      throw new Error(`Block ${actualBlockId} not found`)
    }

    // Special case for starter block - it's already been initialized in createExecutionContext
    // This ensures we don't re-execute the starter block and just return its existing state
    if (block.metadata?.id === BlockType.STARTER) {
      const starterState = context.blockStates.get(actualBlockId)
      if (starterState) {
        return starterState.output as NormalizedBlockOutput
      }
    }

    const blockLog = this.createBlockLog(block)
    // Use virtual block ID in logs if applicable
    if (parallelInfo) {
      blockLog.blockId = blockId
      blockLog.blockName = `${block.metadata?.name || ''} (iteration ${parallelInfo.iterationIndex + 1})`
    }

    const addConsole = useConsoleStore.getState().addConsole

    try {
      if (block.enabled === false) {
        throw new Error(`Cannot execute disabled block: ${block.metadata?.name || block.id}`)
      }

      // Check if this block needs the starter block's output
      // This is especially relevant for API, function, and conditions that might reference {{start.input}}
      const starterBlock = this.workflow.blocks.find((b) => b.metadata?.id === BlockType.STARTER)
      if (starterBlock) {
        const starterState = context.blockStates.get(starterBlock.id)
        if (!starterState) {
          logger.warn(
            `Starter block state not found when executing ${block.metadata?.name || actualBlockId}. This may cause reference errors.`
          )
        }
      }

      // Store raw input configuration first for error debugging
      blockLog.input = block.config.params

      // Resolve inputs (which will look up references to other blocks including starter)
      const inputs = this.resolver.resolveInputs(block, context)

      // Store input data in the block log
      blockLog.input = inputs

      // Track block execution start
      trackWorkflowTelemetry('block_execution_start', {
        workflowId: context.workflowId,
        blockId: block.id,
        virtualBlockId: parallelInfo ? blockId : undefined,
        iterationIndex: parallelInfo?.iterationIndex,
        blockType: block.metadata?.id || 'unknown',
        blockName: block.metadata?.name || 'Unnamed Block',
        inputSize: Object.keys(inputs).length,
        startTime: new Date().toISOString(),
      })

      // Find the appropriate handler
      const handler = this.blockHandlers.find((h) => h.canHandle(block))
      if (!handler) {
        throw new Error(`No handler found for block type: ${block.metadata?.id}`)
      }

      // Execute the block
      const startTime = performance.now()
      const rawOutput = await handler.execute(block, inputs, context)
      const executionTime = performance.now() - startTime

      // Update blockLog.input with enriched input from the handler if available.
      // This captures the actual input sent to the provider (e.g., userPrompt with
      // file content appended) so traces/logs show the complete picture.
      const enrichedInput = context.enrichedBlockInputs?.get(block.id)
      if (enrichedInput) {
        blockLog.input = enrichedInput
        // Clean up after use
        context.enrichedBlockInputs?.delete(block.id)
      }

      // Remove this block from active blocks immediately after execution
      // This ensures the pulse effect stops as soon as the block completes
      // Only manage active blocks for parent executions
      if (!this.runtime.isChildExecution) {
        useExecutionStore.setState((state) => {
          const updatedActiveBlockIds = new Set(state.activeBlockIds)
          updatedActiveBlockIds.delete(blockId)

          // For virtual blocks, also check if we should remove the actual block ID
          if (parallelInfo) {
            // Check if there are any other virtual blocks for the same actual block still active
            const hasOtherVirtualBlocks = Array.from(state.activeBlockIds).some((activeId) => {
              if (activeId === blockId) return false // Skip the current block we're removing
              const mapping = context.parallelBlockMapping?.get(activeId)
              return mapping && mapping.originalBlockId === parallelInfo.originalBlockId
            })

            // If no other virtual blocks are active for this actual block, remove the actual block ID too
            if (!hasOtherVirtualBlocks) {
              updatedActiveBlockIds.delete(parallelInfo.originalBlockId)
            }
          }

          return { activeBlockIds: updatedActiveBlockIds }
        })
      }

      if (
        rawOutput &&
        typeof rawOutput === 'object' &&
        'stream' in rawOutput &&
        'execution' in rawOutput
      ) {
        const streamingExec = rawOutput as StreamingExecution
        const output = (streamingExec.execution as any).output as NormalizedBlockOutput

        context.blockStates.set(blockId, {
          output,
          executed: true,
          executionTime,
        })

        // Also store under the actual block ID for reference
        if (parallelInfo) {
          // Store iteration result in parallel state
          this.parallelManager.storeIterationResult(
            context,
            parallelInfo.parallelId,
            parallelInfo.iterationIndex,
            output
          )
        }

        // Update the execution log
        blockLog.success = true
        blockLog.output = output
        blockLog.durationMs = Math.round(executionTime)
        blockLog.endedAt = new Date().toISOString()

        context.blockLogs.push(blockLog)

        // Notify listeners of block completion for real-time log streaming
        try {
          await this.runtime.onBlockComplete?.(blockLog)
        } catch (e) {
          logger.warn('onBlockComplete callback error:', e)
        }

        // Skip console logging for infrastructure blocks like loops and parallels
        // For streaming blocks, we'll add the console entry after stream processing
        if (block.metadata?.id !== BlockType.LOOP && block.metadata?.id !== BlockType.PARALLEL) {
          // Determine iteration context for this block
          let iterationCurrent: number | undefined
          let iterationTotal: number | undefined
          let iterationType: 'loop' | 'parallel' | undefined
          const blockName = block.metadata?.name || 'Unnamed Block'

          if (parallelInfo) {
            // This is a parallel iteration
            const parallelState = context.parallelExecutions?.get(parallelInfo.parallelId)
            iterationCurrent = parallelInfo.iterationIndex + 1
            iterationTotal = parallelState?.parallelCount
            iterationType = 'parallel'
          } else {
            // Check if this block is inside a loop
            const containingLoopId = this.resolver.getContainingLoopId(block.id)
            if (containingLoopId) {
              const currentIteration = context.loopIterations.get(containingLoopId)
              const loop = context.workflow?.loops?.[containingLoopId]
              if (currentIteration !== undefined && loop) {
                iterationCurrent = currentIteration
                if (loop.loopType === 'forEach') {
                  // For forEach loops, get the total from the items
                  const forEachItems = context.loopItems.get(`${containingLoopId}_items`)
                  if (forEachItems) {
                    iterationTotal = Array.isArray(forEachItems)
                      ? forEachItems.length
                      : Object.keys(forEachItems).length
                  }
                } else {
                  // For regular loops, use the iterations count
                  iterationTotal = Number(loop.iterations) || 5
                }
                iterationType = 'loop'
              }
            }
          }

          addConsole({
            input: blockLog.input,
            output: blockLog.output,
            success: true,
            durationMs: blockLog.durationMs,
            startedAt: blockLog.startedAt,
            endedAt: blockLog.endedAt,
            workflowId: context.workflowId,
            blockId: parallelInfo ? blockId : block.id,
            executionId: this.runtime.contextExtensions.executionId,
            blockName,
            blockType: block.metadata?.id || 'unknown',
            iterationCurrent,
            iterationTotal,
            iterationType,
          })
        }

        trackWorkflowTelemetry('block_execution', {
          workflowId: context.workflowId,
          blockId: block.id,
          virtualBlockId: parallelInfo ? blockId : undefined,
          iterationIndex: parallelInfo?.iterationIndex,
          blockType: block.metadata?.id || 'unknown',
          blockName: block.metadata?.name || 'Unnamed Block',
          durationMs: Math.round(executionTime),
          success: true,
        })

        return streamingExec
      }

      // Handle error outputs and ensure object structure
      const output: NormalizedBlockOutput =
        rawOutput && typeof rawOutput === 'object' && rawOutput.error
          ? { error: rawOutput.error, status: rawOutput.status || 500 }
          : typeof rawOutput === 'object' && rawOutput !== null
            ? rawOutput
            : { result: rawOutput }

      // Update the context with the execution result
      // Use virtual block ID for parallel executions
      context.blockStates.set(blockId, {
        output,
        executed: true,
        executionTime,
      })

      // Also store under the actual block ID for reference
      if (parallelInfo) {
        // Store iteration result in parallel state
        this.parallelManager.storeIterationResult(
          context,
          parallelInfo.parallelId,
          parallelInfo.iterationIndex,
          output
        )
      }

      // Update the execution log
      blockLog.success = true
      blockLog.output = output
      blockLog.durationMs = Math.round(executionTime)
      blockLog.endedAt = new Date().toISOString()

      context.blockLogs.push(blockLog)

      // Notify listeners of block completion for real-time log streaming
      try {
        await this.runtime.onBlockComplete?.(blockLog)
      } catch (e) {
        logger.warn('onBlockComplete callback error:', e)
      }

      // Skip console logging for infrastructure blocks like loops and parallels
      if (block.metadata?.id !== BlockType.LOOP && block.metadata?.id !== BlockType.PARALLEL) {
        // Determine iteration context for this block
        let iterationCurrent: number | undefined
        let iterationTotal: number | undefined
        let iterationType: 'loop' | 'parallel' | undefined
        const blockName = block.metadata?.name || 'Unnamed Block'

        if (parallelInfo) {
          // This is a parallel iteration
          const parallelState = context.parallelExecutions?.get(parallelInfo.parallelId)
          iterationCurrent = parallelInfo.iterationIndex + 1
          iterationTotal = parallelState?.parallelCount
          iterationType = 'parallel'
        } else {
          // Check if this block is inside a loop
          const containingLoopId = this.resolver.getContainingLoopId(block.id)
          if (containingLoopId) {
            const currentIteration = context.loopIterations.get(containingLoopId)
            const loop = context.workflow?.loops?.[containingLoopId]
            if (currentIteration !== undefined && loop) {
              iterationCurrent = currentIteration
              if (loop.loopType === 'forEach') {
                // For forEach loops, get the total from the items
                const forEachItems = context.loopItems.get(`${containingLoopId}_items`)
                if (forEachItems) {
                  iterationTotal = Array.isArray(forEachItems)
                    ? forEachItems.length
                    : Object.keys(forEachItems).length
                }
              } else {
                // For regular loops, use the iterations count
                iterationTotal = Number(loop.iterations) || 5
              }
              iterationType = 'loop'
            }
          }
        }

        addConsole({
          input: blockLog.input,
          output: blockLog.output,
          success: true,
          durationMs: blockLog.durationMs,
          startedAt: blockLog.startedAt,
          endedAt: blockLog.endedAt,
          workflowId: context.workflowId,
          blockId: parallelInfo ? blockId : block.id,
          executionId: this.runtime.contextExtensions.executionId,
          blockName,
          blockType: block.metadata?.id || 'unknown',
          iterationCurrent,
          iterationTotal,
          iterationType,
        })
      }

      trackWorkflowTelemetry('block_execution', {
        workflowId: context.workflowId,
        blockId: block.id,
        virtualBlockId: parallelInfo ? blockId : undefined,
        iterationIndex: parallelInfo?.iterationIndex,
        blockType: block.metadata?.id || 'unknown',
        blockName: block.metadata?.name || 'Unnamed Block',
        durationMs: Math.round(executionTime),
        success: true,
      })

      return output
    } catch (error: any) {
      // Remove this block from active blocks if there's an error
      // Only manage active blocks for parent executions
      if (!this.runtime.isChildExecution) {
        useExecutionStore.setState((state) => {
          const updatedActiveBlockIds = new Set(state.activeBlockIds)
          updatedActiveBlockIds.delete(blockId)

          // For virtual blocks, also check if we should remove the actual block ID
          if (parallelInfo) {
            // Check if there are any other virtual blocks for the same actual block still active
            const hasOtherVirtualBlocks = Array.from(state.activeBlockIds).some((activeId) => {
              if (activeId === blockId) return false // Skip the current block we're removing
              const mapping = context.parallelBlockMapping?.get(activeId)
              return mapping && mapping.originalBlockId === parallelInfo.originalBlockId
            })

            // If no other virtual blocks are active for this actual block, remove the actual block ID too
            if (!hasOtherVirtualBlocks) {
              updatedActiveBlockIds.delete(parallelInfo.originalBlockId)
            }
          }

          return { activeBlockIds: updatedActiveBlockIds }
        })
      }

      blockLog.success = false
      blockLog.error =
        error.message ||
        `Error executing ${block.metadata?.id || 'unknown'} block: ${String(error)}`
      blockLog.endedAt = new Date().toISOString()
      blockLog.durationMs =
        new Date(blockLog.endedAt).getTime() - new Date(blockLog.startedAt).getTime()

      // Log the error even if we'll continue execution through error path
      context.blockLogs.push(blockLog)

      // Notify listeners of block completion (error) for real-time log streaming
      try {
        await this.runtime.onBlockComplete?.(blockLog)
      } catch (e) {
        logger.warn('onBlockComplete callback error:', e)
      }

      // Skip console logging for infrastructure blocks like loops and parallels
      if (block.metadata?.id !== BlockType.LOOP && block.metadata?.id !== BlockType.PARALLEL) {
        // Determine iteration context for this block
        let iterationCurrent: number | undefined
        let iterationTotal: number | undefined
        let iterationType: 'loop' | 'parallel' | undefined
        const blockName = block.metadata?.name || 'Unnamed Block'

        if (parallelInfo) {
          // This is a parallel iteration
          const parallelState = context.parallelExecutions?.get(parallelInfo.parallelId)
          iterationCurrent = parallelInfo.iterationIndex + 1
          iterationTotal = parallelState?.parallelCount
          iterationType = 'parallel'
        } else {
          // Check if this block is inside a loop
          const containingLoopId = this.resolver.getContainingLoopId(block.id)
          if (containingLoopId) {
            const currentIteration = context.loopIterations.get(containingLoopId)
            const loop = context.workflow?.loops?.[containingLoopId]
            if (currentIteration !== undefined && loop) {
              iterationCurrent = currentIteration
              if (loop.loopType === 'forEach') {
                // For forEach loops, get the total from the items
                const forEachItems = context.loopItems.get(`${containingLoopId}_items`)
                if (forEachItems) {
                  iterationTotal = Array.isArray(forEachItems)
                    ? forEachItems.length
                    : Object.keys(forEachItems).length
                }
              } else {
                // For regular loops, use the iterations count
                iterationTotal = Number(loop.iterations) || 5
              }
              iterationType = 'loop'
            }
          }
        }

        addConsole({
          input: blockLog.input,
          output: {},
          success: false,
          error:
            error.message ||
            `Error executing ${block.metadata?.id || 'unknown'} block: ${String(error)}`,
          durationMs: blockLog.durationMs,
          startedAt: blockLog.startedAt,
          endedAt: blockLog.endedAt,
          workflowId: context.workflowId,
          blockId: parallelInfo ? blockId : block.id,
          executionId: this.runtime.contextExtensions.executionId,
          blockName,
          blockType: block.metadata?.id || 'unknown',
          iterationCurrent,
          iterationTotal,
          iterationType,
        })
      }

      // Check for error connections and follow them if they exist
      const hasErrorPath = this.edgeManager.activateErrorPath(actualBlockId, context)

      // Log the error for visibility
      logger.error(
        `Error executing block ${block.metadata?.name || actualBlockId}:`,
        sanitizeError(error)
      )

      // Create error output with appropriate structure
      const errorOutput: NormalizedBlockOutput = {
        error: extractErrorMessage(error),
        status: error.status || 500,
      }

      // Set block state with error output
      context.blockStates.set(blockId, {
        output: errorOutput,
        executed: true,
        executionTime: blockLog.durationMs,
      })

      // If there are error paths to follow, return error output instead of throwing
      if (hasErrorPath) {
        // Return the error output to allow execution to continue along error path
        return errorOutput
      }

      // Create a proper error message that is never undefined
      let errorMessage = error.message

      // Handle the specific "undefined (undefined)" case
      if (!errorMessage || errorMessage === 'undefined (undefined)') {
        errorMessage = `Error executing ${block.metadata?.id || 'unknown'} block: ${block.metadata?.name || 'Unnamed Block'}`

        // Try to get more details if possible
        if (error && typeof error === 'object') {
          if (error.code) errorMessage += ` (code: ${error.code})`
          if (error.status) errorMessage += ` (status: ${error.status})`
          if (error.type) errorMessage += ` (type: ${error.type})`
        }
      }

      trackWorkflowTelemetry('block_execution_error', {
        workflowId: context.workflowId,
        blockId: block.id,
        virtualBlockId: parallelInfo ? blockId : undefined,
        iterationIndex: parallelInfo?.iterationIndex,
        blockType: block.metadata?.id || 'unknown',
        blockName: block.metadata?.name || 'Unnamed Block',
        durationMs: blockLog.durationMs,
        errorType: error.name || 'Error',
        errorMessage: extractErrorMessage(error),
      })

      throw new Error(errorMessage)
    }
  }

  /**
   * Creates a new block log entry with initial values.
   */
  private createBlockLog(block: SerializedBlock): BlockLog {
    return {
      blockId: block.id,
      blockName: block.metadata?.name || '',
      blockType: block.metadata?.id || '',
      startedAt: new Date().toISOString(),
      endedAt: '',
      durationMs: 0,
      success: false,
    }
  }
}
