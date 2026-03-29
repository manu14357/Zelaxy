import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { getAllBlocks } from '@/blocks/registry'
import type { BlockConfig } from '@/blocks/types'
import { resolveOutputType } from '@/blocks/utils'
import { generateLoopBlocks, generateParallelBlocks } from '@/stores/workflows/workflow/utils'

const logger = createLogger('EditWorkflowAPI')

// Zelaxy Agent API configuration
const ZELAXY_AGENT_API_URL = env.ZELAXY_AGENT_API_URL
const ZELAXY_AGENT_API_KEY = env.ZELAXY_AGENT_API_KEY

// Types for operations
interface EditWorkflowOperation {
  operation_type: 'add' | 'edit' | 'delete'
  block_id: string
  params?: Record<string, any>
}

/**
 * Apply operations to YAML workflow
 * Uses local YAML parsing with js-yaml instead of external API
 */
async function applyOperationsToYaml(
  currentYaml: string,
  operations: EditWorkflowOperation[]
): Promise<string> {
  const { load: yamlLoad, dump: yamlDump } = await import('js-yaml')

  // Parse YAML locally
  const workflowData = yamlLoad(currentYaml) as any

  if (!workflowData || !workflowData.blocks) {
    throw new Error('Invalid YAML format: missing blocks')
  }

  // Apply operations to the parsed YAML data (preserving all existing fields)
  logger.info('Starting YAML operations', {
    initialBlockCount: Object.keys(workflowData.blocks).length,
    version: workflowData.version,
    operationCount: operations.length,
  })

  for (const operation of operations) {
    const { operation_type, block_id, params } = operation

    logger.info(`Processing operation: ${operation_type} for block ${block_id}`, { params })

    switch (operation_type) {
      case 'delete':
        if (workflowData.blocks[block_id]) {
          // First, find child blocks that reference this block as parent (before deleting the parent)
          const childBlocksToRemove: string[] = []
          Object.entries(workflowData.blocks).forEach(
            ([childBlockId, childBlock]: [string, any]) => {
              if (childBlock.parentId === block_id) {
                logger.info(
                  `Found child block ${childBlockId} with parentId ${block_id}, marking for deletion`
                )
                childBlocksToRemove.push(childBlockId)
              }
            }
          )

          // Delete the main block
          delete workflowData.blocks[block_id]
          logger.info(`Deleted block ${block_id}`)

          // Remove child blocks
          childBlocksToRemove.forEach((childBlockId) => {
            if (workflowData.blocks[childBlockId]) {
              delete workflowData.blocks[childBlockId]
              logger.info(`Deleted child block ${childBlockId}`)
            }
          })

          // Remove connections mentioning this block or any of its children
          const allDeletedBlocks = [block_id, ...childBlocksToRemove]
          Object.values(workflowData.blocks).forEach((block: any) => {
            if (block.connections) {
              Object.keys(block.connections).forEach((key) => {
                const connectionValue = block.connections[key]

                if (typeof connectionValue === 'string') {
                  // Simple format: connections: { default: "block2" }
                  if (allDeletedBlocks.includes(connectionValue)) {
                    delete block.connections[key]
                    logger.info(`Removed connection ${key} to deleted block ${connectionValue}`)
                  }
                } else if (Array.isArray(connectionValue)) {
                  // Array format: connections: { default: ["block2", "block3"] }
                  block.connections[key] = connectionValue.filter((item: any) => {
                    if (typeof item === 'string') {
                      return !allDeletedBlocks.includes(item)
                    }
                    if (typeof item === 'object' && item.block) {
                      return !allDeletedBlocks.includes(item.block)
                    }
                    return true
                  })

                  // If array is empty after filtering, remove the connection
                  if (block.connections[key].length === 0) {
                    delete block.connections[key]
                  }
                } else if (typeof connectionValue === 'object' && connectionValue.block) {
                  // Object format: connections: { success: { block: "block2", input: "data" } }
                  if (allDeletedBlocks.includes(connectionValue.block)) {
                    delete block.connections[key]
                    logger.info(
                      `Removed object connection ${key} to deleted block ${connectionValue.block}`
                    )
                  }
                }
              })
            }
          })
        } else {
          logger.warn(`Block ${block_id} not found for deletion`)
        }
        break

      case 'edit':
        if (workflowData.blocks[block_id]) {
          const block = workflowData.blocks[block_id]

          // Update inputs (preserve existing inputs, only overwrite specified ones)
          if (params?.inputs) {
            if (!block.inputs) block.inputs = {}
            Object.assign(block.inputs, params.inputs)
            logger.info(`Updated inputs for block ${block_id}`, { inputs: block.inputs })
          }

          // Update connections (preserve existing connections, only overwrite specified ones)
          if (params?.connections) {
            if (!block.connections) block.connections = {}

            // Handle edge removals - if a connection is explicitly set to null, remove it
            Object.entries(params.connections).forEach(([key, value]) => {
              if (value === null) {
                delete (block.connections as any)[key]
                logger.info(`Removed connection ${key} from block ${block_id}`)
              } else {
                ;(block.connections as any)[key] = value
              }
            })

            logger.info(`Updated connections for block ${block_id}`, {
              connections: block.connections,
            })
          }

          // Handle edge removals when specified in params
          if (params?.removeEdges && Array.isArray(params.removeEdges)) {
            params.removeEdges.forEach(
              (edgeToRemove: {
                targetBlockId: string
                sourceHandle?: string
                targetHandle?: string
              }) => {
                if (!block.connections) return

                const { targetBlockId, sourceHandle = 'default' } = edgeToRemove

                // Handle different connection formats
                const connectionValue = (block.connections as any)[sourceHandle]

                if (typeof connectionValue === 'string') {
                  // Simple format: connections: { default: "block2" }
                  if (connectionValue === targetBlockId) {
                    delete (block.connections as any)[sourceHandle]
                    logger.info(`Removed edge from ${block_id}:${sourceHandle} to ${targetBlockId}`)
                  }
                } else if (Array.isArray(connectionValue)) {
                  // Array format: connections: { default: ["block2", "block3"] }
                  ;(block.connections as any)[sourceHandle] = connectionValue.filter(
                    (item: any) => {
                      if (typeof item === 'string') {
                        return item !== targetBlockId
                      }
                      if (typeof item === 'object' && item.block) {
                        return item.block !== targetBlockId
                      }
                      return true
                    }
                  )

                  // If array is empty after filtering, remove the connection
                  if ((block.connections as any)[sourceHandle].length === 0) {
                    delete (block.connections as any)[sourceHandle]
                  }

                  logger.info(`Updated array connection for ${block_id}:${sourceHandle}`)
                } else if (typeof connectionValue === 'object' && connectionValue.block) {
                  // Object format: connections: { success: { block: "block2", input: "data" } }
                  if (connectionValue.block === targetBlockId) {
                    delete (block.connections as any)[sourceHandle]
                    logger.info(
                      `Removed object connection from ${block_id}:${sourceHandle} to ${targetBlockId}`
                    )
                  }
                }
              }
            )
          }
        } else {
          logger.warn(`Block ${block_id} not found for editing`)
        }
        break

      case 'add':
        if (params?.type && params?.name) {
          workflowData.blocks[block_id] = {
            type: params.type,
            name: params.name,
            inputs: params.inputs || {},
            connections: params.connections || {},
          }
          logger.info(`Added block ${block_id}`, { type: params.type, name: params.name })
        } else {
          logger.warn(`Invalid add operation for block ${block_id} - missing type or name`)
        }
        break

      default:
        logger.warn(`Unknown operation type: ${operation_type}`)
    }
  }

  logger.info('Completed YAML operations', {
    finalBlockCount: Object.keys(workflowData.blocks).length,
  })

  // Convert the complete workflow data back to YAML (preserving version and all other fields)
  return yamlDump(workflowData, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  })
}

