import { McpIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface MCPBlockOutput {
  success: boolean
  output: {
    serverId: string
    serverName: string
    connectionStatus: 'connected' | 'disconnected' | 'error'
    availableTools: Array<{
      id: string
      name: string
      description: string
      category: string[]
      inputSchema: Record<string, any>
      outputSchema: Record<string, any>
    }>
    serverMetadata: {
      type: 'stdio' | 'sse' | 'http'
      version: string
      lastConnected: string
      toolCount: number
      avgLatency: number
    }
    executionResult?: {
      toolName: string
      result: any
      success: boolean
      latency: number
      timestamp: string
    }
  }
}

export const MCPBlock: BlockConfig<MCPBlockOutput> = {
  type: 'mcp',
  name: 'MCP Integration',
  description: 'Connect and manage Model Context Protocol (MCP) servers',
  longDescription:
    'Advanced MCP integration system that enables seamless connection between AI agents and MCP servers with automatic tool discovery, dynamic integration, and comprehensive server management capabilities.\n\n**Recommended Workflow:**\n1. Configure MCP servers in Settings > MCP for persistent management\n2. Use "Use Existing Server" toggle to connect to pre-configured servers\n3. Create new servers here only for quick testing',
  docsLink: 'https://docs.zelaxy.dev/blocks/mcp-integration',
  category: 'tools',
  bgColor: '#EA580C',
  icon: McpIcon,

  subBlocks: [
    // Server Selection Option
    {
      id: 'useExistingServer',
      title: 'Use Existing Server',
      type: 'switch',
      layout: 'half',
      value: () => 'false',
      description: 'Connect to a server already configured in MCP Settings',
    },
    {
      id: 'existingServerId',
      title: 'Select Server',
      type: 'dropdown',
      layout: 'full',
      placeholder: 'Choose from configured servers...',
      condition: { field: 'useExistingServer', value: true },
      required: true,
      // Return empty options for now - this should be populated dynamically by the UI
      options: () => [],
      description: 'Select a server from MCP Settings. Go to Settings > MCP to configure servers.',
    },

    // Configuration Mode Toggle (for new servers)
    {
      id: 'useRawConfig',
      title: 'Use JSON Config',
      type: 'switch',
      layout: 'half',
      value: () => 'false',
      condition: { field: 'useExistingServer', value: false },
      description: 'Paste MCP server config JSON directly (like Claude Desktop format)',
    },

    // Raw JSON Configuration (for pasting MCP config directly)
    {
      id: 'rawMcpConfig',
      title: 'MCP Server Configuration',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: `{
  "mcpServers": {
    "time": {
      "command": "uvx",
      "args": [
        "mcp-server-time",
        "--local-timezone=America/New_York"
      ]
    }
  }
}`,
      condition: {
        field: 'useExistingServer',
        value: false,
        and: { field: 'useRawConfig', value: true },
      },
      required: true,
      description:
        'Paste the standard MCP JSON config format (same as Claude Desktop, Cursor, etc.)',
    },

    // Server Configuration Section (for new servers - form mode)
    {
      id: 'serverName',
      title: 'Server Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'e.g., filesystem-server, database-connector',
      required: true,
      condition: {
        field: 'useExistingServer',
        value: false,
        and: { field: 'useRawConfig', value: false },
      },
      description: 'Unique identifier for this MCP server',
    },
    {
      id: 'serverType',
      title: 'Connection Type',
      type: 'dropdown',
      layout: 'half',
      required: true,
      condition: {
        field: 'useExistingServer',
        value: false,
        and: { field: 'useRawConfig', value: false },
      },
      options: [
        { label: 'Stdio (Command Line)', id: 'stdio' },
        { label: 'SSE (Server-Sent Events)', id: 'sse' },
        { label: 'HTTP (REST API)', id: 'http' },
      ],
      value: () => 'stdio',
    },

    // Stdio Configuration
    {
      id: 'stdioCommand',
      title: 'Command Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/path/to/mcp-server or npx @modelcontextprotocol/server-example',
      condition: {
        field: 'serverType',
        value: 'stdio',
        and: { field: 'useRawConfig', value: false },
      },
      required: true,
    },
    {
      id: 'stdioArgs',
      title: 'Script Path/Arguments',
      type: 'short-input',
      layout: 'full',
      placeholder: '/path/to/script.py or --option value',
      condition: {
        field: 'serverType',
        value: 'stdio',
        and: { field: 'useRawConfig', value: false },
      },
      description: 'Path to the script file or additional command arguments',
    },
    {
      id: 'stdioEnv',
      title: 'Environment Variables',
      type: 'table',
      layout: 'full',
      columns: ['Key', 'Value'],
      condition: {
        field: 'serverType',
        value: 'stdio',
        and: { field: 'useRawConfig', value: false },
      },
      description: 'Environment variables for the process',
    },

    // SSE Configuration
    {
      id: 'sseEndpoint',
      title: 'SSE Endpoint URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://api.example.com/mcp/sse',
      condition: {
        field: 'serverType',
        value: 'sse',
        and: { field: 'useRawConfig', value: false },
      },
      required: true,
    },
    {
      id: 'sseHeaders',
      title: 'Authentication Headers',
      type: 'table',
      layout: 'full',
      columns: ['Header', 'Value'],
      condition: {
        field: 'serverType',
        value: 'sse',
        and: { field: 'useRawConfig', value: false },
      },
    },

    // HTTP Configuration
    {
      id: 'httpBaseUrl',
      title: 'Base URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://api.example.com',
      condition: {
        field: 'serverType',
        value: 'http',
        and: { field: 'useRawConfig', value: false },
      },
      required: true,
    },
    {
      id: 'httpApiKey',
      title: 'API Key / Token',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Your API key',
      password: true,
      condition: {
        field: 'serverType',
        value: 'http',
        and: { field: 'useRawConfig', value: false },
      },
    },
    {
      id: 'httpHeaders',
      title: 'Custom Headers',
      type: 'table',
      layout: 'full',
      columns: ['Header', 'Value'],
      condition: {
        field: 'serverType',
        value: 'http',
        and: { field: 'useRawConfig', value: false },
      },
    },

    // Advanced Configuration
    {
      id: 'timeout',
      title: 'Connection Timeout (seconds)',
      type: 'slider',
      layout: 'half',
      min: 5,
      max: 300,
      step: 5,
      mode: 'advanced',
      value: () => '30',
    },
    {
      id: 'retryAttempts',
      title: 'Retry Attempts',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 10,
      step: 1,
      mode: 'advanced',
      value: () => '3',
    },

    // Tool Execution (only shown when using an existing server)
    {
      id: 'selectedTool',
      title: 'Execute Tool',
      type: 'dropdown',
      layout: 'half',
      placeholder: 'Select a tool to execute',
      options: () => [], // Dynamically populated from discovered tools
      condition: { field: 'useExistingServer', value: true },
      description: 'Choose a tool to execute from this MCP server',
    },
    {
      id: 'toolParams',
      title: 'Tool Parameters',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{\n  "param1": "value1",\n  "param2": "value2"\n}',
      condition: {
        field: 'useExistingServer',
        value: true,
        and: { field: 'selectedTool', value: ['', 'loading'], not: true },
      },
      description: 'Parameters to pass to the selected tool (JSON format)',
    },

    // Connection Actions
    {
      id: 'connectionAction',
      title: 'Connection Management',
      type: 'dropdown',
      layout: 'half',
      value: () => 'test', // Default to test connection
      options: [
        { label: 'Test Connection', id: 'test' },
        { label: 'Connect', id: 'connect' },
        { label: 'Disconnect', id: 'disconnect' },
        { label: 'Refresh Tools', id: 'refresh' },
      ],
    },
  ],

  tools: {
    access: ['mcp_create_server', 'mcp_connect', 'mcp_discover_tools', 'mcp_execute_tool'],
    config: {
      tool: (params) => {
        // Normalize switch values (can be boolean or string)
        const isExisting = params.useExistingServer === true || params.useExistingServer === 'true'
        const isRawConfig = params.useRawConfig === true || params.useRawConfig === 'true'

        // For new servers (either form-based or raw JSON config), we always need to create first
        if (!isExisting && (params.serverName || (isRawConfig && params.rawMcpConfig))) {
          return 'mcp_create_server' // This will create and optionally connect based on action
        }

        // If using existing server, handle connection actions
        if (isExisting && params.existingServerId) {
          // Priority 1: If refresh action is explicitly requested
          if (params.connectionAction === 'refresh') {
            return 'mcp_discover_tools'
          }

          // Priority 2: If disconnect action is explicitly requested
          if (params.connectionAction === 'disconnect') {
            return 'mcp_connect' // mcp_connect handles disconnect action
          }

          // Priority 3: If tool is selected, execute it
          // Note: This assumes the server is already connected
          // The API endpoint will return error if not connected
          if (params.selectedTool) {
            return 'mcp_execute_tool'
          }

          // Priority 4: Default to connect/test actions
          return 'mcp_connect'
        }

        // Default fallback
        return 'mcp_create_server'
      },
      params: (params) => {
        // Helper function to parse raw MCP config JSON
        const parseRawMcpConfig = (rawConfig: string | object) => {
          let parsed: any
          try {
            if (typeof rawConfig === 'string') {
              parsed = rawConfig.trim() ? JSON.parse(rawConfig) : {}
            } else if (typeof rawConfig === 'object' && rawConfig !== null) {
              parsed = rawConfig
            } else {
              throw new Error('Invalid config format')
            }
          } catch (error) {
            throw new Error(
              `Invalid JSON in MCP Server Configuration: ${error instanceof Error ? error.message : String(error)}`
            )
          }

          // Handle the mcpServers wrapper format
          if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
            const serverNames = Object.keys(parsed.mcpServers)
            if (serverNames.length === 0) {
              throw new Error('No server found in mcpServers configuration')
            }
            // Use the first server found
            const serverName = serverNames[0]
            const serverConfig = parsed.mcpServers[serverName]
            return { serverName, serverConfig }
          }

          // Handle direct server config format (without mcpServers wrapper)
          if (parsed.command || parsed.endpoint || parsed.baseUrl) {
            return { serverName: parsed.name || 'mcp-server', serverConfig: parsed }
          }

          throw new Error(
            'Invalid MCP config format. Expected { "mcpServers": { "name": { "command": "...", "args": [...] } } }'
          )
        }

        // Convert table format environment variables to object
        const envVars: Record<string, string> = {}
        if (params.stdioEnv && Array.isArray(params.stdioEnv)) {
          params.stdioEnv.forEach((row: any) => {
            if (row.cells?.Key && row.cells?.Value && row.cells.Key.trim()) {
              envVars[row.cells.Key.trim()] = row.cells.Value
            }
          })
        }

        // Convert table format headers to object
        const convertTableToHeaders = (table: any[]): Record<string, string> => {
          const headers: Record<string, string> = {}
          if (table && Array.isArray(table)) {
            table.forEach((row: any) => {
              if (row.cells?.Header && row.cells?.Value && row.cells.Header.trim()) {
                headers[row.cells.Header.trim()] = row.cells.Value
              }
            })
          }
          return headers
        }

        // Build the configuration object based on server type or raw config
        let config: any = {}
        let serverName = params.serverName
        let serverType = params.serverType || 'stdio'

        // Normalize switch values (can be boolean or string)
        const isExisting = params.useExistingServer === true || params.useExistingServer === 'true'
        const isRawConfig = params.useRawConfig === true || params.useRawConfig === 'true'

        // Check if using raw JSON config
        if (isRawConfig && params.rawMcpConfig) {
          const { serverName: parsedName, serverConfig } = parseRawMcpConfig(params.rawMcpConfig)
          serverName = parsedName

          // Determine server type from config
          if (serverConfig.command) {
            serverType = 'stdio'
            config = {
              command: serverConfig.command,
              args: serverConfig.args || [],
              env: serverConfig.env || {},
            }
          } else if (serverConfig.endpoint) {
            serverType = 'sse'
            config = {
              endpoint: serverConfig.endpoint,
              headers: serverConfig.headers || {},
            }
          } else if (serverConfig.baseUrl) {
            serverType = 'http'
            config = {
              baseUrl: serverConfig.baseUrl,
              apiKey: serverConfig.apiKey,
              headers: serverConfig.headers || {},
            }
          } else {
            throw new Error(
              'Unable to determine server type from config. Expected "command" (stdio), "endpoint" (sse), or "baseUrl" (http)'
            )
          }
        } else if (params.serverType === 'stdio') {
          config = {
            command: params.stdioCommand,
            args: params.stdioArgs ? [params.stdioArgs] : [],
            env: envVars,
          }
        } else if (params.serverType === 'sse') {
          config = {
            endpoint: params.sseEndpoint,
            headers: convertTableToHeaders(params.sseHeaders),
          }
        } else if (params.serverType === 'http') {
          config = {
            baseUrl: params.httpBaseUrl,
            apiKey: params.httpApiKey,
            headers: convertTableToHeaders(params.httpHeaders),
          }
        }

        // If using existing server, return minimal params for connection actions
        if (isExisting && params.existingServerId) {
          // Extract workspaceId from params or _context
          const workspaceId = params.workspaceId || params._context?.workspaceId

          if (!workspaceId) {
            throw new Error('Workspace ID is required but not provided in execution context')
          }

          const result: any = {
            workspaceId: workspaceId,
            existingServerId: params.existingServerId,
            connectionAction: params.connectionAction || 'connect',
          }

          // Add tool execution info if tool selected
          if (params.selectedTool) {
            result.selectedTool = params.selectedTool
            // Handle toolParams: it might be a JSON string or already parsed object
            if (params.toolParams) {
              let parameters: any = {}
              try {
                if (typeof params.toolParams === 'string') {
                  parameters = params.toolParams.trim() ? JSON.parse(params.toolParams) : {}
                } else if (typeof params.toolParams === 'object' && params.toolParams !== null) {
                  parameters = params.toolParams
                }
              } catch (error) {
                throw new Error(
                  `Invalid JSON in Tool Parameters: ${error instanceof Error ? error.message : String(error)}`
                )
              }
              result.toolParams = parameters
            }
          }

          return result
        }

        // For new servers, return the parameters expected by mcp_create_server tool
        // Extract workspaceId from params or _context
        const workspaceId = params.workspaceId || params._context?.workspaceId

        if (!workspaceId) {
          throw new Error('Workspace ID is required but not provided in execution context')
        }

        const result: any = {
          workspaceId: workspaceId,
          serverName: serverName,
          serverType: serverType,
          config: config,
          settings: {
            timeout: Number.parseInt(params.timeout) || 30,
            retryAttempts: Number.parseInt(params.retryAttempts) || 3,
          },
        }

        // Add tool execution info if tool selected
        if (params.selectedTool) {
          result.selectedTool = params.selectedTool
          if (params.toolParams) {
            let parameters: any = {}
            try {
              if (typeof params.toolParams === 'string') {
                parameters = params.toolParams.trim() ? JSON.parse(params.toolParams) : {}
              } else if (typeof params.toolParams === 'object' && params.toolParams !== null) {
                parameters = params.toolParams
              }
            } catch (error) {
              throw new Error(
                `Invalid JSON in Tool Parameters: ${error instanceof Error ? error.message : String(error)}`
              )
            }
            result.toolParams = parameters
          }
        }

        // Add action if specified
        if (params.connectionAction) {
          result.connectionAction = params.connectionAction
        }

        return result
      },
    },
  },

  inputs: {
    workspaceId: { type: 'string', description: 'Workspace identifier (provided by context)' },
    serverName: { type: 'string', description: 'Name of the MCP server' },
    serverType: { type: 'string', description: 'Type of MCP connection' },
    config: { type: 'json', description: 'Server configuration parameters' },
    rawMcpConfig: {
      type: 'json',
      description: 'Raw MCP JSON configuration (Claude Desktop format)',
    },
    settings: { type: 'json', description: 'Connection and behavior settings' },
    execution: { type: 'json', description: 'Tool execution parameters' },
    action: { type: 'string', description: 'Connection management action' },
  },

  outputs: {
    serverId: { type: 'string', description: 'Unique server identifier' },
    serverName: { type: 'string', description: 'Server display name' },
    connectionStatus: { type: 'string', description: 'Current connection status' },
    availableTools: {
      type: 'json',
      description: 'Array of tools available from this server',
    },
    serverMetadata: {
      type: 'json',
      description: 'Server information and statistics',
    },
    executionResult: {
      type: 'json',
      description: 'Result from tool execution (if applicable)',
    },
    error: { type: 'string', description: 'Error message if operation failed' },
  },
}
