import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { createLogger } from '@/lib/logs/console/logger'
import { registry as blockRegistry } from '@/blocks/registry'
import { tools as toolsRegistry } from '@/tools/registry'
import { BaseCopilotTool } from '../base'

const logger = createLogger('GetBlockMetadataAPI')

interface GetBlocksMetadataParams {
  blockIds: string[]
}

interface BlocksMetadataResult {
  success: boolean
  data?: Record<string, any>
  error?: string
}

class GetBlocksMetadataTool extends BaseCopilotTool<GetBlocksMetadataParams, BlocksMetadataResult> {
  readonly id = 'get_blocks_metadata'
  readonly displayName = 'Getting block metadata'

  protected async executeImpl(params: GetBlocksMetadataParams): Promise<BlocksMetadataResult> {
    return getBlocksMetadata(params)
  }
}

// Export the tool instance
export const getBlocksMetadataTool = new GetBlocksMetadataTool()

/**
 * Safely resolve subblock options, handling both static arrays and functions
 */
function resolveSubBlockOptions(options: any): any[] {
  try {
    if (typeof options === 'function') {
      const resolved = options()
      return Array.isArray(resolved) ? resolved : []
    }
    return Array.isArray(options) ? options : []
  } catch (error) {
    logger.warn('Failed to resolve subblock options:', error)
    return []
  }
}

/**
 * Process subBlocks configuration to include essential UI metadata
 * Only includes fields the LLM needs for YAML generation - keeps response compact
 */
function processSubBlocks(subBlocks: any[]): any[] {
  if (!Array.isArray(subBlocks)) {
    return []
  }

  // NOTE: hidden sub-blocks are kept (marked `hidden`). They are hidden from the canvas UI but are
  // still real, configurable fields the copilot must set — e.g. the schedule block hides
  // scheduleType/cronExpression, so dropping them left the model guessing invalid values.
  return subBlocks.map((subBlock) => {
    const processedSubBlock: any = {
      id: subBlock.id,
      type: subBlock.type,
    }

    if (subBlock.hidden) processedSubBlock.hidden = true
    // Only include non-default fields to reduce size
    if (subBlock.title) processedSubBlock.title = subBlock.title
    if (subBlock.required) processedSubBlock.required = true
    if (subBlock.placeholder) processedSubBlock.placeholder = subBlock.placeholder
    if (subBlock.description) processedSubBlock.description = subBlock.description
    if (subBlock.condition) processedSubBlock.condition = subBlock.condition

    // Slider range
    if (subBlock.min !== undefined) processedSubBlock.min = subBlock.min
    if (subBlock.max !== undefined) processedSubBlock.max = subBlock.max

    // Resolve options if present - only id and label
    if (subBlock.options) {
      try {
        const resolvedOptions = resolveSubBlockOptions(subBlock.options)
        processedSubBlock.options = resolvedOptions.map((option) => ({
          label: option.label,
          id: option.id,
        }))
      } catch (error) {
        processedSubBlock.options = []
      }
    }

    return processedSubBlock
  })
}

