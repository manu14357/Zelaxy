import type { DAG } from '@/executor/dag/builder'
import { buildParallelSentinelStartId, buildSentinelStartId } from '@/executor/utils/subflow-utils'

/**
 * Run-from-block support for the DAG executor (P2.6).
 *
 * "Run from here" restarts a workflow at an arbitrary block, reusing a prior run's OUTPUT snapshot for
 * every upstream block instead of re-executing the whole graph. This module owns the three pure
 * helpers that make that safe:
 *
 *  - {@link resolveContainerToSentinelStart} maps a loop/parallel *container* id to the DAG's sentinel
 *    start node, since a container is not itself an executable DAG node.
 *  - {@link validateRunFromBlock} enforces the container-only rule: a block strictly *inside* a loop or
 *    parallel cannot be a start (its upstream frontier — the loop continuation / sibling branches —
 *    cannot be reconstructed from a flat output snapshot). Only the enclosing container is legal,
 *    matching Sim's start-block semantics.
 *  - {@link computeExecutionSets} splits the DAG into the *dirty* set (the start node and everything
 *    reachable downstream, which will re-run) and the *upstream* set (ancestors of the start, which
 *    are restored from the snapshot).
 */

export interface RunFromBlockValidation {
  valid: boolean
  /** The DAG node id the engine should actually start from (a sentinel start for containers). */
  effectiveStartBlockId?: string
  /** User-facing reason the requested block cannot be a start. */
  error?: string
}

export interface ExecutionSets {
  /** Nodes that will execute: the effective start node plus every node reachable downstream. */
  dirtySet: Set<string>
  /** Ancestors of the effective start node — restored from the snapshot rather than re-run. */
  upstreamSet: Set<string>
}

/**
 * If `blockId` is a loop/parallel container, return its sentinel-start DAG node id; otherwise return
 * `blockId` unchanged. Containers are metadata-only in the workflow and never appear as DAG nodes —
 * the run must enter through the sentinel that drives the subflow.
 */
export function resolveContainerToSentinelStart(blockId: string, dag: DAG): string {
  if (dag.loopConfigs.has(blockId)) return buildSentinelStartId(blockId)
  if (dag.parallelConfigs.has(blockId)) return buildParallelSentinelStartId(blockId)
  return blockId
}

/**
 * Decide whether `blockId` is a legal "run from here" start and resolve the DAG node the engine should
 * begin from. Rejects a block that lives strictly inside a loop or parallel — only the enclosing
 * container is a legal start.
 */
export function validateRunFromBlock(blockId: string, dag: DAG): RunFromBlockValidation {
  // A container itself is always a legal start — enter through its sentinel.
  if (dag.loopConfigs.has(blockId) || dag.parallelConfigs.has(blockId)) {
    return { valid: true, effectiveStartBlockId: resolveContainerToSentinelStart(blockId, dag) }
  }

  // A block strictly inside a subflow is not a legal start. The config node lists are authoritative
  // (a parallel-internal block is stored in the DAG under a branch-suffixed id, so a plain
  // `dag.nodes.get(blockId)` would miss it).
  for (const [loopId, config] of dag.loopConfigs) {
    if (config.nodes?.includes(blockId)) {
      return {
        valid: false,
        error: `Cannot run from a block inside a loop. Run from the loop container (${loopId}) instead.`,
      }
    }
  }
  for (const [parallelId, config] of dag.parallelConfigs) {
    if (config.nodes?.includes(blockId)) {
      return {
        valid: false,
        error: `Cannot run from a block inside a parallel. Run from the parallel container (${parallelId}) instead.`,
      }
    }
  }

  const node = dag.nodes.get(blockId)
  if (!node) {
    return { valid: false, error: `Block "${blockId}" was not found in the workflow.` }
  }

  return { valid: true, effectiveStartBlockId: blockId }
}

/**
 * Partition the DAG relative to the effective start node.
 *
 * `dirtySet` is the forward-reachable closure from the start (the blocks that will actually execute).
 * `upstreamSet` is every non-dirty block that feeds into the dirty region — the backward closure over
 * the incoming edges of ALL dirty nodes (not just the start). Seeding this set from the snapshot lets
 * a convergent dirty block resolve a reference to a parent that lives on a branch the start doesn't
 * descend from. The start node is in `dirtySet`, never `upstreamSet`.
 *
 * Backward edges (loop-continue) are followed forward normally — a set guards against cycles — so a
 * loop container start re-runs its whole body.
 */
export function computeExecutionSets(dag: DAG, startNodeId: string): ExecutionSets {
  const dirtySet = new Set<string>()
  const forwardQueue: string[] = [startNodeId]
  while (forwardQueue.length > 0) {
    const id = forwardQueue.shift()!
    if (dirtySet.has(id)) continue
    dirtySet.add(id)
    const node = dag.nodes.get(id)
    if (!node) continue
    for (const [, edge] of node.outgoingEdges) {
      if (!dirtySet.has(edge.target)) forwardQueue.push(edge.target)
    }
  }

  // Walk backwards from every dirty node, collecting the non-dirty ancestors that feed the region.
  const upstreamSet = new Set<string>()
  const backwardQueue: string[] = [...dirtySet]
  while (backwardQueue.length > 0) {
    const id = backwardQueue.shift()!
    const node = dag.nodes.get(id)
    if (!node) continue
    for (const source of node.incomingEdges) {
      // A dirty ancestor (e.g. a loop back-edge) re-runs; it is not seeded from the snapshot.
      if (dirtySet.has(source) || upstreamSet.has(source)) continue
      upstreamSet.add(source)
      backwardQueue.push(source)
    }
  }

  return { dirtySet, upstreamSet }
}
