import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { getAllBlocks } from '@/blocks/registry'
import type { BlockConfig, SubBlockConfig } from '@/blocks/types'
import { resolveOutputType } from '@/blocks/utils'
import { generateLoopBlocks, generateParallelBlocks } from '@/stores/workflows/workflow/utils'
import { convertYamlToWorkflow, parseWorkflowYaml } from '@/stores/workflows/yaml/importer'
import { BaseCopilotTool } from '../base'

// Zelaxy Agent API configuration - now optional
const ZELAXY_AGENT_API_URL = env.ZELAXY_AGENT_API_URL // No fallback - use local converter if not configured
const ZELAXY_AGENT_API_KEY = env.ZELAXY_AGENT_API_KEY

// Build block registry for subBlock conversion
function getBlockRegistry(): Map<string, BlockConfig> {
  const blocks = getAllBlocks()
  return new Map(blocks.map((block) => [block.type, block]))
}

/**
 * Convert flat inputs to proper subBlocks format AND fill in ALL missing subBlocks with defaults
 * Input: { prompt: "text", model: "gpt-4o" }
 * Output: All subBlocks for the block type, with provided values merged and defaults for missing ones
 */
function convertInputsToSubBlocks(
  blockType: string,
  inputs: Record<string, any>,
  blockRegistry: Map<string, BlockConfig>
): Record<string, { id: string; type: string; value: any }> {
  const subBlocks: Record<string, { id: string; type: string; value: any }> = {}
  const safeInputs = inputs && typeof inputs === 'object' ? inputs : {}

  const blockConfig = blockRegistry.get(blockType)
  const subBlockConfigs = blockConfig?.subBlocks || []

  // Create a map of subBlock id to config
  const subBlockConfigMap = new Map<string, SubBlockConfig>()
  for (const config of subBlockConfigs) {
    subBlockConfigMap.set(config.id, config)
  }

  // Step 1: Add ALL subBlocks from block config with defaults first
  for (const config of subBlockConfigs) {
    // Skip hidden subBlocks that aren't user-facing
    let defaultValue: any = null

    // Try to get default from the value factory function
    if (config.value && typeof config.value === 'function') {
      try {
        defaultValue = config.value({})
      } catch {
        defaultValue = null
      }
    }

    // Apply type-specific defaults when no value function exists
    if (defaultValue === null || defaultValue === undefined) {
      switch (config.type) {
        case 'switch':
          defaultValue = false
          break
        case 'slider':
          defaultValue = config.min ?? 0
          break
        case 'dropdown':
        case 'combobox':
          // Use first option as default if available
          if (config.options) {
            const opts = typeof config.options === 'function' ? config.options() : config.options
            if (opts.length > 0) {
              defaultValue = opts[0].id
            }
          }
          break
        case 'short-input':
        case 'long-input':
        case 'code':
          defaultValue = ''
          break
        case 'table':
          defaultValue = []
          break
        case 'tool-input':
          defaultValue = []
          break
        default:
          defaultValue = ''
          break
      }
    }

    subBlocks[config.id] = {
      id: config.id,
      type: config.type,
      value: defaultValue,
    }
  }

  // Step 2: Override with provided inputs from YAML
  for (const [inputKey, inputValue] of Object.entries(safeInputs)) {
    const config = subBlockConfigMap.get(inputKey)

    // Determine the type - use config type if available, otherwise infer from value
    let subBlockType = config?.type || 'short-input'

    // Extract the actual value - handle nested object format from YAML
    let actualValue = inputValue
    if (inputValue && typeof inputValue === 'object' && !Array.isArray(inputValue)) {
      const keys = Object.keys(inputValue)
      if (keys.length === 1 && keys[0] === 'type') {
        actualValue = inputValue.type
      } else if (keys.length === 1 && keys[0] === 'value') {
        actualValue = inputValue.value
      }
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

interface BuildWorkflowParams {
  yamlContent: string
  description?: string
}

interface BuildWorkflowResult {
  yamlContent: string
  description?: string
  success: boolean
  message: string
  workflowState?: any
  data?: {
    blocksCount: number
    edgesCount: number
  }
}

class BuildWorkflowTool extends BaseCopilotTool<BuildWorkflowParams, BuildWorkflowResult> {
  readonly id = 'build_workflow'
  readonly displayName = 'Building workflow'

  protected async executeImpl(params: BuildWorkflowParams): Promise<BuildWorkflowResult> {
    return buildWorkflow(params)
  }
}

// Export the tool instance
export const buildWorkflowTool = new BuildWorkflowTool()

/**
 * Convert YAML to workflow using LOCAL importer (no external API required)
 */
async function buildWorkflowLocal(
  yamlContent: string,
  description?: string
): Promise<BuildWorkflowResult> {
  const logger = createLogger('BuildWorkflowLocal')

  logger.info('Building workflow locally (no external API)', {
    yamlLength: yamlContent.length,
  })

  // Parse the YAML content
  const { data: parsedYaml, errors: parseErrors } = parseWorkflowYaml(yamlContent)

  if (parseErrors.length > 0 || !parsedYaml) {
    logger.error('YAML parsing failed', { errors: parseErrors })
    return {
      success: false,
      message: `YAML parsing failed: ${parseErrors.join(', ')}`,
      yamlContent,
      description,
    }
  }

  // Convert to workflow format
  const { blocks, edges, errors, warnings } = convertYamlToWorkflow(parsedYaml)

  if (errors.length > 0) {
    logger.error('YAML conversion failed', { errors, warnings })
    return {
      success: false,
      message: `Failed to convert YAML workflow: ${errors.join(', ')}`,
      yamlContent,
      description,
    }
  }

  if (warnings.length > 0) {
    logger.warn('YAML conversion completed with warnings', { warnings })
  }

  // Build block registry for subBlock type lookups
  const blockRegistry = getBlockRegistry()

  // Create a workflow state structure
  const previewWorkflowState = {
    blocks: {} as Record<string, any>,
    edges: [] as any[],
    loops: {} as Record<string, any>,
    parallels: {} as Record<string, any>,
    lastSaved: Date.now(),
    isDeployed: false,
  }

  // Process blocks with preview IDs
  const blockIdMapping = new Map<string, string>()

  blocks.forEach((block) => {
    const previewId = `preview-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    blockIdMapping.set(block.id, previewId)
  })

  // Add blocks to preview workflow state
  for (const block of blocks) {
    const previewBlockId = blockIdMapping.get(block.id)!

    // Convert flat inputs to proper subBlocks format
    const subBlocks = convertInputsToSubBlocks(block.type, block.inputs || {}, blockRegistry)

    previewWorkflowState.blocks[previewBlockId] = {
      id: previewBlockId,
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
      previewWorkflowState.loops[previewBlockId] = {
        id: previewBlockId,
        nodes: [],
        ...(block.data || {}),
      }
    } else if (block.type === 'parallel') {
      previewWorkflowState.parallels[previewBlockId] = {
        id: previewBlockId,
        nodes: [],
        ...(block.data || {}),
      }
    }
  }

  // Process edges with updated block IDs
  previewWorkflowState.edges = edges.map((edge) => ({
    id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    source: blockIdMapping.get(edge.source) || edge.source,
    target: blockIdMapping.get(edge.target) || edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }))

  const blocksCount = Object.keys(previewWorkflowState.blocks).length
  const edgesCount = previewWorkflowState.edges.length

  logger.info('Workflow built locally successfully', { blocksCount, edgesCount })

  return {
    success: true,
    message: `Successfully built workflow with ${blocksCount} blocks and ${edgesCount} connections`,
    yamlContent,
    description: description || 'Built workflow',
    workflowState: previewWorkflowState,
    data: {
      blocksCount,
      edgesCount,
    },
  }
}

/**
 * Convert YAML to workflow using external Agent API
 */
async function buildWorkflowRemote(
  yamlContent: string,
  description?: string
): Promise<BuildWorkflowResult> {
  const logger = createLogger('BuildWorkflowRemote')

  logger.info('Building workflow via agent API', {
    yamlLength: yamlContent.length,
    apiUrl: ZELAXY_AGENT_API_URL,
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

  const response = await fetch(`${ZELAXY_AGENT_API_URL}/api/yaml/to-workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ZELAXY_AGENT_API_KEY && { 'x-api-key': ZELAXY_AGENT_API_KEY }),
    },
    body: JSON.stringify({
      yamlContent,
      blockRegistry,
      utilities: {
        generateLoopBlocks: generateLoopBlocks.toString(),
        generateParallelBlocks: generateParallelBlocks.toString(),
        resolveOutputType: resolveOutputType.toString(),
      },
      options: {
        generateNewIds: true,
        preservePositions: false,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Zelaxy agent API error: ${response.statusText}`)
  }

  const conversionResult = await response.json()

  if (!conversionResult.success || !conversionResult.workflowState) {
    logger.error('YAML conversion failed', {
      errors: conversionResult.errors,
      warnings: conversionResult.warnings,
    })
    return {
      success: false,
      message: `Failed to convert YAML workflow: ${conversionResult.errors.join(', ')}`,
      yamlContent,
      description,
    }
  }

  const { workflowState } = conversionResult

  // Create a basic workflow state structure for preview
  const previewWorkflowState = {
    blocks: {} as Record<string, any>,
    edges: [] as any[],
    loops: {} as Record<string, any>,
    parallels: {} as Record<string, any>,
    lastSaved: Date.now(),
    isDeployed: false,
  }

  // Process blocks with preview IDs
  const blockIdMapping = new Map<string, string>()

  Object.keys(workflowState.blocks).forEach((blockId) => {
    const previewId = `preview-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    blockIdMapping.set(blockId, previewId)
  })

  // Add blocks to preview workflow state
  for (const [originalId, block] of Object.entries(workflowState.blocks)) {
    const previewBlockId = blockIdMapping.get(originalId)!
    const typedBlock = block as any

    previewWorkflowState.blocks[previewBlockId] = {
      ...typedBlock,
      id: previewBlockId,
      position: typedBlock.position || { x: 0, y: 0 },
      enabled: true,
    }
  }

  // Process edges with updated block IDs
  previewWorkflowState.edges = workflowState.edges.map((edge: any) => ({
    ...edge,
    id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    source: blockIdMapping.get(edge.source) || edge.source,
    target: blockIdMapping.get(edge.target) || edge.target,
  }))

  const blocksCount = Object.keys(previewWorkflowState.blocks).length
  const edgesCount = previewWorkflowState.edges.length

  logger.info('Workflow built via agent API successfully', { blocksCount, edgesCount })

  return {
    success: true,
    message: `Successfully built workflow with ${blocksCount} blocks and ${edgesCount} connections`,
    yamlContent,
    description: description || 'Built workflow',
    workflowState: previewWorkflowState,
    data: {
      blocksCount,
      edgesCount,
    },
  }
}

// Main implementation - tries local first, then falls back to remote
async function buildWorkflow(params: BuildWorkflowParams): Promise<BuildWorkflowResult> {
  const logger = createLogger('BuildWorkflow')
  const { yamlContent, description } = params

  logger.info('Building workflow for copilot', {
    yamlLength: yamlContent.length,
    description,
    hasAgentApi: !!ZELAXY_AGENT_API_URL,
  })

  try {
    // Always try LOCAL converter first - it's faster and doesn't require external service
    logger.info('Attempting local YAML conversion...')
    const localResult = await buildWorkflowLocal(yamlContent, description)

    if (localResult.success) {
      logger.info('Local conversion succeeded')
      return localResult
    }

    // If local failed and agent API is available, try remote
    if (ZELAXY_AGENT_API_URL) {
      logger.info('Local conversion failed, trying agent API...', {
        localError: localResult.message,
      })
      return await buildWorkflowRemote(yamlContent, description)
    }

    // Local failed and no agent API available
    return localResult
  } catch (error) {
    logger.error('Failed to build workflow:', error)
    return {
      success: false,
      message: `Workflow build failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      yamlContent,
      description,
    }
  }
}