import { eq } from 'drizzle-orm'
import { loadWorkflowFromNormalizedTables } from '@/lib/workflows/db-helpers'
import { db } from '@/db'
import { workflow as workflowTable } from '@/db/schema'
import { BaseCopilotTool } from '../base'

interface EditWorkflowParams {
  operations: EditWorkflowOperation[]
  workflowId: string
  currentUserWorkflow?: string // Optional current workflow JSON - if not provided, will fetch from DB
}

interface EditWorkflowResult {
  yamlContent: string
  workflowState?: any
  operations: Array<{ type: string; blockId: string }>
}

class EditWorkflowTool extends BaseCopilotTool<EditWorkflowParams, EditWorkflowResult> {
  readonly id = 'edit_workflow'
  readonly displayName = 'Updating workflow'

  protected async executeImpl(params: EditWorkflowParams): Promise<EditWorkflowResult> {
    return editWorkflow(params)
  }
}

// Export the tool instance
export const editWorkflowTool = new EditWorkflowTool()

/**
 * Get user workflow from database - backend function for edit workflow
 */
async function getUserWorkflow(workflowId: string): Promise<string> {
  logger.info('Fetching workflow from database', { workflowId })

  // Fetch workflow from database
  const [workflowRecord] = await db
    .select()
    .from(workflowTable)
    .where(eq(workflowTable.id, workflowId))
    .limit(1)

  if (!workflowRecord) {
    throw new Error(`Workflow ${workflowId} not found in database`)
  }

  // Try to load from normalized tables first, fallback to JSON blob
  let workflowState: any = null
  const subBlockValues: Record<string, Record<string, any>> = {}

  const normalizedData = await loadWorkflowFromNormalizedTables(workflowId)
  if (normalizedData) {
    workflowState = {
      blocks: normalizedData.blocks,
      edges: normalizedData.edges,
      loops: normalizedData.loops,
      parallels: normalizedData.parallels,
    }

    // Extract subblock values from normalized data
    Object.entries(normalizedData.blocks).forEach(([blockId, block]) => {
      subBlockValues[blockId] = {}
      Object.entries((block as any).subBlocks || {}).forEach(([subBlockId, subBlock]) => {
        if ((subBlock as any).value !== undefined) {
          subBlockValues[blockId][subBlockId] = (subBlock as any).value
        }
      })
    })
  } else if (workflowRecord.state) {
    // Fallback to JSON blob
    const jsonState = workflowRecord.state as any
    workflowState = {
      blocks: jsonState.blocks || {},
      edges: jsonState.edges || [],
      loops: jsonState.loops || {},
      parallels: jsonState.parallels || {},
    }
    // For JSON blob, subblock values are embedded in the block state
    Object.entries((workflowState.blocks as any) || {}).forEach(([blockId, block]) => {
      subBlockValues[blockId] = {}
      Object.entries((block as any).subBlocks || {}).forEach(([subBlockId, subBlock]) => {
        if ((subBlock as any).value !== undefined) {
          subBlockValues[blockId][subBlockId] = (subBlock as any).value
        }
      })
    })
  }

  if (!workflowState || !workflowState.blocks) {
    throw new Error('Workflow state is empty or invalid')
  }

  logger.info('Successfully fetched workflow from database', {
    workflowId,
    blockCount: Object.keys(workflowState.blocks).length,
  })

  // Return the raw JSON workflow state
  return JSON.stringify(workflowState, null, 2)
}

