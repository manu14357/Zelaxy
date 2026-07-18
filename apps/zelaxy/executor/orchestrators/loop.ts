import { createLogger } from '@/lib/logs/console/logger'
import { DEFAULTS, EDGE } from '@/executor/consts'
import type { DAG } from '@/executor/dag/builder'
import type { EdgeManager } from '@/executor/execution/edge-manager'
import type { BlockStateController, LoopScope } from '@/executor/execution/state'
import type { ExecutionContext, NormalizedBlockOutput } from '@/executor/types'
import {
  buildParallelSentinelEndId,
  buildParallelSentinelStartId,
  buildSentinelEndId,
  buildSentinelStartId,
  extractLoopIdFromSentinel,
  extractParallelIdFromSentinel,
} from '@/executor/utils/subflow-utils'
import type { SerializedLoop } from '@/serializer/types'

const logger = createLogger('LoopOrchestrator')

/** Handles that point backwards (end → start) and must not be restored as forward incoming edges. */
const CONTROL_BACK_EDGE_HANDLES = new Set<string>([
  EDGE.LOOP_CONTINUE,
  EDGE.LOOP_CONTINUE_ALT,
  EDGE.PARALLEL_CONTINUE,
])

export type LoopRoute = typeof EDGE.LOOP_CONTINUE | typeof EDGE.LOOP_EXIT

export interface LoopContinuationResult {
  shouldContinue: boolean
  shouldExit: boolean
  selectedRoute: LoopRoute
  aggregatedResults?: unknown
  totalIterations?: number
}

function buildLoopIndexCondition(maxIterations: number): string {
  return `{{loopIndex}} < ${maxIterations}`
}

export class LoopOrchestrator {
  constructor(
    private dag: DAG,
    private state: BlockStateController,
    private edgeManager?: EdgeManager
  ) {}

  getLoopScope(ctx: ExecutionContext, loopId: string): LoopScope | undefined {
    return ctx.loopScopes?.get(loopId)
  }

  async initializeLoopScope(ctx: ExecutionContext, loopId: string): Promise<LoopScope> {
    const loopConfig = this.dag.loopConfigs.get(loopId) as SerializedLoop | undefined
    if (!loopConfig) throw new Error(`Loop config not found: ${loopId}`)

    const scope: LoopScope = {
      iteration: 0,
      currentIterationOutputs: new Map(),
      allIterationOutputs: [],
    }

    const loopType = loopConfig.loopType ?? 'for'
    scope.loopType = loopType as LoopScope['loopType']

    switch (loopType) {
      case 'for': {
        const maxIterations = (loopConfig as any).iterations ?? DEFAULTS.MAX_ITERATIONS
        scope.maxIterations = maxIterations
        scope.condition = buildLoopIndexCondition(maxIterations)
        break
      }
      case 'forEach': {
        const rawItems = (loopConfig as any).forEachItems
        let items: any[] = []
        if (typeof rawItems === 'string') {
          try {
            items = JSON.parse(rawItems)
          } catch {
            items = []
          }
        } else if (Array.isArray(rawItems)) {
          items = rawItems
        }
        scope.items = items
        scope.maxIterations = items.length
        scope.item = items[0]
        scope.condition = buildLoopIndexCondition(scope.maxIterations)
        break
      }
      case 'while': {
        scope.condition = (loopConfig as any).whileCondition ?? 'false'
        break
      }
      default:
        throw new Error(`Unknown loop type: ${loopType}`)
    }

    if (!ctx.loopScopes) ctx.loopScopes = new Map()
    ctx.loopScopes.set(loopId, scope)
    return scope
  }

  async evaluateInitialCondition(ctx: ExecutionContext, loopId: string): Promise<boolean> {
    const scope = this.getLoopScope(ctx, loopId)
    if (!scope) return false

    // doWhile always runs at least once
    if (scope.skipFirstConditionCheck) return true

    // for/forEach: check if there are items/iterations
    if (scope.maxIterations !== undefined) return scope.maxIterations > 0

    // while: evaluate condition expression
    return this.evaluateCondition(scope.condition ?? 'false', scope)
  }

  async evaluateLoopContinuation(
    ctx: ExecutionContext,
    loopId: string
  ): Promise<LoopContinuationResult> {
    const scope = this.getLoopScope(ctx, loopId)
    if (!scope) {
      return { shouldContinue: false, shouldExit: true, selectedRoute: EDGE.LOOP_EXIT }
    }

    // Archive current iteration outputs
    const iterationOutputs = Array.from(scope.currentIterationOutputs.values())
    scope.allIterationOutputs.push(iterationOutputs)

    // Update forEach item pointer
    if (scope.loopType === 'forEach' && scope.items) {
      const nextIndex = scope.iteration + 1
      scope.item = scope.items[nextIndex]
    }

    scope.iteration++

    // Check continue conditions
    let shouldContinue = false
    if (scope.maxIterations !== undefined) {
      shouldContinue = scope.iteration < scope.maxIterations
    } else {
      shouldContinue = this.evaluateCondition(scope.condition ?? 'false', scope)
    }

    if (shouldContinue) {
      // Reset current iteration outputs for next run
      scope.currentIterationOutputs = new Map()
      return {
        shouldContinue: true,
        shouldExit: false,
        selectedRoute: EDGE.LOOP_CONTINUE,
      }
    }

    const aggregatedResults = scope.allIterationOutputs
    return {
      shouldContinue: false,
      shouldExit: true,
      selectedRoute: EDGE.LOOP_EXIT,
      aggregatedResults,
      totalIterations: scope.iteration,
    }
  }

