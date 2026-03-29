/**
 * Registry for MCPService singleton and MCP tool metadata.
 *
 * This avoids importing @/services/mcp (which depends on Node.js-only modules
 * like child_process) directly in files that are bundled for both client and
 * server (e.g. tools/index.ts, executor/handlers/agent/agent-handler.ts).
 *
 * Server-side entry points (API routes) import MCPService and register it here.
 * Other modules retrieve it via getMCPService() without any Node.js imports.
 */

let _MCPService: any = null

/**
 * Register the MCPService class so it can be retrieved from modules that
 * cannot safely import @/services/mcp.
 */
export function registerMCPService(service: any) {
  _MCPService = service
}

/**
 * Retrieve the registered MCPService. Returns null if not yet registered
 * (e.g. when running client-side or before the API route has loaded).
 */
export function getMCPService(): any {
  return _MCPService
}

// ---------- MCP tool ID ↔ metadata mapping ----------
// Tool IDs sent to the LLM must be short and conform to provider naming
// constraints (e.g. OpenAI's ^[a-zA-Z0-9_-]{1,64}$). This map stores the
// mapping from the short tool ID to the full serverId + toolName so that
// executeMCPTool can route the call correctly.

interface MCPToolMeta {
  serverId: string
  toolName: string
}

const _toolIdMap = new Map<string, MCPToolMeta>()

/**
 * Register a mapping from a tool ID to its MCP server and tool name.
 */
export function registerMCPToolId(toolId: string, meta: MCPToolMeta) {
  _toolIdMap.set(toolId, meta)
}

/**
 * Look up the serverId and toolName for a given tool ID.
 */
export function getMCPToolMeta(toolId: string): MCPToolMeta | undefined {
  return _toolIdMap.get(toolId)
}
