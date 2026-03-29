export interface MCPServerConfig {
  stdio?: {
    command: string
    args: string[]
    env: Record<string, string>
  }
  sse?: {
    endpoint: string
    headers: Record<string, string>
  }
  http?: {
    baseUrl: string
    apiKey: string
    headers: Record<string, string>
  }
}

export interface MCPServerSettings {
  autoReconnect: boolean
  timeout: number
  retryAttempts: number
  rateLimit: number
  logging: 'none' | 'errors' | 'all'
  validateSSL: boolean
}

export interface MCPToolConfig {
  autoDiscover: boolean
  refreshInterval: number
  categories: string[]
}

export interface MCPTool {
  id: string
  name: string
  description: string
  category: string[]
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  version?: string
  metadata?: {
    usageCount: number
    avgLatency: number
    successRate: number
  }
}

export interface MCPServer {
  id: string
  name: string
  type: 'stdio' | 'sse' | 'http'
  config: MCPServerConfig
  status: 'connected' | 'disconnected' | 'error'
  tools: MCPTool[]
  metadata: {
    created: Date
    lastConnected: Date
    version: string
    tags: string[]
  }
  settings: MCPServerSettings
}

export interface MCPConnectParams {
  workspaceId: string
  existingServerId: string
  connectionAction?: string
  _context?: { workflowId?: string; workspaceId?: string; chatId?: string }
}

export interface MCPDiscoverToolsParams {
  existingServerId: string
  workspaceId: string
  serverType?: 'stdio' | 'sse' | 'http'
  config?: MCPServerConfig[keyof MCPServerConfig]
  settings?: MCPServerSettings
  toolConfig?: MCPToolConfig
  _context?: { workflowId?: string; workspaceId?: string; chatId?: string }
}

export interface MCPExecuteToolParams {
  workspaceId: string
  existingServerId: string
  selectedTool: string
  toolParams?: string | object
  _context?: { workflowId?: string; workspaceId?: string; chatId?: string }
}

export interface MCPToolExecutionResult {
  toolName: string
  result: any
  success: boolean
  latency: number
  timestamp: string
  error?: string
}