  storeLoopNodeOutput(
    ctx: ExecutionContext,
    loopId: string,
    nodeId: string,
    output: NormalizedBlockOutput
  ): void {
    const scope = this.getLoopScope(ctx, loopId)
    if (scope) scope.currentIterationOutputs.set(nodeId, output)
    this.state.setBlockOutput(nodeId, output)
  }

  clearLoopExecutionState(loopId: string, ctx: ExecutionContext): void {
    for (const nodeId of this.collectAllLoopNodeIds(loopId)) {
      this.state.unmarkExecuted(nodeId)
    }
    this.resetNestedSubflowScopes(loopId, ctx)
  }

  /**
   * Restores the loop subgraph's incoming edges so the next iteration can run, mirroring the state
   * the builder produced: re-adds every in-loop forward incoming edge (skipping back edges and the
   * start→end exit-bypass), and clears any edges deactivated during the finished iteration.
   */
  restoreLoopEdges(loopId: string): void {
    const allLoopNodeIds = this.collectAllLoopNodeIds(loopId)
    this.edgeManager?.clearDeactivatedEdgesForNodes(allLoopNodeIds)

    for (const nodeId of allLoopNodeIds) {
      const nodeToRestore = this.dag.nodes.get(nodeId)
      if (!nodeToRestore) continue

      for (const sourceId of allLoopNodeIds) {
        const sourceNode = this.dag.nodes.get(sourceId)
        if (!sourceNode) continue

        for (const [, edge] of sourceNode.outgoingEdges) {
          if (edge.target !== nodeId) continue
          if (this.isSubflowStartExitBypassEdge(sourceId, nodeId, edge.sourceHandle)) continue
          if (edge.sourceHandle !== undefined && CONTROL_BACK_EDGE_HANDLES.has(edge.sourceHandle)) {
            continue
          }
          nodeToRestore.incomingEdges.add(sourceId)
        }
      }
    }
  }

  /** All DAG node ids of a loop (its sentinels + members), recursing into nested subflows. */
  private collectAllLoopNodeIds(subflowId: string, visited = new Set<string>()): Set<string> {
    if (visited.has(subflowId)) return new Set()
    visited.add(subflowId)

    const isLoop = this.dag.loopConfigs.has(subflowId)
    const startId = isLoop
      ? buildSentinelStartId(subflowId)
      : buildParallelSentinelStartId(subflowId)
    const endId = isLoop ? buildSentinelEndId(subflowId) : buildParallelSentinelEndId(subflowId)
    const result = new Set<string>([startId, endId])

    const config = this.dag.loopConfigs.get(subflowId) ?? this.dag.parallelConfigs.get(subflowId)
    for (const nodeId of config?.nodes ?? []) {
      if (this.dag.loopConfigs.has(nodeId) || this.dag.parallelConfigs.has(nodeId)) {
        for (const id of this.collectAllLoopNodeIds(nodeId, visited)) result.add(id)
      } else {
        result.add(nodeId)
        for (const dagId of this.dag.nodes.keys()) {
          if (dagId !== nodeId && dagId.startsWith(`${nodeId}₍`)) result.add(dagId)
        }
      }
    }
    return result
  }

  /** Drops nested loop/parallel scopes so they re-initialize on the next outer iteration. */
  private resetNestedSubflowScopes(subflowId: string, ctx: ExecutionContext): void {
    const config = this.dag.loopConfigs.get(subflowId) ?? this.dag.parallelConfigs.get(subflowId)
    for (const nodeId of config?.nodes ?? []) {
      if (this.dag.loopConfigs.has(nodeId)) {
        ctx.loopScopes?.delete(nodeId)
        this.resetNestedSubflowScopes(nodeId, ctx)
      } else if (this.dag.parallelConfigs.has(nodeId)) {
        ctx.parallelScopes?.delete(nodeId)
        this.resetNestedSubflowScopes(nodeId, ctx)
      }
    }
  }

  /** The start→end LOOP_EXIT / PARALLEL_EXIT bypass edge (for an empty subflow) must not restore. */
  private isSubflowStartExitBypassEdge(
    sourceId: string,
    targetId: string,
    sourceHandle?: string
  ): boolean {
    if (sourceHandle === EDGE.LOOP_EXIT) {
      const loopId = extractLoopIdFromSentinel(sourceId)
      return (
        !!loopId &&
        sourceId === buildSentinelStartId(loopId) &&
        targetId === buildSentinelEndId(loopId)
      )
    }
    if (sourceHandle === EDGE.PARALLEL_EXIT) {
      const parallelId = extractParallelIdFromSentinel(sourceId)
      return (
        !!parallelId &&
        sourceId === buildParallelSentinelStartId(parallelId) &&
        targetId === buildParallelSentinelEndId(parallelId)
      )
    }
    return false
  }

  private evaluateCondition(condition: string, scope: LoopScope): boolean {
    try {
      const fn = new Function('loopIndex', `return !!(${condition})`)
      return fn(scope.iteration)
    } catch {
      logger.warn('Failed to evaluate loop condition', { condition })
      return false
    }
  }
}
