import * as yaml from 'js-yaml'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { getAllBlocks } from '@/blocks/registry'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

const logger = createLogger('WorkflowYamlAPI')

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    logger.info(`[${requestId}] Converting workflow JSON to YAML`)

    const body = await request.json()
    const { workflowState, subBlockValues, includeMetadata = false, workflowName } = body

    if (!workflowState) {
      return NextResponse.json(
        { success: false, error: 'workflowState is required' },
        { status: 400 }
      )
    }

    // Convert workflow state to a clean format for YAML export
    const yamlData = convertWorkflowToYaml(
      workflowState,
      subBlockValues || {},
      includeMetadata,
      workflowName
    )

    // Convert to YAML string
    const yamlString = yaml.dump(yamlData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    })

    logger.info(`[${requestId}] Successfully generated YAML`, {
      yamlLength: yamlString.length,
    })

    return NextResponse.json({
      success: true,
      yaml: yamlString,
    })
  } catch (error) {
    logger.error(`[${requestId}] YAML generation failed`, error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * Convert workflow state to a clean YAML-exportable format
 */
function convertWorkflowToYaml(
  workflowState: WorkflowState,
  subBlockValues: Record<string, Record<string, any>>,
  includeMetadata: boolean,
  workflowName?: string
) {
  const blocks = getAllBlocks()
  const blockRegistry = blocks.reduce(
    (acc, block) => {
      acc[block.type] = block
      return acc
    },
    {} as Record<string, any>
  )

  const yamlBlocks: any[] = []
  const connections: any[] = []

  // Process blocks
  Object.entries(workflowState.blocks).forEach(([blockId, block]) => {
    const blockConfig = blockRegistry[block.type]

    const yamlBlock: any = {
      id: blockId,
      type: block.type,
      name: block.name || blockConfig?.name || block.type,
    }

    // Add position if including metadata
    if (includeMetadata && block.position) {
      yamlBlock.position = {
        x: block.position.x,
        y: block.position.y,
      }
    }

    // Add enabled state if disabled
    if (block.enabled === false) {
      yamlBlock.enabled = false
    }

    // Add subblock values if they exist
    const blockSubValues = subBlockValues[blockId]
    if (blockSubValues && Object.keys(blockSubValues).length > 0) {
      yamlBlock.config = blockSubValues
    }

    yamlBlocks.push(yamlBlock)
  })

  // Process edges/connections
  workflowState.edges.forEach((edge) => {
    const connection: any = {
      from: edge.source,
      to: edge.target,
    }

    // Add handle information if not default
    if (edge.sourceHandle && edge.sourceHandle !== 'default') {
      connection.fromHandle = edge.sourceHandle
    }
    if (edge.targetHandle && edge.targetHandle !== 'default') {
      connection.toHandle = edge.targetHandle
    }

    connections.push(connection)
  })

  const result: any = {
    version: '1.0',
    workflow: {
      name: workflowName || 'Untitled Workflow',
      blocks: yamlBlocks,
      connections: connections,
    },
  }

  // Add metadata if requested
  if (includeMetadata) {
    result.metadata = {
      exportedAt: new Date().toISOString(),
      blockCount: yamlBlocks.length,
      connectionCount: connections.length,
    }
  }

  return result
}