// Implementation function
async function editWorkflow(params: EditWorkflowParams): Promise<EditWorkflowResult> {
  const { operations, workflowId, currentUserWorkflow } = params

  logger.info('Processing targeted update request', {
    workflowId,
    operationCount: operations?.length || 0,
    hasCurrentUserWorkflow: !!currentUserWorkflow,
  })

  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    throw new Error(
      'No operations provided. Please specify an array of operations with operation_type and block_id.'
    )
  }

  if (!workflowId) {
    throw new Error('workflowId is required for editing workflows')
  }

  // Get current workflow state - use provided currentUserWorkflow or fetch from DB
  let workflowStateJson: string

  if (currentUserWorkflow) {
    logger.info('Using provided currentUserWorkflow for edits', {
      workflowId,
      jsonLength: currentUserWorkflow.length,
    })
    workflowStateJson = currentUserWorkflow
  } else {
    logger.info('No currentUserWorkflow provided, fetching from database', {
      workflowId,
    })
    workflowStateJson = await getUserWorkflow(workflowId)
  }

  logger.info('Retrieved current workflow state', {
    jsonLength: workflowStateJson.length,
    jsonPreview: workflowStateJson.substring(0, 200),
  })

  // Parse the JSON to get the workflow state object
  const workflowState = JSON.parse(workflowStateJson)

  // Ensure workflow state has all required properties with proper defaults
  if (!workflowState.loops) workflowState.loops = {}
  if (!workflowState.parallels) workflowState.parallels = {}
  if (!workflowState.edges) workflowState.edges = []
  if (!workflowState.blocks) workflowState.blocks = {}

  // Try Agent API first, fall back to local implementation
  if (ZELAXY_AGENT_API_URL) {
    try {
      return await editWorkflowViaAgentApi(workflowState, operations, workflowId)
    } catch (agentError) {
      logger.warn('Agent API failed for edit_workflow, falling back to local implementation', {
        error: agentError instanceof Error ? agentError.message : 'Unknown error',
      })
    }
  }

  // Local implementation: apply operations directly to workflow state
  return editWorkflowLocal(workflowState, operations, workflowId)
}

