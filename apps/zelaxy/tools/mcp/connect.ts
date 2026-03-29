import type { MCPConnectParams } from '@/tools/mcp/types'
import type { ToolConfig } from '@/tools/types'

export const mcpConnectTool: ToolConfig<MCPConnectParams> = {
  id: 'mcp_connect',
  name: 'MCP Server Connect',
  description: 'Connect to and manage Model Context Protocol (MCP) servers',
  version: '1.0',

  params: {
    workspaceId: {
      type: 'string',
      required: true,
      visibility: 'llm-only',
      description: 'Workspace ID (provided by context)',
    },
    existingServerId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the MCP server to connect to',
    },
    connectionAction: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Connection action (connect, disconnect, test)',
      default: 'connect',
    },
  },

  request: {
    method: (params) => (params.connectionAction === 'disconnect' ? 'DELETE' : 'POST'),
    url: (params) => `/api/mcp/servers/${params.existingServerId}/connection`,
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      workspaceId: params._context?.workspaceId || params.workspaceId,
      workflowId: params._context?.workflowId,
    }),
  },

  transformResponse: async (response, params) => {
    try {
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to connect to MCP server',
          output: {},
        }
      }

      const connectionStatus =
        params?.connectionAction === 'disconnect' ? 'disconnected' : 'connected'

      return {
        success: true,
        output: {
          serverId: data.serverId || params?.existingServerId || '',
          serverName: data.serverName || 'Unknown Server',
          connectionStatus,
          serverMetadata: {
            type: data.serverType || 'unknown',
            version: '1.0',
            lastConnected: connectionStatus === 'connected' ? new Date().toISOString() : '',
            toolCount: data.toolCount || (data.availableTools || []).length,
            avgLatency: 0,
          },
          availableTools: data.availableTools || [],
          message:
            connectionStatus === 'connected'
              ? 'Successfully connected to MCP server'
              : 'Successfully disconnected from MCP server',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process connection response',
        output: {},
      }
    }
  },

  outputs: {
    serverId: { type: 'string', description: 'Server unique identifier' },
    serverName: { type: 'string', description: 'Server display name' },
    connectionStatus: { type: 'string', description: 'Connection status' },
    serverMetadata: { type: 'json', description: 'Server information and stats' },
    availableTools: { type: 'json', description: 'Available tools from server' },
    message: { type: 'string', description: 'Status message' },
  },
}
