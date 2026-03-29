import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import { getAllBlocks } from '@/blocks/registry'
import type { BlockConfig, SubBlockConfig } from '@/blocks/types'
import { resolveOutputType } from '@/blocks/utils'
import {
  convertLoopBlockToLoop,
  convertParallelBlockToParallel,
  findAllDescendantNodes,
  findChildNodes,
  generateLoopBlocks,
  generateParallelBlocks,
} from '@/stores/workflows/workflow/utils'
import { convertYamlToWorkflow, parseWorkflowYaml } from '@/stores/workflows/yaml/importer'

const logger = createLogger('YamlDiffCreateAPI')

// Zelaxy Agent API configuration - now optional (empty string = use local)
const ZELAXY_AGENT_API_URL = process.env.ZELAXY_AGENT_API_URL || ''
const ZELAXY_AGENT_API_KEY = process.env.ZELAXY_AGENT_API_KEY

// Build block registry for subBlock conversion
function getBlockRegistry(): Map<string, BlockConfig> {
  const blocks = getAllBlocks()
  return new Map(blocks.map((block) => [block.type, block]))
}

/**
 * Convert flat inputs to proper subBlocks format
 * Input: { prompt: "text", model: "gpt-4o" }
 * Output: { prompt: { id: "prompt", type: "long-input", value: "text" }, model: { id: "model", type: "combobox", value: "gpt-4o" } }
 */
function convertInputsToSubBlocks(
  blockType: string,
  inputs: Record<string, any>,
  blockRegistry: Map<string, BlockConfig>
): Record<string, { id: string; type: string; value: any }> {
  const subBlocks: Record<string, { id: string; type: string; value: any }> = {}

  if (!inputs || typeof inputs !== 'object') {
    return subBlocks
  }

  const blockConfig = blockRegistry.get(blockType)
  const subBlockConfigs = blockConfig?.subBlocks || []

  // Create a map of subBlock id to config
  const subBlockConfigMap = new Map<string, SubBlockConfig>()
  for (const config of subBlockConfigs) {
    subBlockConfigMap.set(config.id, config)
  }

  for (const [inputKey, inputValue] of Object.entries(inputs)) {
    const config = subBlockConfigMap.get(inputKey)

    // Determine the type - use config type if available, otherwise infer from value
    let subBlockType = config?.type || 'short-input'

    // Extract the actual value - handle nested object format from YAML
    // YAML might have: { type: "webhook" } or { value: "something" } when it should be just the value
    let actualValue = inputValue
    if (inputValue && typeof inputValue === 'object' && !Array.isArray(inputValue)) {
      // Check if this is a simple wrapper object that should be unwrapped
      const keys = Object.keys(inputValue)
      if (keys.length === 1 && keys[0] === 'type') {
        // Handle { type: "value" } format - common from YAML generation
        actualValue = inputValue.type
      } else if (keys.length === 1 && keys[0] === 'value') {
        // Handle { value: "something" } format
        actualValue = inputValue.value
      }
      // Otherwise keep the object as-is (for complex inputs)
    }

    // Special handling for common input types when config is not known
    if (!config) {
      if (typeof actualValue === 'string' && actualValue.length > 100) {
        subBlockType = 'long-input'
      } else if (typeof actualValue === 'boolean') {
        subBlockType = 'switch'
      } else if (typeof actualValue === 'number') {
        subBlockType = 'slider'
      } else if (Array.isArray(actualValue)) {
        subBlockType = 'tool-input'
      }
    }

    subBlocks[inputKey] = {
      id: inputKey,
      type: subBlockType,
      value: actualValue,
    }
  }

  return subBlocks
}

const CreateDiffRequestSchema = z.object({
  yamlContent: z.string().min(1),
  diffAnalysis: z
    .object({
      new_blocks: z.array(z.string()),
      edited_blocks: z.array(z.string()),
      deleted_blocks: z.array(z.string()),
      field_diffs: z
        .record(
          z.object({
            changed_fields: z.array(z.string()),
            unchanged_fields: z.array(z.string()),
          })
        )
        .optional(),
      edge_diff: z
        .object({
          new_edges: z.array(z.string()),
          deleted_edges: z.array(z.string()),
          unchanged_edges: z.array(z.string()),
        })
        .optional(),
    })
    .optional(),
  options: z
    .object({
      applyAutoLayout: z.boolean().optional(),
      layoutOptions: z.any().optional(),
    })
    .optional(),
  currentWorkflowState: z
    .object({
      blocks: z.record(z.any()),
      edges: z.array(z.any()),
      loops: z.record(z.any()).optional(),
      parallels: z.record(z.any()).optional(),
    })
    .optional(),
})

/**
 * Create diff locally using the YAML importer
 * This doesn't require the external agent API
 */