/**
 * Local implementation of edit workflow - applies operations directly to workflow state
 */
async function editWorkflowLocal(
  workflowState: any,
  operations: EditWorkflowOperation[],
  workflowId: string
): Promise<EditWorkflowResult> {
  logger.info('Editing workflow locally (no external API)', {
    workflowId,
    operationCount: operations.length,
    blockCount: Object.keys(workflowState.blocks).length,
  })

  // Build a simplified representation for operations
  const blockRegistry = new Map(getAllBlocks().map((block) => [block.type, block]))

  for (const operation of operations) {
    const { operation_type, block_id, params } = operation
    logger.info(`Processing operation: ${operation_type} for block ${block_id}`, { params })

    switch (operation_type) {
      case 'delete': {
        if (workflowState.blocks[block_id]) {
          // Find and remove child blocks
          const childBlocksToRemove: string[] = []
          Object.entries(workflowState.blocks).forEach(
            ([childBlockId, childBlock]: [string, any]) => {
              if (childBlock.parentId === block_id) {
                childBlocksToRemove.push(childBlockId)
              }
            }
          )

          // Delete the main block and its children
          delete workflowState.blocks[block_id]
          childBlocksToRemove.forEach((childId) => {
            delete workflowState.blocks[childId]
          })

          // Remove edges referencing deleted blocks
          const allDeletedBlocks = [block_id, ...childBlocksToRemove]
          workflowState.edges = (workflowState.edges || []).filter(
            (edge: any) =>
              !allDeletedBlocks.includes(edge.source) && !allDeletedBlocks.includes(edge.target)
          )

          // Clean up loops and parallels
          allDeletedBlocks.forEach((id) => {
            delete workflowState.loops?.[id]
            delete workflowState.parallels?.[id]
          })

          logger.info(`Deleted block ${block_id} and ${childBlocksToRemove.length} children`)
        } else {
          logger.warn(`Block ${block_id} not found for deletion`)
        }
        break
      }

      case 'edit': {
        const block = workflowState.blocks[block_id]
        if (block) {
          // Update subBlocks/inputs
          if (params?.inputs) {
            if (!block.subBlocks) block.subBlocks = {}
            const blockConfig = blockRegistry.get(block.type)

            for (const [inputKey, inputValue] of Object.entries(params.inputs)) {
              // Find the subblock config to get the correct type
              const subBlockConfig = blockConfig?.subBlocks?.find((sb: any) => sb.id === inputKey)
              const subBlockType = subBlockConfig?.type || 'short-input'

              block.subBlocks[inputKey] = {
                id: inputKey,
                type: subBlockType,
                value: inputValue,
              }
            }
            logger.info(`Updated inputs for block ${block_id}`)
          }

          // Update name
          if (params?.name) {
            block.name = params.name
            logger.info(`Updated name for block ${block_id} to ${params.name}`)
          }

          // Update connections (add/modify edges)
          if (params?.connections) {
            // Remove existing edges from this block
            workflowState.edges = (workflowState.edges || []).filter(
              (edge: any) => edge.source !== block_id
            )

            // Add new edges based on connections
            if (params.connections.outgoing) {
              for (const conn of params.connections.outgoing) {
                const targetId = typeof conn === 'string' ? conn : conn.target
                workflowState.edges.push({
                  id: `edge-${block_id}-${targetId}-${Date.now()}`,
                  source: block_id,
                  target: targetId,
                  sourceHandle: conn.sourceHandle || 'source',
                  targetHandle: conn.targetHandle || 'target',
                })
              }
            }
            logger.info(`Updated connections for block ${block_id}`)
          }
        } else {
          logger.warn(`Block ${block_id} not found for editing`)
        }
        break
      }

      case 'add': {
        if (params?.type && params?.name) {
          const blockConfig = blockRegistry.get(params.type)

          // Build subBlocks from inputs
          const subBlocks: Record<string, any> = {}
          if (params.inputs) {
            for (const [inputKey, inputValue] of Object.entries(params.inputs)) {
              const subBlockConfig = blockConfig?.subBlocks?.find((sb: any) => sb.id === inputKey)
              subBlocks[inputKey] = {
                id: inputKey,
                type: subBlockConfig?.type || 'short-input',
                value: inputValue,
              }
            }
          }

          // Position the new block
          const existingBlocks = Object.values(workflowState.blocks)
          const maxY = existingBlocks.reduce(
            (max: number, b: any) => Math.max(max, b.position?.y || 0),
            0
          )

          workflowState.blocks[block_id] = {
            id: block_id,
            type: params.type,
            name: params.name,
            position: params.position || { x: 100, y: maxY + 200 },
            subBlocks,
            enabled: true,
            outputs: {},
            horizontalHandles: true,
            isWide: false,
            height: 90,
            data: {},
          }

          // Add connections if specified
          if (params.connections?.outgoing) {
            for (const conn of params.connections.outgoing) {
              const targetId = typeof conn === 'string' ? conn : conn.target
              workflowState.edges.push({
                id: `edge-${block_id}-${targetId}-${Date.now()}`,
                source: block_id,
                target: targetId,
                sourceHandle: conn.sourceHandle || 'source',
                targetHandle: conn.targetHandle || 'target',
              })
            }
          }

          logger.info(`Added block ${block_id} (type: ${params.type})`)
        } else {
          logger.warn(`Invalid add operation for block ${block_id} - missing type or name`)
        }
        break
      }

      default:
        logger.warn(`Unknown operation type: ${operation_type}`)
    }
  }

  logger.info('Completed local edit operations', {
    finalBlockCount: Object.keys(workflowState.blocks).length,
    finalEdgeCount: workflowState.edges?.length || 0,
  })

  // Build a modified YAML from the updated state using js-yaml
  const { dump: yamlDump } = await import('js-yaml')

  // Build a simplified YAML-compatible structure
  const yamlData: any = {
    version: '1.0',
    blocks: {} as Record<string, any>,
  }

  for (const [blockId, block] of Object.entries(workflowState.blocks)) {
    const b = block as any
    const yamlBlock: any = {
      type: b.type,
      name: b.name,
    }

    // Convert subBlocks back to flat inputs
    if (b.subBlocks) {
      const inputs: Record<string, any> = {}
      for (const [subId, sub] of Object.entries(b.subBlocks)) {
        const s = sub as any
        if (s.value !== undefined && s.value !== '' && s.value !== null) {
          inputs[subId] = s.value
        }
      }
      if (Object.keys(inputs).length > 0) {
        yamlBlock.inputs = inputs
      }
    }

    // Add connections from edges
    const outgoingEdges = (workflowState.edges || []).filter((edge: any) => edge.source === blockId)
    if (outgoingEdges.length > 0) {
      yamlBlock.connections = {
        outgoing: outgoingEdges.map((edge: any) => ({ target: edge.target })),
      }
    }

    yamlData.blocks[blockId] = yamlBlock
  }

  const modifiedYaml = yamlDump(yamlData, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  })

  return {
    yamlContent: modifiedYaml,
    workflowState,
    operations: operations.map((op) => ({ type: op.operation_type, blockId: op.block_id })),
  }
}

