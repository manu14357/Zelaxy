import type { ToolConfig, ToolResponse } from '@/tools/types'

interface MCPCreateServerParams {
  workspaceId: string
  _context?: { workflowId?: string; workspaceId?: string; chatId?: string }
  // Switches
  useExistingServer?: boolean | string
  useRawConfig?: boolean | string
  // Raw JSON config
  rawMcpConfig?: string
  // Server form fields
  serverName?: string
  serverType?: 'stdio' | 'sse' | 'http'
  // Stdio
  stdioCommand?: string
  stdioArgs?: string
  stdioEnv?: any[]
  // SSE
  sseEndpoint?: string
  sseHeaders?: any[]
  // HTTP
  httpBaseUrl?: string
  httpApiKey?: string
  httpHeaders?: any[]
  // Advanced
  timeout?: string | number
  retryAttempts?: string | number
  // Existing server
  existingServerId?: string
  selectedTool?: string
  toolParams?: string | object
  // Connection
  connectionAction?: string
  // Aggregate fallback params (for LLM use)
  config?: any
  settings?: any
  description?: string
}

// Helper to convert table-format data to key-value object
function tableToObject(table: any[], keyCol: string, valueCol: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (table && Array.isArray(table)) {
    table.forEach((row: any) => {
      if (row.cells?.[keyCol] && row.cells?.[valueCol] && row.cells[keyCol].trim()) {
        result[row.cells[keyCol].trim()] = row.cells[valueCol]
      }
    })
  }
  return result
}

// Helper to parse raw MCP config JSON (Claude Desktop format)
function parseRawMcpConfig(rawConfig: string | object): {
  serverName: string
  serverType: string
  config: any
} {
  let parsed: any
  if (typeof rawConfig === 'string') {
    parsed = rawConfig.trim() ? JSON.parse(rawConfig) : {}
  } else {
    parsed = rawConfig
  }

  // Handle { "mcpServers": { "name": { ... } } } wrapper
  if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
    const serverNames = Object.keys(parsed.mcpServers)
    if (serverNames.length === 0) throw new Error('No server found in mcpServers configuration')
    const name = serverNames[0]
    const cfg = parsed.mcpServers[name]
    const type = cfg.command ? 'stdio' : cfg.endpoint ? 'sse' : 'http'
    return { serverName: name, serverType: type, config: cfg }
  }

  // Handle direct config: { "command": "...", "args": [...] }
  const type = parsed.command ? 'stdio' : parsed.endpoint ? 'sse' : 'http'
  return { serverName: parsed.name || 'mcp-server', serverType: type, config: parsed }
}

// Build config object from individual form fields
function buildConfigFromFields(params: MCPCreateServerParams): any {
  const type = params.serverType || 'stdio'
  if (type === 'stdio') {
    return {
      command: params.stdioCommand,
      args: params.stdioArgs ? [params.stdioArgs] : [],
      env: tableToObject(params.stdioEnv || [], 'Key', 'Value'),
    }
  }
  if (type === 'sse') {
    return {
      endpoint: params.sseEndpoint,
      headers: tableToObject(params.sseHeaders || [], 'Header', 'Value'),
    }
  }
  // http
  return {
    baseUrl: params.httpBaseUrl,
    apiKey: params.httpApiKey,
    headers: tableToObject(params.httpHeaders || [], 'Header', 'Value'),
  }
}

export const mcpCreateServerTool: ToolConfig<MCPCreateServerParams> = {
  id: 'mcp_create_server',
  name: 'MCP Server Creation',
  description: 'Create and configure a new Model Context Protocol (MCP) server',
  version: '1.0',

  params: {
    workspaceId: {
      type: 'string',
      required: true,
      visibility: 'llm-only',
      description: 'Workspace ID (provided by context)',
    },
    // --- Switches (match MCP block subBlock IDs) ---
    useExistingServer: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Connect to an already configured server instead of creating a new one',
      default: false,
    },
    existingServerId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'ID of an existing MCP server to connect to',
    },
    useRawConfig: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Paste MCP server config JSON directly (Claude Desktop format)',
      default: false,
    },
    rawMcpConfig: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description:
        'MCP JSON config (e.g. { "mcpServers": { "name": { "command": "...", "args": [...] } } })',
    },
    // --- New server form fields ---
    serverName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Name of the MCP server',
    },
    serverType: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Connection type (stdio, sse, http)',
    },
    stdioCommand: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Command path for stdio server',
    },
    stdioArgs: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Script path or arguments for stdio server',
    },
    sseEndpoint: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'SSE endpoint URL',
    },
    httpBaseUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'HTTP base URL',
    },
    httpApiKey: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'API key for HTTP server',
    },
    // --- Connection action ---
    connectionAction: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Action to perform (test, connect, disconnect, refresh)',
    },
    // --- Aggregate params for LLM direct use ---
    config: {
      type: 'json',
      required: false,
      visibility: 'llm-only',
      description: 'Server configuration object (built from form fields)',
    },
    settings: {
      type: 'json',
      required: false,
      visibility: 'llm-only',
      description: 'Connection and behavior settings',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'llm-only',
      description: 'Server description',
    },
  },

  request: {
    url: '/api/mcp/create-server',
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const isExisting = params.useExistingServer === true || params.useExistingServer === 'true'
      const isRawConfig = params.useRawConfig === true || params.useRawConfig === 'true'

      let serverName = params.serverName || ''
      let serverType = params.serverType || 'stdio'
      let config = params.config

      if (isRawConfig && params.rawMcpConfig) {
        const parsed = parseRawMcpConfig(params.rawMcpConfig)
        serverName = parsed.serverName
        serverType = parsed.serverType as typeof serverType
        config = parsed.config
      } else if (!config) {
        config = buildConfigFromFields(params)
      }

      return {
        workspaceId: params._context?.workspaceId || params.workspaceId,
        workflowId: params._context?.workflowId,
        serverName,
        serverType,
        description: params.description,
        config,
        settings: params.settings || {
          timeout: Number.parseInt(String(params.timeout || '30')) || 30,
          retryAttempts: Number.parseInt(String(params.retryAttempts || '3')) || 3,
        },
        action: params.connectionAction || 'test',
      }
    },
  },

  transformResponse: async (response: Response, params?): Promise<ToolResponse> => {
    try {
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Server creation failed with status ${response.status}`,
          output: {},
        }
      }

      // The /api/mcp/create-server route handles connection + tool discovery server-side
      // No need for additional client-side fetch calls
      return {
        success: true,
        output: {
          serverId: data.serverId,
          serverName: data.serverName,
          connectionStatus: data.connectionStatus || 'disconnected',
          availableTools: data.availableTools || [],
          serverMetadata: data.serverMetadata || {
            type: params?.serverType || 'unknown',
            version: '',
            lastConnected: data.connectionStatus === 'connected' ? new Date().toISOString() : '',
            toolCount: (data.availableTools || []).length,
            avgLatency: 0,
          },
          error: data.error || undefined,
        },
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process server creation response',
        output: {},
      }
    }
  },

  outputs: {
    serverId: { type: 'string', description: 'Unique server identifier' },
    serverName: { type: 'string', description: 'Server display name' },
    connectionStatus: { type: 'string', description: 'Connection status' },
    availableTools: { type: 'json', description: 'Available tools from server' },
    serverMetadata: { type: 'json', description: 'Server information and stats' },
    error: { type: 'string', description: 'Error message if operation failed' },
  },
}
