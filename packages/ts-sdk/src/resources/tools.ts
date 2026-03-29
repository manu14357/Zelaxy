import { BaseClient } from '../base'
import type { CustomTool, McpServer, McpTool, Tool } from '../types'

export class ToolsResource extends BaseClient {
  async list(): Promise<Tool[]> {
    const result = await this.get<Tool[] | { data: Tool[] }>('/api/tools/custom')
    return Array.isArray(result) ? result : result.data
  }

  async customList(): Promise<CustomTool[]> {
    const result = await this.get<CustomTool[] | { data: CustomTool[] }>('/api/tools/custom')
    return Array.isArray(result) ? result : result.data
  }

  async customCreate(params: {
    name: string
    description?: string
    schema?: any
    code?: string
  }): Promise<CustomTool> {
    return this.post<CustomTool>('/api/tools/custom', params)
  }

  async oauthConnections(): Promise<any[]> {
    return this.get<any[]>('/api/auth/oauth/connections')
  }

  // ─── MCP Servers ───────────────────────────────────────────────────────

  async mcpServers(): Promise<McpServer[]> {
    const result = await this.get<McpServer[] | { data: McpServer[] }>('/api/mcp/servers')
    return Array.isArray(result) ? result : result.data
  }

  async mcpServerCreate(params: { name: string; url: string; auth?: any }): Promise<McpServer> {
    return this.post<McpServer>('/api/mcp/servers', params)
  }

  async mcpServerDelete(serverId: string): Promise<void> {
    await this.del(`/api/mcp/servers/${serverId}`)
  }

  async mcpServerTest(serverId: string): Promise<{ success: boolean; error?: string }> {
    return this.post(`/api/mcp/servers/${serverId}/connection`)
  }

  async mcpServerTools(serverId: string): Promise<McpTool[]> {
    const result = await this.get<McpTool[] | { data: McpTool[] }>(
      `/api/mcp/servers/${serverId}/tools`
    )
    return Array.isArray(result) ? result : result.data
  }
}
