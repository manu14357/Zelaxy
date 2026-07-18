import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { ParallelManager } from '@/executor/parallels/parallels'
import type { PathTracker } from '@/executor/path/path'
import type { ExecutionContext } from '@/executor/types'
import type { SerializedWorkflow } from '@/serializer/types'

const logger = createLogger('EdgeManager')

/**
 * Decides which blocks are ready to run next and how execution paths advance after a layer.
 *
 * This is the routing brain: readiness checks for regular, loop, parallel, condition, switch and
 * router edges, virtual-instance expansion for parallels, and error-path activation. Path updates
 * after a layer are delegated to {@link PathTracker}.
 */
export class EdgeManager {
  constructor(
    private workflow: SerializedWorkflow,
    private parallelManager: ParallelManager,
    private pathTracker: PathTracker
  ) {}

  /**
   * Determines the next layer of blocks to execute based on dependencies and execution path.
   * Handles special cases for blocks in loops, condition blocks, and router blocks.
   * For blocks inside parallel executions, creates multiple virtual instances.
   */
  getNextExecutionLayer(context: ExecutionContext): string[] {
    const executedBlocks = context.executedBlocks
    const pendingBlocks = new Set<string>()

    // Check if we have any active parallel executions
    const activeParallels = new Map<string, any>()
    if (context.parallelExecutions) {
      for (const [parallelId, state] of context.parallelExecutions) {
        if (
          state.currentIteration > 0 &&
          state.currentIteration <= state.parallelCount &&
          !context.completedLoops.has(parallelId)
        ) {
          activeParallels.set(parallelId, state)
        }
      }
    }

    for (const block of this.workflow.blocks) {
      if (executedBlocks.has(block.id) || block.enabled === false) {
        continue
      }

      // Check if this block is inside an active parallel
      let insideParallel: string | null = null
      for (const [parallelId, parallel] of Object.entries(this.workflow.parallels || {})) {
        if (parallel.nodes.includes(block.id)) {
          insideParallel = parallelId
          break
        }
      }

      // If block is inside a parallel, handle multiple instances
      if (insideParallel && activeParallels.has(insideParallel)) {
        const parallelState = activeParallels.get(insideParallel)

        // Create virtual instances for each unprocessed iteration
        const virtualBlockIds = this.parallelManager.createVirtualBlockInstances(
          block,
          insideParallel,
          parallelState,
          executedBlocks,
          context.activeExecutionPath
        )

        for (const virtualBlockId of virtualBlockIds) {
          // Check dependencies for this virtual instance
          const incomingConnections = this.workflow.connections.filter(
            (conn) => conn.target === block.id
          )

          const iterationIndex = Number.parseInt(virtualBlockId.split('_iteration_')[1])
          const allDependenciesMet = this.checkDependencies(
            incomingConnections,
            executedBlocks,
            context,
            insideParallel,
            iterationIndex
          )

          if (allDependenciesMet) {
            pendingBlocks.add(virtualBlockId)

            // Store mapping for virtual block
            if (!context.parallelBlockMapping) {
              context.parallelBlockMapping = new Map()
            }
            context.parallelBlockMapping.set(virtualBlockId, {
              originalBlockId: block.id,
              parallelId: insideParallel,
              iterationIndex: iterationIndex,
            })
          }
        }
      } else if (insideParallel) {
        // Block is inside a parallel but the parallel is not active
        // Check if all virtual instances have been executed
        const parallelState = context.parallelExecutions?.get(insideParallel)
        if (parallelState) {
          let allVirtualInstancesExecuted = true
          for (let i = 0; i < parallelState.parallelCount; i++) {
            const virtualBlockId = `${block.id}_parallel_${insideParallel}_iteration_${i}`
            if (!executedBlocks.has(virtualBlockId)) {
              allVirtualInstancesExecuted = false
              break
            }
          }

          // If all virtual instances have been executed, skip this block
          // It should not be executed as a regular block
          if (allVirtualInstancesExecuted) {
            continue
          }
        }

        // If we reach here, the parallel hasn't been initialized yet
        // Allow normal execution flow
        if (!context.activeExecutionPath.has(block.id)) {
          continue
        }

        const incomingConnections = this.workflow.connections.filter(
          (conn) => conn.target === block.id
        )

        const allDependenciesMet = this.checkDependencies(
          incomingConnections,
          executedBlocks,
          context
        )

        if (allDependenciesMet) {
          pendingBlocks.add(block.id)
        }
      } else {
        // Regular block handling (not inside a parallel)
        // Only consider blocks in the active execution path
        if (!context.activeExecutionPath.has(block.id)) {
          continue
        }

        const incomingConnections = this.workflow.connections.filter(
          (conn) => conn.target === block.id
        )

        const allDependenciesMet = this.checkDependencies(
          incomingConnections,
          executedBlocks,
          context
        )

        if (allDependenciesMet) {
          pendingBlocks.add(block.id)
        }
      }
    }

    return Array.from(pendingBlocks)
  }

