import { createLogger } from '@/lib/logs/console/logger'
import { EDGE } from '@/executor/consts'
import type { DAG } from '@/executor/dag/builder'
import type { ParallelScope } from '@/executor/execution/state'
import type { BlockStateWriter } from '@/executor/execution/types'
import type { ExecutionContext, NormalizedBlockOutput } from '@/executor/types'
import { extractBranchIndex } from '@/executor/utils/subflow-utils'

const logger = createLogger('ParallelOrchestrator')

export interface ParallelAggregationResult {
  allBranchesComplete: boolean
  results?: unknown
  completedBranches?: number
  totalBranches?: number
}

export class ParallelOrchestrator {
  constructor(
    private dag: DAG,
    private state: BlockStateWriter
  ) {}

  getParallelScope(ctx: ExecutionContext, parallelId: string): ParallelScope | undefined {
    return ctx.parallelScopes?.get(parallelId)
  }

  async initializeParallelScope(
    ctx: ExecutionContext,
    parallelId: string
  ): Promise<ParallelScope> {
    const parallelConfig = this.dag.parallelConfigs.get(parallelId)
    if (!parallelConfig) throw new Error(`Parallel config not found: ${parallelId}`)

    const rawCount = (parallelConfig as any).count
    const rawItems = (parallelConfig as any).distribution ?? (parallelConfig as any).items

    let totalBranches = 1
    let items: any[] | undefined

    if (rawItems !== undefined) {
      const resolved = this.parseItems(rawItems)
      items = resolved
      totalBranches = resolved.length
    } else if (typeof rawCount === 'number') {
      totalBranches = rawCount
    }

    const isEmpty = totalBranches === 0

    const scope: ParallelScope = {
      parallelId,
      totalBranches,
      branchOutputs: new Map(),
      items,
      isEmpty,
    }

    if (!ctx.parallelScopes) ctx.parallelScopes = new Map()
    ctx.parallelScopes.set(parallelId, scope)
    return scope
  }

  handleParallelBranchCompletion(
    ctx: ExecutionContext,
    parallelId: string,
    nodeId: string,
    output: NormalizedBlockOutput
  ): void {
    const scope = this.getParallelScope(ctx, parallelId)
    if (!scope) return

    let branchIndex = 0
    try {
      branchIndex = extractBranchIndex(nodeId) ?? 0
    } catch {
      branchIndex = 0
    }

    const existing = scope.branchOutputs.get(branchIndex) ?? []
    existing.push(output)
    scope.branchOutputs.set(branchIndex, existing)

    this.state.setBlockOutput(nodeId, output)
  }

  async aggregateParallelResults(
    ctx: ExecutionContext,
    parallelId: string
  ): Promise<ParallelAggregationResult> {
    const scope = this.getParallelScope(ctx, parallelId)
    if (!scope) {
      return { allBranchesComplete: true, results: [], totalBranches: 0 }
    }

    const completedBranches = scope.branchOutputs.size

    if (completedBranches < scope.totalBranches) {
      return {
        allBranchesComplete: false,
        completedBranches,
        totalBranches: scope.totalBranches,
      }
    }

    // All branches done — collect results in branch order
    const results: NormalizedBlockOutput[] = []
    for (let i = 0; i < scope.totalBranches; i++) {
      const branchOutputs = scope.branchOutputs.get(i)
      if (branchOutputs) results.push(...branchOutputs)
    }

    return {
      allBranchesComplete: true,
      results,
      completedBranches,
      totalBranches: scope.totalBranches,
    }
  }

  findParallelIdForNode(baseBlockId: string): string | undefined {
    for (const [parallelId, config] of this.dag.parallelConfigs) {
      if (config.nodes.includes(baseBlockId)) return parallelId
    }
    return undefined
  }

  private parseItems(rawItems: any): any[] {
    if (Array.isArray(rawItems)) return rawItems
    if (typeof rawItems === 'string') {
      try { return JSON.parse(rawItems) } catch { return [] }
    }
    return []
  }
}
