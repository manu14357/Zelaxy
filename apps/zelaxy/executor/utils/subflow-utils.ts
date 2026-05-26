import { LOOP, PARALLEL } from '@/executor/consts'

const BRANCH_PATTERN = new RegExp(`${PARALLEL.BRANCH.PREFIX}\\d+${PARALLEL.BRANCH.SUFFIX}$`)
const BRANCH_INDEX_PATTERN = new RegExp(
  `${PARALLEL.BRANCH.PREFIX}(\\d+)${PARALLEL.BRANCH.SUFFIX}$`
)

export function buildSentinelStartId(loopId: string): string {
  return `${LOOP.SENTINEL.PREFIX}${loopId}${LOOP.SENTINEL.START_SUFFIX}`
}

export function buildSentinelEndId(loopId: string): string {
  return `${LOOP.SENTINEL.PREFIX}${loopId}${LOOP.SENTINEL.END_SUFFIX}`
}

export function buildParallelSentinelStartId(parallelId: string): string {
  return `${PARALLEL.SENTINEL.PREFIX}${parallelId}${PARALLEL.SENTINEL.START_SUFFIX}`
}

export function buildParallelSentinelEndId(parallelId: string): string {
  return `${PARALLEL.SENTINEL.PREFIX}${parallelId}${PARALLEL.SENTINEL.END_SUFFIX}`
}

/**
 * Build branch node ID with subscript notation.
 * Example: ("blockId", 2) → "blockId₍2₎"
 */
export function buildBranchNodeId(baseId: string, branchIndex: number): string {
  return `${baseId}${PARALLEL.BRANCH.PREFIX}${branchIndex}${PARALLEL.BRANCH.SUFFIX}`
}

export function extractBaseBlockId(branchNodeId: string): string {
  return branchNodeId.replace(BRANCH_PATTERN, '')
}

export function extractBranchIndex(branchNodeId: string): number | null {
  const match = branchNodeId.match(BRANCH_INDEX_PATTERN)
  return match ? Number.parseInt(match[1], 10) : null
}

export function isBranchNodeId(nodeId: string): boolean {
  return BRANCH_PATTERN.test(nodeId)
}

/**
 * Normalize a node ID by stripping branch subscripts and loop suffixes.
 * Used for looking up block states by logical block ID.
 */
export function normalizeNodeId(nodeId: string): string {
  return nodeId.replace(BRANCH_PATTERN, '').replace(/_loop\d+/g, '')
}

export function isLoopSentinelNodeId(nodeId: string): boolean {
  return (
    nodeId.startsWith(LOOP.SENTINEL.PREFIX) &&
    (nodeId.endsWith(LOOP.SENTINEL.START_SUFFIX) || nodeId.endsWith(LOOP.SENTINEL.END_SUFFIX))
  )
}

export function isParallelSentinelNodeId(nodeId: string): boolean {
  return (
    nodeId.startsWith(PARALLEL.SENTINEL.PREFIX) &&
    (nodeId.endsWith(PARALLEL.SENTINEL.START_SUFFIX) ||
      nodeId.endsWith(PARALLEL.SENTINEL.END_SUFFIX))
  )
}

export function isSentinelNodeId(nodeId: string): boolean {
  return isLoopSentinelNodeId(nodeId) || isParallelSentinelNodeId(nodeId)
}

export function extractLoopIdFromSentinel(sentinelId: string): string | null {
  const startPattern = new RegExp(`^${LOOP.SENTINEL.PREFIX}(.+)${LOOP.SENTINEL.START_SUFFIX}$`)
  const endPattern = new RegExp(`^${LOOP.SENTINEL.PREFIX}(.+)${LOOP.SENTINEL.END_SUFFIX}$`)
  const startMatch = sentinelId.match(startPattern)
  if (startMatch) return startMatch[1]
  const endMatch = sentinelId.match(endPattern)
  if (endMatch) return endMatch[1]
  return null
}

export function extractParallelIdFromSentinel(sentinelId: string): string | null {
  const startPattern = new RegExp(
    `^${PARALLEL.SENTINEL.PREFIX}(.+)${PARALLEL.SENTINEL.START_SUFFIX}$`
  )
  const endPattern = new RegExp(
    `^${PARALLEL.SENTINEL.PREFIX}(.+)${PARALLEL.SENTINEL.END_SUFFIX}$`
  )
  const startMatch = sentinelId.match(startPattern)
  if (startMatch) return startMatch[1]
  const endMatch = sentinelId.match(endPattern)
  if (endMatch) return endMatch[1]
  return null
}