  /**
   * Checks if all dependencies for a block are met.
   * Handles special cases for different connection types.
   */
  checkDependencies(
    incomingConnections: any[],
    executedBlocks: Set<string>,
    context: ExecutionContext,
    insideParallel?: string,
    iterationIndex?: number
  ): boolean {
    if (incomingConnections.length === 0) {
      return true
    }
    // Check if this is a loop block
    const isLoopBlock = incomingConnections.some((conn) => {
      const sourceBlock = this.workflow.blocks.find((b) => b.id === conn.source)
      return sourceBlock?.metadata?.id === BlockType.LOOP
    })

    if (isLoopBlock) {
      // Loop blocks are treated as regular blocks with standard dependency checking
      return incomingConnections.every((conn) => {
        const sourceExecuted = executedBlocks.has(conn.source)
        const sourceBlockState = context.blockStates.get(conn.source)
        const sourceBlock = this.workflow.blocks.find((b) => b.id === conn.source)
        const sourceBlockType = sourceBlock?.metadata?.id

        // Check if there was an actual execution error (not just error field in output)
        // An error exists if: output.error exists AND there's no data/success output
        // EXCEPT: MSSQL/MySQL blocks ALWAYS continue to next node regardless of error
        let hasSourceError = false
        if (sourceBlockType !== 'mssql' && sourceBlockType !== 'mysql') {
          hasSourceError =
            sourceBlockState?.output?.error !== undefined &&
            (sourceBlockState?.output?.data === undefined ||
              (Array.isArray(sourceBlockState?.output?.data) &&
                sourceBlockState.output.data.length === 0))
        }

        // For error connections, check if the source had an error
        if (conn.sourceHandle === 'error') {
          return sourceExecuted && hasSourceError
        }

        // For regular connections, check if the source was executed without error
        if (conn.sourceHandle === 'source' || !conn.sourceHandle) {
          return sourceExecuted && !hasSourceError
        }

        // If source is not in active path, consider this dependency met
        if (!context.activeExecutionPath.has(conn.source)) {
          return true
        }

        // For regular blocks, dependency is met if source is executed
        return sourceExecuted
      })
    }
    // Regular non-loop block handling
    return incomingConnections.every((conn) => {
      // For virtual blocks inside parallels, check the source appropriately
      let sourceId = conn.source
      if (insideParallel !== undefined && iterationIndex !== undefined) {
        // If the source is also inside the same parallel, use virtual ID
        const sourceBlock = this.workflow.blocks.find((b) => b.id === conn.source)
        if (sourceBlock && this.workflow.parallels?.[insideParallel]?.nodes.includes(conn.source)) {
          sourceId = `${conn.source}_parallel_${insideParallel}_iteration_${iterationIndex}`
        }
      }

      const sourceExecuted = executedBlocks.has(sourceId)
      const sourceBlock = this.workflow.blocks.find((b) => b.id === conn.source)
      const sourceBlockState =
        context.blockStates.get(sourceId) || context.blockStates.get(conn.source)
      const sourceBlockType = sourceBlock?.metadata?.id

      // Check if there was an actual execution error (not just error field in output)
      // An error exists if: output.error exists AND there's no data/success output
      // EXCEPT: MSSQL/MySQL blocks ALWAYS continue to next node regardless of error
      let hasSourceError = false
      if (sourceBlockType !== 'mssql' && sourceBlockType !== 'mysql') {
        hasSourceError =
          sourceBlockState?.output?.error !== undefined &&
          (sourceBlockState?.output?.data === undefined ||
            (Array.isArray(sourceBlockState?.output?.data) &&
              sourceBlockState.output.data.length === 0))
      }

      logger.info(
        `[checkDependencies] Connection ${conn.source} -> ${conn.target}: sourceType=${sourceBlockType}, sourceExecuted=${sourceExecuted}, hasSourceError=${hasSourceError}`
      )

      // Special handling for loop-start-source connections
      if (conn.sourceHandle === 'loop-start-source') {
        // This block is connected to a loop's start output
        // It should be activated when the loop block executes
        return sourceExecuted
      }

      // Special handling for loop-end-source connections
      if (conn.sourceHandle === 'loop-end-source') {
        // This block is connected to a loop's end output
        // It should only be activated when the loop completes
        const loopCompleted = context.completedLoops.has(conn.source)
        return loopCompleted
      }

      // Special handling for parallel-start-source connections
      if (conn.sourceHandle === 'parallel-start-source') {
        // This block is connected to a parallel's start output
        // It should be activated when the parallel block executes
        return executedBlocks.has(conn.source)
      }

      // Special handling for parallel-end-source connections
      if (conn.sourceHandle === 'parallel-end-source') {
        // This block is connected to a parallel's end output
        // It should only be activated when the parallel completes
        const parallelCompleted = context.completedLoops.has(conn.source)
        return parallelCompleted
      }

      // For condition blocks, check if this is the selected path
      if (conn.sourceHandle === 'true' || conn.sourceHandle === 'false') {
        const sourceBlock = this.workflow.blocks.find((b) => b.id === conn.source)
        if (sourceBlock?.metadata?.id === BlockType.CONDITION) {
          const selectedCondition = context.decisions.condition.get(conn.source)

          // If source is executed and this is not the selected path, treat as "not applicable"
          // This allows blocks with multiple condition paths to execute via any selected path
          if (sourceExecuted && selectedCondition && conn.sourceHandle !== selectedCondition) {
            return true // Changed from false to true - unselected paths don't block execution
          }

          // This dependency is met only if source is executed and this is the selected path
          return sourceExecuted && conn.sourceHandle === selectedCondition
        }
      }

      // For switch blocks, check if this is the selected case path
      if (conn.sourceHandle?.startsWith('case-')) {
        const sourceBlock = this.workflow.blocks.find((b) => b.id === conn.source)
        if (sourceBlock?.metadata?.id === BlockType.SWITCH) {
          const selectedCaseId = context.decisions.condition.get(conn.source)
          const expectedHandle = selectedCaseId ? `case-${selectedCaseId}` : null

          // If source is executed and this is not the selected case, treat as "not applicable"
          if (sourceExecuted && expectedHandle && conn.sourceHandle !== expectedHandle) {
            return true
          }

          return sourceExecuted && conn.sourceHandle === expectedHandle
        }
      }

      // For router blocks, check if this is the selected target
      if (sourceBlock?.metadata?.id === BlockType.ROUTER) {
        const selectedTarget = context.decisions.router.get(conn.source)

        // If source is executed and this is not the selected target, dependency is NOT met
        if (sourceExecuted && selectedTarget && conn.target !== selectedTarget) {
          return false
        }

        // Otherwise, this dependency is met only if source is executed and this is the selected target
        return sourceExecuted && conn.target === selectedTarget
      }

      // If source is not in active path, consider this dependency met
      // This allows blocks with multiple inputs to execute even if some inputs are from inactive paths
      if (!context.activeExecutionPath.has(conn.source)) {
        return true
      }

      // For error connections, check if the source had an error
      if (conn.sourceHandle === 'error') {
        return sourceExecuted && hasSourceError
      }

      // For regular connections, check if the source was executed without error
      if (conn.sourceHandle === 'source' || !conn.sourceHandle) {
        return sourceExecuted && !hasSourceError
      }

      // For regular blocks, dependency is met if source is executed
      return sourceExecuted
    })
  }

