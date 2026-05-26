import { createLogger } from '@/lib/logs/console/logger'
import { EdgeConstructor } from '@/executor/dag/construction/edges'
import { LoopConstructor } from '@/executor/dag/construction/loops'
import { NodeConstructor } from '@/executor/dag/construction/nodes'
import { ParallelConstructor } from '@/executor/dag/construction/parallels'
import { PathConstructor } from '@/executor/dag/construction/paths'
import type { DAG, DAGBuildOptions, DAGNode, DAGEdge, NodeMetadata } from '@/executor/dag/types'
import {
  buildParallelSentinelStartId,
  buildSentinelStartId,
  normalizeNodeId,
} from '@/executor/utils/subflow-utils'
import type { SerializedWorkflow } from '@/serializer/types'

export type { DAG, DAGNode, DAGEdge, NodeMetadata, DAGBuildOptions }

const logger = createLogger('DAGBuilder')

export class DAGBuilder {
  private pathConstructor = new PathConstructor()
  private loopConstructor = new LoopConstructor()
  private parallelConstructor = new ParallelConstructor()
  private nodeConstructor = new NodeConstructor()
  private edgeConstructor = new EdgeConstructor()

  build(workflow: SerializedWorkflow, options: DAGBuildOptions = {}): DAG {
    const { triggerBlockId, savedIncomingEdges, includeAllBlocks } = options

    const dag: DAG = {
      nodes: new Map(),
      loopConfigs: new Map(),
      parallelConfigs: new Map(),
    }

    this.initializeConfigs(workflow, dag)

    const reachableBlocks = this.pathConstructor.execute(workflow, triggerBlockId, includeAllBlocks)

    this.loopConstructor.execute(dag, reachableBlocks)
    this.parallelConstructor.execute(dag, reachableBlocks)

    const { blocksInLoops, blocksInParallels, pauseTriggerMapping } = this.nodeConstructor.execute(
      workflow,
      dag,
      reachableBlocks
    )

    this.edgeConstructor.execute(
      workflow,
      dag,
      blocksInParallels,
      blocksInLoops,
      reachableBlocks,
      pauseTriggerMapping
    )

    if (savedIncomingEdges) {
      logger.info('Restoring DAG incoming edges from snapshot', {
        nodeCount: Object.keys(savedIncomingEdges).length,
      })

      for (const [nodeId, incomingEdgeArray] of Object.entries(savedIncomingEdges)) {
        const node = dag.nodes.get(nodeId)
        if (node) {
          node.incomingEdges = new Set(incomingEdgeArray)
        }
      }
    }

    this.validateSubflowStructure(dag)

    logger.info('DAG built', {
      totalNodes: dag.nodes.size,
      loopCount: dag.loopConfigs.size,
      parallelCount: dag.parallelConfigs.size,
    })

    return dag
  }

  private initializeConfigs(workflow: SerializedWorkflow, dag: DAG): void {
    if (workflow.loops) {
      for (const [loopId, loopConfig] of Object.entries(workflow.loops)) {
        dag.loopConfigs.set(loopId, {
          ...loopConfig,
          nodes: [...(loopConfig.nodes ?? [])],
        })
      }
    }

    if (workflow.parallels) {
      for (const [parallelId, parallelConfig] of Object.entries(workflow.parallels)) {
        dag.parallelConfigs.set(parallelId, {
          ...parallelConfig,
          nodes: [...(parallelConfig.nodes ?? [])],
        })
      }
    }
  }

  private validateSubflowStructure(dag: DAG): void {
    for (const [id, config] of dag.loopConfigs) {
      this.validateSubflow(dag, id, config.nodes, 'Loop')
    }
    for (const [id, config] of dag.parallelConfigs) {
      this.validateSubflow(dag, id, config.nodes, 'Parallel')
    }
  }

  private validateSubflow(
    dag: DAG,
    id: string,
    nodes: string[] | undefined,
    type: 'Loop' | 'Parallel'
  ): void {
    const sentinelStartId =
      type === 'Loop' ? buildSentinelStartId(id) : buildParallelSentinelStartId(id)
    const sentinelStartNode = dag.nodes.get(sentinelStartId)

    if (!sentinelStartNode) return
    if (!nodes || nodes.length === 0) return

    const hasConnections = Array.from(sentinelStartNode.outgoingEdges.values()).some((edge) =>
      nodes.includes(normalizeNodeId(edge.target))
    )

    if (!hasConnections) {
      throw new Error(
        `${type} start is not connected to any blocks. Connect a block to the ${type.toLowerCase()} start.`
      )
    }
  }
}
