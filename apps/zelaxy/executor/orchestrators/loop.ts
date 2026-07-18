import { createLogger } from '@/lib/logs/console/logger'
import { DEFAULTS, EDGE } from '@/executor/consts'
import type { DAG } from '@/executor/dag/builder'
import type { BlockStateController, LoopScope } from '@/executor/execution/state'
import type { ExecutionContext, NormalizedBlockOutput } from '@/executor/types'
import type { SerializedLoop } from '@/serializer/types'

const logger = createLogger('LoopOrchestrator')

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
    private state: BlockStateController
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
    const loopConfig = this.dag.loopConfigs.get(loopId)
    if (!loopConfig) return
    for (const nodeId of loopConfig.nodes) {
      this.state.unmarkExecuted(nodeId)
    }
  }

  restoreLoopEdges(_loopId: string): void {
    // Edge state restoration is handled by the edge-manager in the full implementation
    // No-op in simplified orchestrator
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