  /**
   * Advances active execution paths after a layer completes (router/condition/loop/parallel gating).
   */
  updateExecutionPaths(blockIds: string[], context: ExecutionContext): void {
    this.pathTracker.updateExecutionPaths(blockIds, context)
  }

  /**
   * Activates error paths from a block that had an error.
   * Checks for connections from the block's "error" handle and adds them to the active execution path.
   */
  activateErrorPath(blockId: string, context: ExecutionContext): boolean {
    // Skip for starter blocks which don't have error handles
    const block = this.workflow.blocks.find((b) => b.id === blockId)
    if (
      block?.metadata?.id === BlockType.STARTER ||
      block?.metadata?.id === BlockType.CONDITION ||
      block?.metadata?.id === BlockType.LOOP ||
      block?.metadata?.id === BlockType.PARALLEL
    ) {
      return false
    }

    // Look for connections from this block's error handle
    const errorConnections = this.workflow.connections.filter(
      (conn) => conn.source === blockId && conn.sourceHandle === 'error'
    )

    if (errorConnections.length === 0) {
      return false
    }

    // Add all error connection targets to the active execution path
    for (const conn of errorConnections) {
      context.activeExecutionPath.add(conn.target)
      logger.info(`Activated error path from ${blockId} to ${conn.target}`)
    }

    return true
  }
}
