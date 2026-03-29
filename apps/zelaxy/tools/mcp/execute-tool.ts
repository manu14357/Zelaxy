import type { MCPExecuteToolParams } from '@/tools/mcp/types'
import type { ToolConfig } from '@/tools/types'

export const mcpExecuteToolTool: ToolConfig<MCPExecuteToolParams> = {
  id: 'mcp_execute_tool',
  name: 'MCP Tool Execution',
  description: 'Execute tools on connected MCP servers',
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
      description: 'MCP server identifier',
    },
    selectedTool: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the tool to execute',
    },
    toolParams: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Parameters to pass to the tool (JSON)',
    },
  },

  request: {
    method: 'POST',
    url: (params) =>
      `/api/mcp/execute-tool?workspaceId=${params._context?.workspaceId || params.workspaceId}`,
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      // Parse toolParams if it's a string
      let parameters: Record<string, any> = {}
      if (params.toolParams) {
        if (typeof params.toolParams === 'string') {
          try {
            parameters = JSON.parse(params.toolParams)
          } catch {
            parameters = {}
          }
        } else if (typeof params.toolParams === 'object') {
          parameters = params.toolParams as Record<string, any>
        }
      }
      return {
        serverId: params.existingServerId,
        toolName: params.selectedTool,
        parameters,
        workspaceId: params._context?.workspaceId || params.workspaceId,
        workflowId: params._context?.workflowId,
      }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to execute tool on MCP server',
        output: {
          serverId: data.serverId,
          executionResult: {
            toolName: data.toolName,
            result: null,
            success: false,
            latency: data.latency || 0,
            timestamp: new Date().toISOString(),
            error: data.error,
          },
        },
      }
    }

    return {
      success: true,
      output: {
        serverId: data.serverId,
        serverName: data.serverName,
        connectionStatus: 'connected',
        executionResult: {
          toolName: data.toolName,
          result: data.result,
          success: true,
          latency: data.latency || 0,
          timestamp: new Date().toISOString(),
          metadata: data.metadata,
        },
        toolMetadata: {
          inputSchema: data.inputSchema,
          outputSchema: data.outputSchema,
          version: data.version,
        },
      },
    }
  },

  outputs: {
    serverId: { type: 'string', description: 'Server identifier' },
    serverName: { type: 'string', description: 'Server name' },
    connectionStatus: { type: 'string', description: 'Connection status' },
    executionResult: {
      type: 'json',
      description: 'Tool execution result with success status, result data, and timing',
      properties: {
        toolName: { type: 'string', description: 'Name of executed tool' },
        result: { type: 'json', description: 'Tool execution result' },
        success: { type: 'boolean', description: 'Whether execution was successful' },
        latency: { type: 'number', description: 'Execution time in milliseconds' },
        timestamp: { type: 'string', description: 'ISO timestamp of execution' },
        error: { type: 'string', description: 'Error message if failed', optional: true },
        metadata: { type: 'json', description: 'Additional execution metadata', optional: true },
      },
    },
    toolMetadata: {
      type: 'json',
      description: 'Tool definition metadata',
      optional: true,
    },
  },
}
