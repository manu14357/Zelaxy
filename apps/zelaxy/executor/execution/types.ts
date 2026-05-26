import type { BlockState, NormalizedBlockOutput } from '@/executor/types'
import type { LoopScope, ParallelScope } from '@/executor/execution/state'

/**
 * Serializable form of ExecutionState (for DB persistence / snapshots).
 */
export interface SerializableExecutionState {
  blockStates: Record<string, BlockState>
  executedBlocks: string[]
  loopScopes?: Record<string, SerializableLoopScope>
  parallelScopes?: Record<string, SerializableParallelScope>
}

export interface SerializableLoopScope {
  iteration: number
  allIterationOutputs: NormalizedBlockOutput[][]
  maxIterations?: number
  item?: any
  items?: any[]
  condition?: string
  loopType?: 'for' | 'forEach' | 'while' | 'doWhile'
  skipFirstConditionCheck?: boolean
  validationError?: string
}

export interface SerializableParallelScope {
  parallelId: string
  totalBranches: number
  batchSize?: number
  currentBatchStart?: number
  currentBatchSize?: number
  items?: any[]
  validationError?: string
  isEmpty?: boolean
}

export interface ParentIteration {
  loopId: string
  iteration: number
}

export interface IterationContext {
  loopId?: string
  iteration?: number
  parentIterations?: ParentIteration[]
  parallelId?: string
  branchIndex?: number
}

export interface WorkflowNodeMetadata {
  workflowId: string
  workflowName?: string
  depth: number
  parentWorkflowId?: string
}

export interface ChildWorkflowContext {
  workflowId: string
  executionId: string
  parentExecutionId: string
  depth: number
}

export interface ExecutionCallbacks {
  onBlockStart?: (blockId: string, blockType?: string) => void
  onBlockComplete?: (blockId: string, output: NormalizedBlockOutput) => void
  onBlockError?: (blockId: string, error: string) => void
  onLoopIteration?: (loopId: string, iteration: number, scope: LoopScope) => void
  onParallelBranch?: (parallelId: string, branchIndex: number) => void
  onWorkflowComplete?: (output: NormalizedBlockOutput) => void
}

export interface ContextExtensions {
  callbacks?: ExecutionCallbacks
  iterationContext?: IterationContext
  workflowNode?: WorkflowNodeMetadata
  childWorkflows?: ChildWorkflowContext[]
}

/**
 * Minimal read interface for block output lookup.
 */
export interface BlockStateReader {
  getBlockOutput(blockId: string, currentNodeId?: string): NormalizedBlockOutput | undefined
  hasExecuted(blockId: string): boolean
}

/**
 * Write interface for recording block results.
 */
export interface BlockStateWriter {
  setBlockOutput(blockId: string, output: NormalizedBlockOutput, executionTime?: number): void
  deleteBlockState(blockId: string): void
  unmarkExecuted(blockId: string): void
}
