import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { listTables } from '@/lib/table'
import { applyLayeredLayout } from '@/lib/workflows/autolayout/layered-layout'
import { getAllBlocks } from '@/blocks/registry'
import type { BlockConfig, SubBlockConfig } from '@/blocks/types'
import { resolveOutputType } from '@/blocks/utils'
import { DEFAULT_CHAT_MODEL, isKnownModel } from '@/providers/models'
import { generateLoopBlocks, generateParallelBlocks } from '@/stores/workflows/workflow/utils'
import { convertYamlToWorkflow, parseWorkflowYaml } from '@/stores/workflows/yaml/importer'
import { BaseCopilotTool } from '../base'
import { type InputValidationError, lintWorkflowState, validateBlockSubBlocks } from './validation'

/**
 * The workflow-builder LLM often emits model ids from its training data that don't exist in this
 * Zelaxy install (e.g. "anthropic/claude-sonnet-4-20250514"). Replace any unknown model with a
 * real one from our registry so built workflows only ever reference models we actually support.
 * Mutates the blocks record; returns a list of the substitutions made (for warnings).
 */
function sanitizeWorkflowModels(blocks: Record<string, any>): string[] {
  const fixed: string[] = []
  for (const block of Object.values(blocks)) {
    const modelSub = block?.subBlocks?.model
    if (!modelSub || typeof modelSub.value !== 'string') continue
    const raw = modelSub.value.trim()
    if (!raw || isKnownModel(raw)) continue
    // Try stripping a provider prefix (e.g. "anthropic/claude-sonnet-4-6" → "claude-sonnet-4-6").
    const stripped = raw.includes('/') ? raw.split('/').pop()!.trim() : raw
    const replacement = isKnownModel(stripped) ? stripped : DEFAULT_CHAT_MODEL
    modelSub.value = replacement
    fixed.push(`${block.name || block.type}: replaced unknown model "${raw}" with "${replacement}"`)
  }
  return fixed
}

/**
 * Rewrite block-output references so they survive id reassignment. The YAML keys the model wrote
 * (e.g. `search_sk`) become fresh `preview-…` ids; without this, `{{search_sk.content}}` keeps
 * pointing at an id that no longer exists and silently resolves to nothing at runtime. Replaces the
 * BLOCK part of every `{{oldKey}}` / `{{oldKey.field}}` with its new id (env vars like `{{VAR}}` are
 * untouched — they aren't in the mapping).
 */
export function rewriteBlockRefsToIds(value: string, mapping: Map<string, string>): string {
  if (typeof value !== 'string' || !value.includes('{{')) return value
  let out = value
  for (const [oldId, newId] of mapping) {
    if (oldId === newId) continue
    const escaped = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match {{oldId}} or {{oldId.field…}} (the field part — group 1 — is preserved verbatim).
    const re = new RegExp(`\\{\\{\\s*${escaped}\\s*(\\.[^}]*)?\\}\\}`, 'g')
    out = out.replace(re, (_m, field) => `{{${newId}${field ?? ''}}}`)
  }
  return out
}

const LLM_BLOCK_TYPES = new Set(['agent', 'evaluator', 'router', 'translate'])

/**
 * Clear LLM-block configs the model frequently gets WRONG and which silently break execution, so the
 * safe defaults apply instead:
 *  - `timeout` < 60s → cleared (the model loves the 10s slider minimum, which aborts a real call
 *    with "signal timed out"; the default request timeout is 120s).
 *  - `maxTokens` < 1000 → cleared (a tiny value like 100 truncates structured JSON output).
 * Mutates the blocks in place; returns a list of human-readable fixes for logging.
 */
export function sanitizeLlmBlockConfigs(blocks: Record<string, any>): string[] {
  const fixes: string[] = []
  for (const block of Object.values(blocks)) {
    if (!block || !LLM_BLOCK_TYPES.has(block.type)) continue
    const sb: Record<string, any> = block.subBlocks || {}
    const timeoutVal = Number(sb.timeout?.value)
    if (sb.timeout && Number.isFinite(timeoutVal) && timeoutVal > 0 && timeoutVal < 60) {
      sb.timeout.value = null
      fixes.push(`${block.id}: cleared timeout=${timeoutVal}s`)
    }
    const maxTokensVal = Number(sb.maxTokens?.value)
    if (sb.maxTokens && Number.isFinite(maxTokensVal) && maxTokensVal > 0 && maxTokensVal < 1000) {
      sb.maxTokens.value = null
      fixes.push(`${block.id}: cleared maxTokens=${maxTokensVal}`)
    }
  }
  return fixes
}

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
  // Injected by the arena route — lets a `table` block's `tableId` be given as the table NAME and
  // resolved to the real id here (so the agent doesn't have to thread the exact id across tool calls).
  workspaceId?: string
}

