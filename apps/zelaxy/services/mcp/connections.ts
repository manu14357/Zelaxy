import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { MCPConnection, MCPServerTool } from './index'

/**
 * Utility: wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return promise

  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Real MCP connection implementation for stdio protocol
 */
export class StdioMCPConnection implements MCPConnection {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null
  private config: {
    command: string
    args: string[]
    env: Record<string, string>
  }
  private timeoutMs: number

  constructor(config: any, timeoutMs = 30000) {
    console.log('StdioMCPConnection config:', config)
    this.config = config
    this.timeoutMs = timeoutMs
  }

  async connect(): Promise<void> {
    try {
      console.log('Connecting with config:', this.config)

      // Handle both nested and flat config structures
      let actualConfig: any = this.config
      if ((this.config as any).stdio) {
        // Handle nested config like { stdio: { command: '...', args: [...] } }
        actualConfig = (this.config as any).stdio
      }

      if (!actualConfig.command) {
        throw new Error('Command is required for stdio connection')
      }

      // Create stdio transport - it handles spawning the process internally
      this.transport = new StdioClientTransport({
        command: actualConfig.command,
        args: actualConfig.args || [],
        env: {
          ...(Object.fromEntries(
            Object.entries(process.env).filter(([_, v]) => v !== undefined)
          ) as Record<string, string>),
          ...actualConfig.env,
        },
      })

      // Create client
      this.client = new Client(
        {
          name: 'zelaxy-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      )

      // Connect client to transport
      await withTimeout(this.client.connect(this.transport), this.timeoutMs, 'Stdio connection')
    } catch (error) {
      console.error('Failed to connect to MCP server:', error)
      throw new Error(`Failed to connect to MCP server: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await withTimeout(this.client.close(), 5000, 'Stdio disconnect')
        this.client = null
      }

      if (this.transport) {
        await this.transport.close()
        this.transport = null
      }
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  async listTools(): Promise<MCPServerTool[]> {
    if (!this.client) {
      throw new Error('Not connected to MCP server')
    }

    try {
      const response = (await withTimeout(
        this.client.listTools(),
        this.timeoutMs,
        'List tools'
      )) as any

      if (!response.tools || !Array.isArray(response.tools)) {
        return []
      }

      return response.tools.map((tool: any) => ({
        toolId: tool.name,
        name: tool.name,
        description: tool.description || '',
        category: tool.category || ['general'],
        inputSchema: tool.inputSchema || {},
        outputSchema: tool.outputSchema || {},
      }))
    } catch (error) {
      console.error('Error listing tools:', error)
      throw new Error(`Failed to list tools: ${error}`)
    }
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.client) {
      throw new Error('Not connected to MCP server')
    }

    try {
      const response = (await withTimeout(
        this.client.callTool({
          name: toolName,
          arguments: args,
        }),
        this.timeoutMs,
        `Call tool ${toolName}`
      )) as any

      return response.content || response
    } catch (error) {
      console.error('Error calling tool:', error)
      throw new Error(`Failed to call tool ${toolName}: ${error}`)
    }
  }

  async ping(): Promise<number> {
    if (!this.client) {
      throw new Error('Not connected to MCP server')
    }

    const start = Date.now()
    try {
      await this.client.ping()
      return Date.now() - start
    } catch (error) {
      // If ping is not supported, try listing tools as a health check
      try {
        await this.listTools()
        return Date.now() - start
      } catch (healthError) {
        throw new Error('Server not responding')
      }
    }
  }
}

/**
 * Real MCP connection implementation for SSE protocol
 */
export class SSEMCPConnection implements MCPConnection {
  private client: Client | null = null
  private transport: SSEClientTransport | null = null
  private config: {
    endpoint: string
    headers: Record<string, string>
  }
  private timeoutMs: number

  constructor(config: any, timeoutMs = 30000) {
    this.config = config
    this.timeoutMs = timeoutMs
  }

  async connect(): Promise<void> {
    try {
      // Handle both nested and flat config structures
      let actualConfig: any = this.config
      if ((this.config as any).sse) {
        // Handle nested config like { sse: { endpoint: '...', headers: {...} } }
        actualConfig = (this.config as any).sse
      }

      if (!actualConfig.endpoint) {
        throw new Error('Endpoint URL is required for SSE connection')
      }

      // Create SSE transport with proper options format
      const transportOptions: any = {}
      if (actualConfig.headers && Object.keys(actualConfig.headers).length > 0) {
        transportOptions.requestInit = {
          headers: actualConfig.headers,
        }
      }

      this.transport = new SSEClientTransport(new URL(actualConfig.endpoint), transportOptions)

      // Create client
      this.client = new Client(
        {
          name: 'zelaxy-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      )

      // Connect client to transport
      await withTimeout(this.client.connect(this.transport), this.timeoutMs, 'SSE connection')
    } catch (error) {
      console.error('Failed to connect to MCP server via SSE:', error)
      throw new Error(`Failed to connect to MCP server: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close()
        this.client = null
      }

      if (this.transport) {
        await this.transport.close()
        this.transport = null
      }
    } catch (error) {
      console.error('Error during SSE disconnect:', error)
    }
  }

  async listTools(): Promise<MCPServerTool[]> {
    if (!this.client) {
      throw new Error('Not connected to MCP server')
    }

    try {
      const response = (await this.client.listTools()) as any

      if (!response.tools || !Array.isArray(response.tools)) {
        return []
      }

      return response.tools.map((tool: any) => ({
        toolId: tool.name,
        name: tool.name,
        description: tool.description || '',
        category: tool.category || ['general'],
        inputSchema: tool.inputSchema || {},
        outputSchema: tool.outputSchema || {},
      }))
    } catch (error) {
      console.error('Error listing tools via SSE:', error)
      throw new Error(`Failed to list tools: ${error}`)
    }
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.client) {
      throw new Error('Not connected to MCP server')
    }

    try {
      const response = (await this.client.callTool({
        name: toolName,
        arguments: args,
      })) as any

      return response.content || response
    } catch (error) {
      console.error('Error calling tool via SSE:', error)
      throw new Error(`Failed to call tool ${toolName}: ${error}`)
    }
  }

  async ping(): Promise<number> {
    if (!this.client) {
      throw new Error('Not connected to MCP server')
    }

    const start = Date.now()
    try {
      await this.client.ping()
      return Date.now() - start
    } catch (error) {
      // If ping is not supported, try listing tools as a health check
      try {
        await this.listTools()
        return Date.now() - start
      } catch (healthError) {
        throw new Error('Server not responding')
      }
    }
  }
}

/**
 * Real MCP connection implementation for HTTP protocol
 */
export class HTTPMCPConnection implements MCPConnection {
  private config: {
    baseUrl: string
    apiKey?: string
    headers: Record<string, string>
  }
  private actualConfig: {
    baseUrl: string
    apiKey?: string
    headers: Record<string, string>
  }

