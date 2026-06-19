import { COPILOT_TOOL_DISPLAY_NAMES } from '@/stores/constants'
// Import all tools to register them
import { sendEmailTool, sendSlackMessageTool } from './actions/integration-tools'
import type { CopilotTool } from './base'
import { getBlocksAndToolsTool } from './blocks/get-blocks-and-tools'
import { getBlocksMetadataTool } from './blocks/get-blocks-metadata'
import { searchDocsTool } from './docs/search-docs'
import { noOpTool } from './other/no-op'
import { onlineSearchTool } from './other/online-search'
import {
  createKnowledgeBaseTool,
  createTableTool,
  deleteTableRowsTool,
  deleteWorkflowTool,
  exportTableTool,
  httpRequestActionTool,
  insertTableRowTool,
  listKnowledgeBasesTool,
  listScheduledJobsTool,
  listTablesTool,
  queryTableTool,
  renameWorkflowTool,
  updateTableRowTool,
} from './tables/tables-tools'
import { getEnvironmentVariablesTool } from './user/get-environment-variables'
import { setEnvironmentVariablesTool } from './user/set-environment-variables'
import { buildWorkflowTool } from './workflow/build-workflow'
import { editWorkflowTool } from './workflow/edit-workflow'
import { getUserWorkflowTool } from './workflow/get-user-workflow'
import { getWorkflowConsoleTool } from './workflow/get-workflow-console'

// Registry of all copilot tools
export class CopilotToolRegistry {
  private tools = new Map<string, CopilotTool>()

  /**
   * Register a tool in the registry
   */
  register(tool: CopilotTool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with id '${tool.id}' is already registered`)
    }
    this.tools.set(tool.id, tool)
  }

  /**
   * Get a tool by its ID
   */
  get(id: string): CopilotTool | undefined {
    return this.tools.get(id)
  }

  /**
   * Check if a tool exists
   */
  has(id: string): boolean {
    return this.tools.has(id)
  }

  /**
   * Get all available tool IDs
   */
  getAvailableIds(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * Get all tools
   */
  getAll(): CopilotTool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Execute a tool by ID with parameters
   */
  async execute(toolId: string, params: any): Promise<any> {
    const tool = this.get(toolId)
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`)
    }
    return tool.execute(params)
  }

  /**
   * Get display name for a tool ID
   */
  getDisplayName(toolId: string): string {
    return COPILOT_TOOL_DISPLAY_NAMES[toolId] || toolId
  }

  /**
   * Get all tool display names as a record
   */
  getAllDisplayNames(): Record<string, string> {
    return COPILOT_TOOL_DISPLAY_NAMES
  }
}

// Global registry instance
export const copilotToolRegistry = new CopilotToolRegistry()

// Register all tools
copilotToolRegistry.register(getBlocksAndToolsTool)
copilotToolRegistry.register(getBlocksMetadataTool)
copilotToolRegistry.register(searchDocsTool)
copilotToolRegistry.register(noOpTool)
copilotToolRegistry.register(onlineSearchTool)
copilotToolRegistry.register(getEnvironmentVariablesTool)
copilotToolRegistry.register(setEnvironmentVariablesTool)
copilotToolRegistry.register(getUserWorkflowTool)
copilotToolRegistry.register(buildWorkflowTool)
copilotToolRegistry.register(getWorkflowConsoleTool)
copilotToolRegistry.register(editWorkflowTool)
// ZelaxyArena workspace data tools (exposed only to the arena agent)
copilotToolRegistry.register(listTablesTool)
copilotToolRegistry.register(queryTableTool)
copilotToolRegistry.register(createTableTool)
copilotToolRegistry.register(insertTableRowTool)
copilotToolRegistry.register(updateTableRowTool)
copilotToolRegistry.register(deleteTableRowsTool)
copilotToolRegistry.register(exportTableTool)
copilotToolRegistry.register(listScheduledJobsTool)
copilotToolRegistry.register(createKnowledgeBaseTool)
copilotToolRegistry.register(listKnowledgeBasesTool)
copilotToolRegistry.register(httpRequestActionTool)
copilotToolRegistry.register(sendSlackMessageTool)
copilotToolRegistry.register(sendEmailTool)
copilotToolRegistry.register(renameWorkflowTool)
copilotToolRegistry.register(deleteWorkflowTool)

// Dynamically generated constants - single source of truth
export const COPILOT_TOOL_IDS = copilotToolRegistry.getAvailableIds()

// Export the type from shared constants
export type { CopilotToolId } from '@/stores/constants'
