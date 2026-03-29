import { createLogger } from '@/lib/logs/console/logger'
import { registry as blockRegistry } from '@/blocks/registry'
import { tools as toolsRegistry } from '@/tools/registry'
import { BaseCopilotTool } from '../base'

type GetBlocksAndToolsParams = Record<string, never>

interface BlockInfo {
  block_name: string
  tool_names: string[]
}

class GetBlocksAndToolsTool extends BaseCopilotTool<
  GetBlocksAndToolsParams,
  Record<string, BlockInfo>
> {
  readonly id = 'get_blocks_and_tools'
  readonly displayName = 'Getting block information'

  protected async executeImpl(params: GetBlocksAndToolsParams): Promise<Record<string, BlockInfo>> {
    return getBlocksAndTools()
  }
}

// Export the tool instance
export const getBlocksAndToolsTool = new GetBlocksAndToolsTool()

// Implementation function - returns compact summary to minimize token usage
async function getBlocksAndTools(): Promise<Record<string, BlockInfo>> {
  const logger = createLogger('GetBlocksAndTools')

  logger.info('Getting all blocks and tools')

  // Create mapping of block_id -> {block_name, tool_names}
  const blockToToolsMapping: Record<string, BlockInfo> = {}

  // Group blocks by category for a more organized, compact output
  const categories: Record<string, string[]> = {
    Core: [],
    AI: [],
    Email: [],
    Messaging: [],
    'Data & Storage': [],
    'Search & Web': [],
    Integrations: [],
  }

  // Process blocks - filter out hidden blocks and map to their tools
  Object.entries(blockRegistry)
    .filter(([blockType, blockConfig]) => {
      if (blockConfig.hideFromToolbar) return false
      return true
    })
    .forEach(([blockType, blockConfig]) => {
      // Get the tools for this block (only first 3 tool names to save space)
      const blockToolIds = blockConfig.tools?.access || []
      const toolNames = blockToolIds.slice(0, 3).map((toolId) => {
        const toolConfig = toolsRegistry[toolId]
        return toolConfig ? toolConfig.name : toolId
      })
      if (blockToolIds.length > 3) {
        toolNames.push(`+${blockToolIds.length - 3} more`)
      }

      blockToToolsMapping[blockType] = {
        block_name: blockConfig.name || blockType,
        tool_names: toolNames,
      }
    })

  // Add special blocks
  const specialBlocks: Record<string, { name: string; tools: string[] }> = {
    loop: { name: 'Loop', tools: [] },
    parallel: { name: 'Parallel', tools: [] },
  }

  Object.entries(specialBlocks).forEach(([blockType, blockInfo]) => {
    blockToToolsMapping[blockType] = {
      block_name: blockInfo.name,
      tool_names: blockInfo.tools,
    }
  })

  const totalBlocks = Object.keys(blockRegistry).length + Object.keys(specialBlocks).length
  const includedBlocks = Object.keys(blockToToolsMapping).length

  logger.info(`Successfully mapped ${includedBlocks} blocks to their tools`, {
    totalBlocks,
    includedBlocks,
  })

  return blockToToolsMapping
}