/**
 * Resolve `table` blocks whose `tableId` was written as a table NAME (or left blank) to the real
 * table id. The model creates a table with create_table and often references it by name in the
 * workflow — this closes that gap. Mutates the blocks; returns a list of substitutions for warnings.
 */
async function resolveTableBlockIds(
  blocks: Record<string, any>,
  workspaceId: string | undefined
): Promise<string[]> {
  if (!workspaceId) return []
  const tableBlocks = Object.values(blocks).filter((b) => b?.type === 'table')
  if (tableBlocks.length === 0) return []
  let tables: Array<{ id: string; name: string }> = []
  try {
    tables = (await listTables(workspaceId)) as Array<{ id: string; name: string }>
  } catch {
    return []
  }
  const ids = new Set(tables.map((t) => t.id))
  const byName = new Map(tables.map((t) => [t.name.toLowerCase(), t.id]))
  const fixes: string[] = []
  for (const block of tableBlocks) {
    const sb = block.subBlocks?.tableId
    const val = typeof sb?.value === 'string' ? sb.value.trim() : ''
    // Skip blanks, real ids, and `{{…}}` references — only resolve a plain table NAME.
    if (!val || ids.has(val) || val.includes('{{')) continue
    const resolved = byName.get(val.toLowerCase())
    if (resolved) {
      sb.value = resolved
      fixes.push(`table "${val}" → ${resolved}`)
    }
  }
  return fixes
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
  description?: string,
  workspaceId?: string
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

  // What each block's references should point AT. The resolver matches a reference by block id OR
  // normalized block NAME — so prefer the readable name (stable across id remaps + far clearer than
  // `preview-…`), falling back to the preview id when a name is blank or shared by 2+ blocks.
  const normName = (s: string) => s.toLowerCase().replace(/\s+/g, '')
  const nameCounts = new Map<string, number>()
  for (const b of blocks) {
    const n = b.name ? normName(b.name) : ''
    if (n) nameCounts.set(n, (nameCounts.get(n) || 0) + 1)
  }
  const refTargets = new Map<string, string>()
  for (const b of blocks) {
    const n = b.name ? normName(b.name) : ''
    refTargets.set(b.id, n && nameCounts.get(n) === 1 ? n : blockIdMapping.get(b.id)!)
  }

  // Add blocks to preview workflow state
  const inputValidationErrors: InputValidationError[] = []
  for (const block of blocks) {
    const previewBlockId = blockIdMapping.get(block.id)!

    // Convert flat inputs to proper subBlocks format
    const subBlocks = convertInputsToSubBlocks(block.type, block.inputs || {}, blockRegistry)

    // Rewrite block-output references ({{otherKey.field}}) from the model's YAML keys to the readable
    // name (or id) the resolver understands — otherwise every cross-block reference resolves to
    // nothing at runtime after the id reassignment above.
    for (const sb of Object.values(subBlocks)) {
      if (typeof sb.value === 'string') sb.value = rewriteBlockRefsToIds(sb.value, refTargets)
      else if (Array.isArray(sb.value)) {
        sb.value = sb.value.map((v) =>
          typeof v === 'string' ? rewriteBlockRefsToIds(v, refTargets) : v
        )
      }
    }

    // Validate/normalize values against the block's sub-block config (catches invalid dropdown
    // ids, out-of-range sliders, non-boolean switches) so the model can self-correct.
    inputValidationErrors.push(
      ...validateBlockSubBlocks(block.type, blockRegistry.get(block.type), subBlocks)
    )

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

  // Replace any LLM model ids that don't exist in this Zelaxy install with real ones.
  const modelFixes = sanitizeWorkflowModels(previewWorkflowState.blocks)
  if (modelFixes.length > 0) logger.info('Sanitized workflow models', { modelFixes })

  // Resolve `table` blocks whose tableId was given as a table NAME to the real id.
  const tableFixes = await resolveTableBlockIds(previewWorkflowState.blocks, workspaceId)
  if (tableFixes.length > 0) logger.info('Resolved table ids', { tableFixes })

  // Clear LLM-block configs the model often gets wrong (a 10s timeout that aborts with "signal timed
  // out", a tiny maxTokens that truncates output) so the safe defaults apply instead.
  const configFixes = sanitizeLlmBlockConfigs(previewWorkflowState.blocks)
  if (configFixes.length > 0) logger.info('Sanitized LLM block configs', { configFixes })

  // A condition block's expanded `conditions` value ids embed the block's ORIGINAL key (like
  // "<key>-if"/"<key>-else"). Binary branches wire to the node's `true`/`false` handles (set by
  // createConditionHandle, key-independent), but the value ids still need remapping to the new
  // preview id so the ConditionInput editor renders the right rows. remapConditionHandle below only
  // touches any residual `condition-<key>-…` handles (a multi `else-if` with no binary node handle).
  for (const [oldKey, previewId] of blockIdMapping) {
    if (oldKey === previewId) continue
    const block = previewWorkflowState.blocks[previewId]
    const condVal = block?.subBlocks?.conditions?.value
    if (block?.type === 'condition' && typeof condVal === 'string') {
      block.subBlocks.conditions.value = condVal.replaceAll(`"${oldKey}-`, `"${previewId}-`)
    }
  }
  const remapConditionHandle = (handle: string | undefined): string | undefined => {
    if (!handle?.startsWith('condition-')) return handle
    for (const [oldKey, previewId] of blockIdMapping) {
      if (oldKey === previewId) continue
      if (handle === `condition-${oldKey}` || handle.startsWith(`condition-${oldKey}-`)) {
        return `condition-${previewId}${handle.slice(`condition-${oldKey}`.length)}`
      }
    }
    return handle
  }

  // Process edges with updated block IDs
  previewWorkflowState.edges = edges.map((edge) => ({
    id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    source: blockIdMapping.get(edge.source) || edge.source,
    target: blockIdMapping.get(edge.target) || edge.target,
    sourceHandle: remapConditionHandle(edge.sourceHandle),
    targetHandle: edge.targetHandle,
  }))

  // Lay the graph out left-to-right in layers so multi-output blocks (a trigger fanning to several
  // scrapers, a condition's if/else branches) fan out instead of stacking in one cramped column.
  try {
    applyLayeredLayout(previewWorkflowState.blocks, previewWorkflowState.edges)
  } catch (e) {
    logger.warn('Auto-layout failed; keeping default positions', { e })
  }

  const blocksCount = Object.keys(previewWorkflowState.blocks).length
  const edgesCount = previewWorkflowState.edges.length

  const workflowLint = lintWorkflowState(
    previewWorkflowState.blocks,
    previewWorkflowState.edges,
    blockRegistry
  )

  logger.info('Workflow built locally successfully', {
    blocksCount,
    edgesCount,
    inputValidationErrors: inputValidationErrors.length,
    workflowLint: workflowLint.length,
  })

  return {
    success: true,
    message: `Successfully built workflow with ${blocksCount} blocks and ${edgesCount} connections`,
    yamlContent,
    description: description || 'Built workflow',
    workflowState: previewWorkflowState,
    ...(inputValidationErrors.length > 0 ? { inputValidationErrors } : {}),
    ...(workflowLint.length > 0 ? { workflowLint } : {}),
    data: {
      blocksCount,
      edgesCount,
      ...(inputValidationErrors.length > 0 ? { inputValidationErrors } : {}),
      ...(workflowLint.length > 0 ? { workflowLint } : {}),
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

  // Replace any LLM model ids that don't exist in this Zelaxy install with real ones.
  sanitizeWorkflowModels(previewWorkflowState.blocks)

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
  const { yamlContent, description, workspaceId } = params

  logger.info('Building workflow for copilot', {
    yamlLength: yamlContent.length,
    description,
    hasAgentApi: !!ZELAXY_AGENT_API_URL,
  })

  try {
    // Always try LOCAL converter first - it's faster and doesn't require external service
    logger.info('Attempting local YAML conversion...')
    const localResult = await buildWorkflowLocal(yamlContent, description, workspaceId)

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
