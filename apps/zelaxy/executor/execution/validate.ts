import { BlockType } from '@/executor/consts'
import type { SerializedWorkflow } from '@/serializer/types'

/**
 * Validates that a workflow can be executed: a valid entry point (starter or the given trigger
 * block), no dangling connections, and well-formed loop configs. Throws on the first problem.
 */
export function validateWorkflow(workflow: SerializedWorkflow, startBlockId?: string): void {
  if (startBlockId) {
    const startBlock = workflow.blocks.find((block) => block.id === startBlockId)
    if (!startBlock || !startBlock.enabled) {
      throw new Error(`Start block ${startBlockId} not found or disabled`)
    }
  } else {
    const starterBlock = workflow.blocks.find((block) => block.metadata?.id === BlockType.STARTER)
    if (!starterBlock || !starterBlock.enabled) {
      throw new Error('Workflow must have an enabled starter block')
    }

    const incomingToStarter = workflow.connections.filter((conn) => conn.target === starterBlock.id)
    if (incomingToStarter.length > 0) {
      throw new Error('Starter block cannot have incoming connections')
    }

    const hasTriggerBlocks = workflow.blocks.some(
      (block) =>
        block.metadata?.category === 'triggers' || block.config?.params?.triggerMode === true
    )

    if (!hasTriggerBlocks) {
      const outgoingFromStarter = workflow.connections.filter(
        (conn) => conn.source === starterBlock.id
      )
      if (outgoingFromStarter.length === 0) {
        throw new Error('Starter block must have at least one outgoing connection')
      }
    }
  }

  const blockIds = new Set(workflow.blocks.map((block) => block.id))
  for (const conn of workflow.connections) {
    if (!blockIds.has(conn.source)) {
      throw new Error(`Connection references non-existent source block: ${conn.source}`)
    }
    if (!blockIds.has(conn.target)) {
      throw new Error(`Connection references non-existent target block: ${conn.target}`)
    }
  }

  for (const [loopId, loop] of Object.entries(workflow.loops || {})) {
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