async function createDiffLocal(
  yamlContent: string,
  currentWorkflowState: any,
  diffAnalysis?: any,
  options?: any
): Promise<{ success: boolean; diff?: any; errors?: string[] }> {
  const logger = createLogger('YamlDiffCreateLocal')

  logger.info('Creating diff locally (no external API)', {
    yamlLength: yamlContent.length,
    hasCurrentState: !!currentWorkflowState,
    currentBlockCount: currentWorkflowState
      ? Object.keys(currentWorkflowState.blocks || {}).length
      : 0,
  })

  // Parse the YAML content
  const { data: parsedYaml, errors: parseErrors } = parseWorkflowYaml(yamlContent)

  if (parseErrors.length > 0 || !parsedYaml) {
    logger.error('YAML parsing failed', { errors: parseErrors })
    return {
      success: false,
      errors: parseErrors.length > 0 ? parseErrors : ['Failed to parse YAML'],
    }
  }

  // Convert to workflow format
  const { blocks, edges, errors, warnings } = convertYamlToWorkflow(parsedYaml)

  if (errors.length > 0) {
    logger.error('YAML conversion failed', { errors, warnings })
    return {
      success: false,
      errors: errors,
    }
  }

  if (warnings.length > 0) {
    logger.warn('YAML conversion completed with warnings', { warnings })
  }

  // Build block registry for subBlock type lookups
  const blockRegistry = getBlockRegistry()

  // Create proposed workflow state
  const proposedState = {
    blocks: {} as Record<string, any>,
    edges: [] as any[],
    loops: {} as Record<string, any>,
    parallels: {} as Record<string, any>,
  }

  // Process blocks with proper IDs
  const blockIdMapping = new Map<string, string>()

  blocks.forEach((block) => {
    const blockId = `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    blockIdMapping.set(block.id, blockId)
  })

  // Add blocks to proposed state
  for (const block of blocks) {
    const newBlockId = blockIdMapping.get(block.id)!

    // Convert flat inputs to proper subBlocks format
    const subBlocks = convertInputsToSubBlocks(block.type, block.inputs || {}, blockRegistry)

    proposedState.blocks[newBlockId] = {
      id: newBlockId,
      type: block.type,
      name: block.name,
      position: block.position || { x: 100, y: 100 },
      subBlocks,
      enabled: true,
      outputs: {},
      horizontalHandles: true,
      isWide: false,
      height: 90,
      data: {},
      ...(block.data || {}),
      ...(block.parentId && {
        parentId: blockIdMapping.get(block.parentId) || block.parentId,
        extent: block.extent,
      }),
    }

    // Handle loop/parallel containers
    if (block.type === 'loop') {
      proposedState.loops[newBlockId] = {
        id: newBlockId,
        nodes: [],
        ...(block.data || {}),
      }
    } else if (block.type === 'parallel') {
      proposedState.parallels[newBlockId] = {
        id: newBlockId,
        nodes: [],
        ...(block.data || {}),
      }
    }
  }

  // Process edges with updated block IDs
  proposedState.edges = edges.map((edge) => ({
    id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    source: blockIdMapping.get(edge.source) || edge.source,
    target: blockIdMapping.get(edge.target) || edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }))

  // Generate diff analysis by comparing current vs proposed
  const currentBlockIds = currentWorkflowState?.blocks
    ? Object.keys(currentWorkflowState.blocks)
    : []
  const proposedBlockIds = Object.keys(proposedState.blocks)

  // Simple diff analysis: all proposed blocks are new, all current blocks are deleted
  const generatedDiffAnalysis = diffAnalysis || {
    new_blocks: proposedBlockIds,
    edited_blocks: [],
    deleted_blocks: currentBlockIds,
    field_diffs: {},
    edge_diff: {
      new_edges: proposedState.edges.map((e: any) => e.id),
      deleted_edges: currentWorkflowState?.edges?.map((e: any) => e.id) || [],
      unchanged_edges: [],
    },
  }

  logger.info('Diff created locally successfully', {
    blocksCount: proposedBlockIds.length,
    edgesCount: proposedState.edges.length,
    newBlocks: generatedDiffAnalysis.new_blocks.length,
    deletedBlocks: generatedDiffAnalysis.deleted_blocks.length,
  })

  return {
    success: true,
    diff: {
      proposedState,
      diffAnalysis: generatedDiffAnalysis,
      metadata: {
        source: 'local-importer',
        timestamp: Date.now(),
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    },
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const body = await request.json()
    const { yamlContent, diffAnalysis, options } = CreateDiffRequestSchema.parse(body)

    // Get current workflow state for comparison
    // Note: This endpoint is stateless, so we need to get this from the request
    const currentWorkflowState = (body as any).currentWorkflowState

    // Ensure currentWorkflowState has all required properties with proper defaults if provided
    if (currentWorkflowState) {
      if (!currentWorkflowState.loops) {
        currentWorkflowState.loops = {}
      }
      if (!currentWorkflowState.parallels) {
        currentWorkflowState.parallels = {}
      }
    }

    logger.info(`[${requestId}] Creating diff from YAML`, {
      contentLength: yamlContent.length,
      hasDiffAnalysis: !!diffAnalysis,
      hasOptions: !!options,
      options: options,
      hasApiKey: !!ZELAXY_AGENT_API_KEY,
      hasAgentApiUrl: !!ZELAXY_AGENT_API_URL,
      hasCurrentWorkflowState: !!currentWorkflowState,
      currentBlockCount: currentWorkflowState
        ? Object.keys(currentWorkflowState.blocks || {}).length
        : 0,
    })

    // Try LOCAL conversion first (or if no external API URL is configured)
    if (!ZELAXY_AGENT_API_URL) {
      logger.info(`[${requestId}] Using local YAML converter (no agent API configured)`)
      const localResult = await createDiffLocal(
        yamlContent,
        currentWorkflowState,
        diffAnalysis,
        options
      )
      return NextResponse.json(localResult)
    }

    // Try external agent API
    try {
      // Gather block registry
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

      // Call zelaxy-agent API
      const response = await fetch(`${ZELAXY_AGENT_API_URL}/api/yaml/diff/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ZELAXY_AGENT_API_KEY && { 'x-api-key': ZELAXY_AGENT_API_KEY }),
        },
        body: JSON.stringify({
          yamlContent,
          diffAnalysis,
          blockRegistry,
          currentWorkflowState, // Pass current state for comparison

          utilities: {
            generateLoopBlocks: generateLoopBlocks.toString(),
            generateParallelBlocks: generateParallelBlocks.toString(),
            resolveOutputType: resolveOutputType.toString(),
            convertLoopBlockToLoop: convertLoopBlockToLoop.toString(),
            convertParallelBlockToParallel: convertParallelBlockToParallel.toString(),
            findChildNodes: findChildNodes.toString(),
            findAllDescendantNodes: findAllDescendantNodes.toString(),
          },
          options,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`[${requestId}] Zelaxy agent API error, falling back to local:`, {
          status: response.status,
          error: errorText,
        })
        // Fall back to local conversion
        const localResult = await createDiffLocal(
          yamlContent,
          currentWorkflowState,
          diffAnalysis,
          options
        )
        return NextResponse.json(localResult)
      }

      const result = await response.json()

      // Log the full response to see if auto-layout is happening
      logger.info(`[${requestId}] Full zelaxy agent response:`, JSON.stringify(result, null, 2))

      // Log diff analysis specifically
      if (result.diff?.diffAnalysis) {
        logger.info(`[${requestId}] Diff analysis received:`, {
          new_blocks: result.diff.diffAnalysis.new_blocks || [],
          edited_blocks: result.diff.diffAnalysis.edited_blocks || [],
          deleted_blocks: result.diff.diffAnalysis.deleted_blocks || [],
          has_field_diffs: !!result.diff.diffAnalysis.field_diffs,
          has_edge_diff: !!result.diff.diffAnalysis.edge_diff,
        })
      } else {
        logger.warn(`[${requestId}] No diff analysis in response!`)
      }

      // If the zelaxy agent returned blocks directly (when auto-layout is applied),
      // transform it to the expected diff format
      if (result.success && result.blocks && !result.diff) {
        logger.info(`[${requestId}] Transforming zelaxy agent blocks response to diff format`)

        const transformedResult = {
          success: result.success,
          diff: {
            proposedState: {
              blocks: result.blocks,
              edges: result.edges || [],
              loops: result.loops || {},
              parallels: result.parallels || {},
            },
            diffAnalysis: diffAnalysis,
            metadata: result.metadata || {
              source: 'zelaxy-agent',
              timestamp: Date.now(),
            },
          },
          errors: result.errors || [],
        }

        return NextResponse.json(transformedResult)
      }

      return NextResponse.json(result)
    } catch (agentApiError) {
      // External agent API failed - fall back to local conversion
      logger.warn(`[${requestId}] External agent API failed, falling back to local:`, {
        error: agentApiError instanceof Error ? agentApiError.message : 'Unknown error',
      })
      const localResult = await createDiffLocal(
        yamlContent,
        currentWorkflowState,
        diffAnalysis,
        options
      )
      return NextResponse.json(localResult)
    }
  } catch (error) {
    logger.error(`[${requestId}] Diff creation failed:`, error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors.map((e) => e.message) },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      { status: 500 }
    )
  }
}