// Implementation function
export async function getBlocksMetadata(
  params: GetBlocksMetadataParams
): Promise<BlocksMetadataResult> {
  const { blockIds } = params

  if (!blockIds || !Array.isArray(blockIds)) {
    return {
      success: false,
      error: 'blockIds must be an array of block IDs',
    }
  }

  logger.info('Getting block metadata', {
    blockIds,
    blockCount: blockIds.length,
    requestedBlocks: blockIds.join(', '),
  })

  try {
    // Create result object
    const result: Record<string, any> = {}

    // Process each requested block ID
    for (const blockId of blockIds) {
      let metadata: any = {}

      // Check if it's a special block first
      if (SPECIAL_BLOCKS_METADATA[blockId]) {
        // Start with the special block metadata
        metadata = { ...SPECIAL_BLOCKS_METADATA[blockId] }
        // Normalize tools structure to match regular blocks
        metadata.tools = metadata.tools?.access || []
      } else {
        // Check if the block exists in the registry
        const blockConfig = blockRegistry[blockId]
        if (!blockConfig) {
          logger.warn(`Block not found in registry: ${blockId}`)
          continue
        }

        metadata = {
          id: blockId,
          name: blockConfig.name || blockId,
          description: blockConfig.description || '',
          longDescription: blockConfig.longDescription,
          category: blockConfig.category,
          bgColor: blockConfig.bgColor,
          inputs: blockConfig.inputs || {},
          outputs: blockConfig.outputs || {},
          tools: blockConfig.tools?.access || [],
          hideFromToolbar: blockConfig.hideFromToolbar,
        }

        // Process and include subBlocks configuration
        if (blockConfig.subBlocks && Array.isArray(blockConfig.subBlocks)) {
          metadata.subBlocks = processSubBlocks(blockConfig.subBlocks)
        } else {
          metadata.subBlocks = []
        }
      }

      // Read YAML schema from documentation if available (for both regular and special blocks)
      const docFileName = DOCS_FILE_MAPPING[blockId] || blockId
      try {
        // Resolve the monorepo root and find the docs content
        // cwd is typically apps/zelaxy in dev, so go up to the monorepo root
        const workingDir = process.cwd()
        // Determine the monorepo root by looking for common markers
        let basePath = workingDir
        if (workingDir.endsWith('/apps/zelaxy') || workingDir.endsWith('\\apps\\zelaxy')) {
          basePath = join(workingDir, '..', '..')
        } else if (workingDir.endsWith('/apps/core') || workingDir.endsWith('\\apps\\core')) {
          basePath = join(workingDir, '..', '..')
        }
        const docPath = join(
          basePath,
          'apps',
          'docs',
          'content',
          'docs',
          'blocks',
          `${docFileName}.mdx`
        )
        if (existsSync(docPath)) {
          const docContent = readFileSync(docPath, 'utf-8')
          // Keep the sections the agent actually needs to author YAML (Configuration, Inputs &
          // Outputs, Tools, YAML Example) instead of blindly chopping the first N chars off the
          // TOP — that old approach dropped exactly the Configuration/Example sections (they sit
          // after the intro) and left only frontmatter + prose, which is useless for generation.
          metadata.yamlDocumentation = extractDocForAgent(docContent)
        }
      } catch (error) {
        logger.warn(`Failed to read documentation for ${blockId}:`, error)
      }

      // Add tool metadata if requested
      if (metadata.tools && metadata.tools.length > 0) {
        metadata.toolDetails = {}
        for (const toolId of metadata.tools) {
          const tool = toolsRegistry[toolId]
          if (tool) {
            metadata.toolDetails[toolId] = {
              name: tool.name,
              description: tool.description,
            }
          }
        }
      }

      // Always attach a generated, copy-pasteable YAML example built from the block's real
      // definition (correct `type` + valid input ids). This gives every block — not just the
      // hand-documented core ones — a concrete example, so the agent emits valid block types.
      if (!metadata.yamlExample) {
        metadata.yamlExample = buildYamlExample(blockId, metadata)
      }

      result[blockId] = metadata
    }

    logger.info(`Successfully retrieved metadata for ${Object.keys(result).length} blocks`)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    logger.error('Get block metadata failed', error)
    return {
      success: false,
      error: `Failed to get block metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Trim a block's MDX doc to the sections most useful for YAML generation, in natural reading order,
 * within a character budget. The OLD logic sliced the first 1500 chars off the top of the file, which
 * dropped the `## Configuration` and `## YAML Example` sections (they come after the frontmatter +
 * intro + Overview) — so the agent got prose but none of the field/option/example info it needs. This
 * keeps the high-value sections first (Example, Configuration, Inputs & Outputs, Tools) and fills up to
 * the budget, so nothing critical is ever cut mid-section.
 */
export function extractDocForAgent(docContent: string, maxLen = 6000): string {
  if (!docContent) return docContent
  if (docContent.length <= maxLen) return docContent

  // Head = frontmatter + title + intro (everything before the first `## ` heading). Always kept —
  // it carries the title/description and the Overview lead-in.
  const firstH2 = docContent.search(/^## /m)
  const head = firstH2 === -1 ? docContent : docContent.slice(0, firstH2)
  const rest = firstH2 === -1 ? '' : docContent.slice(firstH2)
  if (!rest) return head.length <= maxLen ? head : `${head.slice(0, maxLen)}\n... [truncated]`

  // Split the body into sections at each `## ` heading, preserving original order.
  const parts = rest.split(/(?=^## )/m).filter((s) => s.trim().length > 0)
  const titleOf = (s: string) => (s.match(/^## (.+)$/m)?.[1] || '').trim().toLowerCase()

  // Priority order — what the workflow-builder agent most needs first.
  const priority = [
    'yaml example',
    'configuration',
    'inputs & outputs',
    'inputs and outputs',
    'outputs',
    'operations',
    'tools',
    'overview',
    'when to use',
  ]
  const rank = (s: string) => {
    const t = titleOf(s)
    const i = priority.findIndex((p) => t.startsWith(p))
    return i === -1 ? priority.length : i
  }

  // Pick sections greedily by priority within the budget, then emit them in their ORIGINAL order so
  // the doc still reads naturally.
  const ordered = parts
    .map((s, idx) => ({ s, idx, r: rank(s) }))
    .sort((a, b) => a.r - b.r || a.idx - b.idx)

  const keep = new Set<number>()
  let used = head.length
  for (const { s, idx } of ordered) {
    if (used + s.length > maxLen && keep.size > 0) continue
    keep.add(idx)
    used += s.length
  }

  const kept = parts.filter((_, idx) => keep.has(idx))
  const droppedCount = parts.length - kept.length
  let out = head + kept.join('')
  if (droppedCount > 0) {
    out += `\n<!-- ${droppedCount} less-critical doc section(s) omitted to fit context -->\n`
  }
  return out
}

/** Placeholder value for a sub-block, based on its input type. */
function placeholderForSubBlock(sb: any): string {
  switch (sb?.type) {
    case 'switch':
      return 'false'
    case 'slider':
      return '0'
    case 'dropdown':
    case 'combobox': {
      const opt = Array.isArray(sb.options) ? sb.options[0] : undefined
      const val = typeof opt === 'string' ? opt : opt?.id
      return val ? `"${val}"` : '"<value>"'
    }
    default:
      return '"<value>"'
  }
}

/** Sub-block types that are status/UI widgets, NOT real YAML value inputs — exclude from examples. */
const DISPLAY_ONLY_SUBBLOCK_TYPES = new Set(['schedule-config', 'trigger-config'])

/** Whether a sub-block's `condition` is satisfied given the values already chosen for the example.
 * Keeps the example COHERENT — a conditional field only appears when its gating field's chosen value
 * matches (e.g. with `scheduleType: "minutes"`, only `minutesInterval` shows, not every timing field). */
function conditionSatisfied(condition: any, chosen: Record<string, string>): boolean {
  if (!condition || typeof condition !== 'object') return true
  const current = chosen[condition.field]
  // Gating field not set yet in the example → can't confirm relevance, so omit the conditional field.
  if (current === undefined) return false
  const values = (Array.isArray(condition.value) ? condition.value : [condition.value]).map(String)
  let match = values.includes(String(current))
  if (condition.not) match = !match
  return match
}

/**
 * Build a minimal, valid YAML example for a block from its real definition. Uses the actual block
 * `type` (id) and a COHERENT set of its real input ids (display-only widgets dropped; conditional
 * fields only when their condition matches the chosen values) so the agent has a correct skeleton to
 * copy — this prevents hallucinated block types AND incoherent input sets (e.g. all schedule timings).
 */
export function buildYamlExample(blockId: string, metadata: any): string {
  const name = metadata?.name || blockId
  const subs = Array.isArray(metadata?.subBlocks) ? metadata.subBlocks : []
  const chosen: Record<string, string> = {}
  const inputLines: string[] = []
  for (const sb of subs) {
    if (!sb?.id || inputLines.length >= 8) continue
    if (DISPLAY_ONLY_SUBBLOCK_TYPES.has(sb.type)) continue
    if (!conditionSatisfied(sb.condition, chosen)) continue
    const value = placeholderForSubBlock(sb)
    chosen[sb.id] = value.replace(/^"|"$/g, '')
    inputLines.push(`    ${sb.id}: ${value}`)
  }

  const lines = [`${blockId}_1:`, `  type: ${blockId}`, `  name: "${name}"`]
  if (inputLines.length > 0) lines.push('  inputs:', ...inputLines)
  lines.push('  connections:', '    outgoing:', '      - target: <next-block-id>')
  return lines.join('\n')
}

// Core blocks that have documentation with YAML schemas
const CORE_BLOCKS_WITH_DOCS = [
  'agent',
  'function',
  'api',
  'condition',
  'loop',
  'parallel',
  'response',
  'router',
  'evaluator',
  'webhook',
]

// Mapping for blocks that have different doc file names
const DOCS_FILE_MAPPING: Record<string, string> = {
  // All core blocks use their registry ID as the doc filename
  // e.g., 'api' block -> 'api.mdx', 'agent' block -> 'agent.mdx'
}

// Special blocks that aren't in the standard registry but need metadata
const SPECIAL_BLOCKS_METADATA: Record<string, any> = {
  loop: {
    type: 'loop',
    name: 'Loop',
    description: 'Control flow block for iterating over collections or repeating actions',
    inputs: {
      loopType: { type: 'string', required: true, enum: ['for', 'forEach'] },
      iterations: { type: 'number', required: false, minimum: 1, maximum: 1000 },
      collection: { type: 'string', required: false },
      maxConcurrency: { type: 'number', required: false, default: 1, minimum: 1, maximum: 10 },
    },
    outputs: {
      results: 'array',
      currentIndex: 'number',
      currentItem: 'any',
      totalIterations: 'number',
    },
    tools: { access: [] },
    subBlocks: [
      {
        id: 'loopType',
        title: 'Loop Type',
        type: 'dropdown',
        required: true,
        options: [
          { label: 'For Loop (count)', id: 'for' },
          { label: 'For Each (collection)', id: 'forEach' },
        ],
      },
      {
        id: 'iterations',
        title: 'Iterations',
        type: 'slider',
        min: 1,
        max: 1000,
        integer: true,
        condition: { field: 'loopType', value: 'for' },
      },
      {
        id: 'collection',
        title: 'Collection',
        type: 'short-input',
        placeholder: 'Array or object to iterate over...',
        condition: { field: 'loopType', value: 'forEach' },
      },
      {
        id: 'maxConcurrency',
        title: 'Max Concurrency',
        type: 'slider',
        min: 1,
        max: 10,
        integer: true,
        default: 1,
      },
    ],
  },
  parallel: {
    type: 'parallel',
    name: 'Parallel',
    description: 'Control flow block for executing multiple branches simultaneously',
    inputs: {
      parallelType: { type: 'string', required: true, enum: ['count', 'collection'] },
      count: { type: 'number', required: false, minimum: 1, maximum: 100 },
      collection: { type: 'string', required: false },
      maxConcurrency: { type: 'number', required: false, default: 10, minimum: 1, maximum: 50 },
    },
    outputs: {
      results: 'array',
      branchId: 'number',
      branchItem: 'any',
      totalBranches: 'number',
    },
    tools: { access: [] },
    subBlocks: [
      {
        id: 'parallelType',
        title: 'Parallel Type',
        type: 'dropdown',
        required: true,
        options: [
          { label: 'Count (number)', id: 'count' },
          { label: 'Collection (array)', id: 'collection' },
        ],
      },
      {
        id: 'count',
        title: 'Count',
        type: 'slider',
        min: 1,
        max: 100,
        integer: true,
        condition: { field: 'parallelType', value: 'count' },
      },
      {
        id: 'collection',
        title: 'Collection',
        type: 'short-input',
        placeholder: 'Array to process in parallel...',
        condition: { field: 'parallelType', value: 'collection' },
      },
      {
        id: 'maxConcurrency',
        title: 'Max Concurrency',
        type: 'slider',
        min: 1,
        max: 50,
        integer: true,
        default: 10,
      },
    ],
  },
}