/**
 * Edit workflow via external Agent API (original implementation)
 */
async function editWorkflowViaAgentApi(
  workflowState: any,
  operations: EditWorkflowOperation[],
  workflowId: string
): Promise<EditWorkflowResult> {
  // Extract subblock values
  const subBlockValues: Record<string, Record<string, any>> = {}
  Object.entries(workflowState.blocks || {}).forEach(([blockId, block]) => {
    subBlockValues[blockId] = {}
    Object.entries((block as any).subBlocks || {}).forEach(([subBlockId, subBlock]) => {
      if ((subBlock as any).value !== undefined) {
        subBlockValues[blockId][subBlockId] = (subBlock as any).value
      }
    })
  })

  const blocks = getAllBlocks()
  const blockRegistry = blocks.reduce(
    (acc, block) => {
      const blockType = block.type
      acc[blockType] = {
        ...block,
        id: blockType,
        subBlocks: block.subBlocks || [],
        outputs: block.outputs || {},
      } as any
      return acc
    },
    {} as Record<string, BlockConfig>
  )

  // Convert to YAML using zelaxy-agent
  const yamlResponse = await fetch(`${ZELAXY_AGENT_API_URL}/api/workflow/to-yaml`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ZELAXY_AGENT_API_KEY && { 'x-api-key': ZELAXY_AGENT_API_KEY }),
    },
    body: JSON.stringify({
      workflowState,
      subBlockValues,
      blockRegistry,
      utilities: {
        generateLoopBlocks: generateLoopBlocks.toString(),
        generateParallelBlocks: generateParallelBlocks.toString(),
        resolveOutputType: resolveOutputType.toString(),
      },
    }),
  })

  if (!yamlResponse.ok) {
    throw new Error(`Zelaxy agent API error: ${yamlResponse.statusText}`)
  }

  const yamlResult = await yamlResponse.json()

  if (!yamlResult.success || !yamlResult.yaml) {
    throw new Error(yamlResult.error || 'Failed to generate YAML')
  }

  const currentYaml = yamlResult.yaml

  if (!currentYaml || currentYaml.trim() === '') {
    throw new Error('Generated YAML is empty')
  }

  // Apply operations to generate modified YAML
  const modifiedYaml = await applyOperationsToYaml(currentYaml, operations)

  logger.info('Applied operations to YAML via Agent API', {
    operationCount: operations.length,
  })

  return {
    yamlContent: modifiedYaml,
    operations: operations.map((op) => ({ type: op.operation_type, blockId: op.block_id })),
  }
}