  constructor(config: any, timeoutMs = 30000) {
    this.config = config
    // Handle both nested and flat config structures
    if ((config as any).http) {
      this.actualConfig = (config as any).http
    } else {
      this.actualConfig = config
    }
    this.timeoutMs = timeoutMs
  }

  private timeoutMs: number

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.actualConfig.apiKey && { Authorization: `Bearer ${this.actualConfig.apiKey}` }),
      ...(this.actualConfig.headers || {}),
    }
  }

  async connect(): Promise<void> {
    if (!this.actualConfig.baseUrl) {
      throw new Error('Base URL is required for HTTP connection')
    }

    // For HTTP, we don't need to maintain a persistent connection
    // We'll validate connectivity by making a test request
    try {
      const response = await fetch(`${this.actualConfig.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok && response.status !== 404) {
        // 404 is acceptable if the server doesn't have a health endpoint
        throw new Error(`HTTP connection failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      // If health endpoint doesn't exist, try listing tools as connectivity test
      try {
        await this.listTools()
      } catch (toolError) {
        throw new Error(`Failed to connect to HTTP MCP server: ${error}`)
      }
    }
  }

  async disconnect(): Promise<void> {
    // HTTP connections are stateless, nothing to disconnect
  }

  async listTools(): Promise<MCPServerTool[]> {
    try {
      const response = await fetch(`${this.actualConfig.baseUrl}/tools`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const tools = data.tools || data

      if (!Array.isArray(tools)) {
        return []
      }

      return tools.map((tool: any) => ({
        toolId: tool.name || tool.id,
        name: tool.name || tool.id,
        description: tool.description || '',
        category: tool.category || ['general'],
        inputSchema: tool.inputSchema || tool.schema || {},
        outputSchema: tool.outputSchema || {},
      }))
    } catch (error) {
      console.error('Error listing tools via HTTP:', error)
      throw new Error(`Failed to list tools: ${error}`)
    }
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.actualConfig.baseUrl}/tools/${toolName}/call`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ arguments: args }),
      })

      if (!response.ok) {
        throw new Error(`HTTP tool call failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error calling tool via HTTP:', error)
      throw new Error(`Failed to call tool ${toolName}: ${error}`)
    }
  }

  async ping(): Promise<number> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.actualConfig.baseUrl}/ping`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok && response.status !== 404) {
        throw new Error('Server not responding')
      }

      return Date.now() - start
    } catch (error) {
      // If ping endpoint doesn't exist, try listing tools as a health check
      try {
        await this.listTools()
        return Date.now() - start
      } catch (healthError) {
        throw new Error('Server not responding')
      }
    }
  }
}

/**
 * Real MCP connection implementation for Streamable HTTP protocol.
 * Uses the official MCP SDK StreamableHTTPClientTransport.
 * This is the modern replacement for SSE and supports servers that expose
 * an HTTP endpoint (e.g. { "url": "https://...", "transport": "http" }).
 */
export class StreamableHTTPMCPConnection implements MCPConnection {
  private client: Client | null = null
  private transport: StreamableHTTPClientTransport | null = null
  private config: any
  private timeoutMs: number

  constructor(config: any, timeoutMs = 30000) {
    this.config = config
    this.timeoutMs = timeoutMs
  }

  async connect(): Promise<void> {
    try {
      // Handle nested config like { streamableHttp: { url: '...', headers: {...} } }
      let actualConfig: any = this.config
      if (actualConfig.streamableHttp) {
        actualConfig = actualConfig.streamableHttp
      }

      const url = actualConfig.url || actualConfig.baseUrl || actualConfig.endpoint
      if (!url) {
        throw new Error('URL is required for Streamable HTTP connection')
      }

      // Build transport options with custom headers if provided
      const transportOptions: any = {}
      const headers = actualConfig.headers || {}
      if (Object.keys(headers).length > 0) {
        transportOptions.requestInit = { headers }
      }

      this.transport = new StreamableHTTPClientTransport(new URL(url), transportOptions)

      this.client = new Client({ name: 'zelaxy-client', version: '1.0.0' }, { capabilities: {} })

      await withTimeout(
        this.client.connect(this.transport),
        this.timeoutMs,
        'Streamable HTTP connection'
      )
    } catch (error) {
      console.error('Failed to connect to MCP server via Streamable HTTP:', error)
      throw new Error(`Failed to connect to MCP server: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close()
        this.client = null
      }
      if (this.transport) {
        await this.transport.close()
        this.transport = null
      }
    } catch (error) {
      console.error('Error during Streamable HTTP disconnect:', error)
    }
  }

  async listTools(): Promise<MCPServerTool[]> {
    if (!this.client) throw new Error('Not connected to MCP server')

    try {
      const response = (await withTimeout(
        this.client.listTools(),
        this.timeoutMs,
        'List tools'
      )) as any

      if (!response.tools || !Array.isArray(response.tools)) return []

      return response.tools.map((tool: any) => ({
        toolId: tool.name,
        name: tool.name,
        description: tool.description || '',
        category: tool.category || ['general'],
        inputSchema: tool.inputSchema || {},
        outputSchema: tool.outputSchema || {},
      }))
    } catch (error) {
      console.error('Error listing tools via Streamable HTTP:', error)
      throw new Error(`Failed to list tools: ${error}`)
    }
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.client) throw new Error('Not connected to MCP server')

    try {
      const response = (await withTimeout(
        this.client.callTool({ name: toolName, arguments: args }),
        this.timeoutMs,
        `Call tool ${toolName}`
      )) as any

      return response.content || response
    } catch (error) {
      console.error('Error calling tool via Streamable HTTP:', error)
      throw new Error(`Failed to call tool ${toolName}: ${error}`)
    }
  }

  async ping(): Promise<number> {
    if (!this.client) throw new Error('Not connected to MCP server')

    const start = Date.now()
    try {
      await this.client.ping()
      return Date.now() - start
    } catch {
      try {
        await this.listTools()
        return Date.now() - start
      } catch {
        throw new Error('Server not responding')
      }
    }
  }
}

/**
 * Factory function to create appropriate connection type
 */
export function createMCPConnection(type: string, config: any, timeoutMs = 30000): MCPConnection {
  switch (type) {
    case 'stdio':
      return new StdioMCPConnection(config, timeoutMs)
    case 'sse':
      return new SSEMCPConnection(config, timeoutMs)
    case 'http':
      return new HTTPMCPConnection(config, timeoutMs)
    case 'streamable-http':
      return new StreamableHTTPMCPConnection(config, timeoutMs)
    default:
      throw new Error(`Unsupported MCP connection type: ${type}`)
  }
}
