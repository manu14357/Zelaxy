import { createLogger } from '@/lib/logs/console/logger'
import { BlockType, isMetadataOnlyBlockType, isTriggerBlockType } from '@/executor/consts'
import { extractBaseBlockId } from '@/executor/utils/subflow-utils'
import type { SerializedBlock, SerializedWorkflow } from '@/serializer/types'

const logger = createLogger('PathConstructor')

export class PathConstructor {
  execute(
    workflow: SerializedWorkflow,
    triggerBlockId?: string,
    includeAllBlocks?: boolean
  ): Set<string> {
    if (includeAllBlocks) {
      return this.getAllEnabledBlocks(workflow)
    }

    const resolvedTriggerId = this.findTriggerBlock(workflow, triggerBlockId)

    if (!resolvedTriggerId) {
      logger.warn('No trigger block found, including all enabled blocks as fallback')
      return this.getAllEnabledBlocks(workflow)
    }

    const adjacency = this.buildAdjacencyMap(workflow)
    return this.performBFS(resolvedTriggerId, adjacency)
  }

  private findTriggerBlock(
    workflow: SerializedWorkflow,
    triggerBlockId?: string
  ): string | undefined {
    if (triggerBlockId) {
      const block = workflow.blocks.find((b) => b.id === triggerBlockId)

      if (block) {
        if (!block.enabled) {
          logger.error('Provided triggerBlockId is disabled, finding alternative', {
            triggerBlockId,
          })
          const alternativeTrigger = this.findExplicitTrigger(workflow)
          if (alternativeTrigger) {
            return alternativeTrigger
          }
          throw new Error(
            `Trigger block ${triggerBlockId} is disabled and no alternative enabled trigger found`
          )
        }
        return triggerBlockId
      }

      const fallbackTriggerId = this.resolveResumeTriggerFallback(triggerBlockId, workflow)
      if (fallbackTriggerId) {
        return fallbackTriggerId
      }

      throw new Error(`Trigger block not found: ${triggerBlockId}`)
    }

    // Manual run (no explicit trigger id): a workflow can have schedule/webhook triggers alongside
    // a manual starter. The Run button starts from the starter, so prefer it over other triggers
    // regardless of block order — matching the legacy executor's manual-run entry point.
    const starter = workflow.blocks.find((b) => b.enabled && b.metadata?.id === BlockType.STARTER)
    if (starter) return starter.id

    const explicitTrigger = this.findExplicitTrigger(workflow)
    if (explicitTrigger) return explicitTrigger

    return this.findRootBlock(workflow)
  }

  private findExplicitTrigger(workflow: SerializedWorkflow): string | undefined {
    for (const block of workflow.blocks) {
      if (block.enabled && this.isTriggerBlock(block)) {
        return block.id
      }
    }
    return undefined
  }

  private findRootBlock(workflow: SerializedWorkflow): string | undefined {
    const hasIncoming = new Set(workflow.connections.map((c) => c.target))
    for (const block of workflow.blocks) {
      if (
        !hasIncoming.has(block.id) &&
        block.enabled &&
        !isMetadataOnlyBlockType(block.metadata?.id)
      ) {
        return block.id
      }
    }
    return undefined
  }

  private isTriggerBlock(block: SerializedBlock): boolean {
    return isTriggerBlockType(block.metadata?.id)
  }

  private getAllEnabledBlocks(workflow: SerializedWorkflow): Set<string> {
    return new Set(workflow.blocks.filter((b) => b.enabled).map((b) => b.id))
  }

  private buildAdjacencyMap(workflow: SerializedWorkflow): Map<string, string[]> {
    const adjacency = new Map<string, string[]>()
    const enabledBlocks = new Set(workflow.blocks.filter((b) => b.enabled).map((b) => b.id))

    for (const connection of workflow.connections) {
      if (!enabledBlocks.has(connection.source) || !enabledBlocks.has(connection.target)) {
        continue
      }
      const neighbors = adjacency.get(connection.source) ?? []
      neighbors.push(connection.target)
      adjacency.set(connection.source, neighbors)
    }

    return adjacency
  }

  private performBFS(triggerBlockId: string, adjacency: Map<string, string[]>): Set<string> {
    const reachable = new Set<string>([triggerBlockId])
    const queue = [triggerBlockId]

    while (queue.length > 0) {
      const currentBlockId = queue.shift()
      if (!currentBlockId) break

      const neighbors = adjacency.get(currentBlockId) ?? []
      for (const neighborId of neighbors) {
        if (!reachable.has(neighborId)) {
          reachable.add(neighborId)
          queue.push(neighborId)
        }
      }
    }

    return reachable
  }

  private resolveResumeTriggerFallback(
    triggerBlockId: string,
    workflow: SerializedWorkflow
  ): string | undefined {
    if (!triggerBlockId.endsWith('__trigger')) {
      return undefined
    }

    const baseId = triggerBlockId.replace(/__trigger$/, '')
    const normalizedBaseId = extractBaseBlockId(baseId)
    const candidates = baseId === normalizedBaseId ? [baseId] : [baseId, normalizedBaseId]

    for (const candidate of candidates) {
      const block = workflow.blocks.find((b) => b.id === candidate)
      if (block) return candidate
    }

    return undefined
  }
}
