import type { SentinelType } from '@/executor/consts'
import type { SerializedBlock, SerializedLoop, SerializedParallel } from '@/serializer/types'

export interface DAGEdge {
  target: string
  sourceHandle?: string
  targetHandle?: string
  isActive?: boolean
}

export interface NodeMetadata {
  // Parallel branch metadata
  isParallelBranch?: boolean
  isParallelSentinel?: boolean
  parallelId?: string
  branchIndex?: number
  branchTotal?: number
  distributionItem?: any

  // Loop metadata
  isLoopNode?: boolean
  loopId?: string

  // Sentinel metadata
  isSentinel?: boolean
  sentinelType?: SentinelType

  // Pause/resume metadata
  isPauseResponse?: boolean
  isResumeTrigger?: boolean
  originalBlockId?: string
}

export interface DAGNode {
  id: string
  block: SerializedBlock
  incomingEdges: Set<string>
  outgoingEdges: Map<string, DAGEdge>
  metadata: NodeMetadata
}

export interface DAG {
  nodes: Map<string, DAGNode>
  loopConfigs: Map<string, SerializedLoop>
  parallelConfigs: Map<string, SerializedParallel>
}

export interface DAGBuildOptions {
  /** Trigger block ID to start path construction from */
  triggerBlockId?: string
  /** Saved incoming edges from snapshot for resumption */
  savedIncomingEdges?: Record<string, string[]>
  /** Include all enabled blocks instead of only those reachable from trigger */
  includeAllBlocks?: boolean
}
