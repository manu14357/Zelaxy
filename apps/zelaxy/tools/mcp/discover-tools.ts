import type { MCPDiscoverToolsParams } from '@/tools/mcp/types'
import type { ToolConfig } from '@/tools/types'

export const mcpDiscoverToolsTool: ToolConfig<MCPDiscoverToolsParams> = {
  id: 'mcp_discover_tools',
  name: 'MCP Tool Discovery',
  description: 'Automatically discover and catalog tools from MCP servers',
  version: '1.0',

  params: {
    existingServerId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'MCP server identifier',
    },
    workspaceId: {
      type: 'string',
      required: true,
      visibility: 'llm-only',
      description: 'Workspace identifier',
    },
    serverType: {
      type: 'string',
      required: false,
      visibility: 'llm-only',
      description: 'Type of MCP connection',
    },
    config: {
      type: 'json',
      required: false,
      visibility: 'llm-only',
      description: 'Server configuration',
    },
    settings: {
      type: 'json',
      required: false,
      visibility: 'llm-only',
      description: 'Connection settings',
    },
  },

  request: {
    method: 'POST',
    url: '/api/mcp/discover-tools',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      serverId: params.existingServerId,
      workspaceId: params._context?.workspaceId || params.workspaceId,
      workflowId: params._context?.workflowId,
      serverType: params.serverType,
      config: params.config,
      settings: params.settings,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to discover tools from MCP server',
        output: {},
      }
    }

    return {
      success: true,
      output: {
        serverId: data.serverId,
        serverName: data.serverName,
        connectionStatus: data.connectionStatus || 'connected',
        availableTools: data.tools || [],
        serverMetadata: {
          type: data.serverType,
          version: data.version || '1.0',
          lastConnected: new Date().toISOString(),
          toolCount: data.tools?.length || 0,
          avgLatency: data.avgLatency || 0,
        },
        discoveryResults: {
          toolsFound: data.tools?.length || 0,
          categoriesFound: [...new Set(data.tools?.flatMap((t: any) => t.category) || [])],
          lastUpdated: new Date().toISOString(),
          refreshInterval: data.refreshInterval || 15,
        },
      },
    }
  },

  outputs: {
    serverId: { type: 'string', description: 'Server identifier' },
    serverName: { type: 'string', description: 'Server name' },
    connectionStatus: { type: 'string', description: 'Connection status' },
    availableTools: { type: 'json', description: 'Discovered tools array' },
    serverMetadata: { type: 'json', description: 'Server metadata' },
    discoveryResults: { type: 'json', description: 'Tool discovery results' },
  },
}
