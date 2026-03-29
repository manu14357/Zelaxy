import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { mcpServers, mcpServerTools, mcpToolExecutions } from '@/db/schema'
import { createMCPConnection } from './connections'

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
    apiKey?: string
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

export interface MCPServerToolConfig {
  autoDiscover: boolean
  refreshInterval: number
  categories: string[]
}

export interface MCPServerMetadata {
  lastConnected?: string
  toolCount: number
  avgLatency: number
  version?: string
}

export interface MCPServerInput {
  name: string
  description?: string
  type: 'stdio' | 'sse' | 'http'
  config: MCPServerConfig
  settings?: Partial<MCPServerSettings>
  toolConfig?: Partial<MCPServerToolConfig>
  tags?: string[]
}

export interface MCPServerTool {
  toolId: string
  name: string
  description?: string
  category: string[]
  inputSchema?: Record<string, any>
  outputSchema?: Record<string, any>
}

// MCP Connection interface for handling actual server connections
export interface MCPConnection {
  connect(): Promise<void>
  disconnect(): Promise<void>
  listTools(): Promise<MCPServerTool[]>
  callTool(toolName: string, args: Record<string, any>): Promise<any>
  ping(): Promise<number> // Returns latency in ms
}

export class MCPService {
  // In-memory connection registry
  private static connections = new Map<string, MCPConnection>()

  /**
   * Register an externally-created connection (e.g. for temporary/raw-config servers
   * that don't have a DB record).
   */
  static registerConnection(serverId: string, connection: MCPConnection): void {
    MCPService.connections.set(serverId, connection)
  }

  /**
   * Create a temporary in-memory MCP server connection from config.
   * Does NOT insert into the database — suitable for ephemeral workflow executions.
   * Returns the generated serverId.
   */
  static async createTemporaryServer(
    serverName: string,
    serverType: string,
    config: any,
    timeoutMs = 30_000
  ): Promise<string> {
    const serverId = `temp_${serverName}_${Date.now()}`
    const connection = createMCPConnection(serverType, config, timeoutMs)
    await connection.connect()
    MCPService.connections.set(serverId, connection)
    return serverId
  }

  // Server Management
  static async createServer(userId: string, workspaceId: string, serverData: MCPServerInput) {
    const defaultSettings: MCPServerSettings = {
      autoReconnect: true,
      timeout: 30,
      retryAttempts: 3,
      rateLimit: 60,
      logging: 'errors',
      validateSSL: true,
    }

    const defaultToolConfig: MCPServerToolConfig = {
      autoDiscover: true,
      refreshInterval: 15,
      categories: [],
    }

    const defaultMetadata: MCPServerMetadata = {
      toolCount: 0,
      avgLatency: 0,
    }

    const [server] = await db
      .insert(mcpServers)
      .values({
        userId,
        workspaceId,
        name: serverData.name,
        description: serverData.description,
        type: serverData.type,
        config: serverData.config,
        settings: { ...defaultSettings, ...serverData.settings },
        toolConfig: { ...defaultToolConfig, ...serverData.toolConfig },
        metadata: defaultMetadata,
        tags: serverData.tags || [],
      })
      .returning()

    return server
  }

  // Reconcile DB state with in-memory connection state
  // Servers showing 'connected' in DB but not in the connections Map are stale
  private static async reconcileConnectionState(servers: any[]): Promise<any[]> {
    const staleServerIds: string[] = []

    for (const server of servers) {
      if (
        (server.status === 'connected' || server.status === 'connecting') &&
        !MCPService.connections.has(server.id)
      ) {
        staleServerIds.push(server.id)
      }
    }

    if (staleServerIds.length > 0) {
      console.log(`Reconciling ${staleServerIds.length} stale MCP server connections`)

      // Batch update stale servers to disconnected
      for (const serverId of staleServerIds) {
        await MCPService.updateServerStatus(serverId, 'disconnected')
      }

      // Update the returned list to reflect corrected state
      return servers.map((server) =>
        staleServerIds.includes(server.id) ? { ...server, status: 'disconnected' } : server
      )
    }

    return servers
  }

  static async getServers(userId: string, workspaceId: string) {
    const servers = await db
      .select()
      .from(mcpServers)
      .where(
        and(
          eq(mcpServers.userId, userId),
          eq(mcpServers.workspaceId, workspaceId),
          eq(mcpServers.isActive, true)
        )
      )
      .orderBy(desc(mcpServers.createdAt))

    // Reconcile stale connections (DB says connected but in-memory Map is empty)
    return await MCPService.reconcileConnectionState(servers)
  }

  static async getServer(userId: string, workspaceId: string, serverId: string) {
    const [server] = await db
      .select()
      .from(mcpServers)
      .where(
        and(
          eq(mcpServers.id, serverId),
          eq(mcpServers.userId, userId),
          eq(mcpServers.workspaceId, workspaceId),
          eq(mcpServers.isActive, true)
        )
      )

    return server
  }

  static async updateServer(userId: string, serverId: string, updates: Partial<MCPServerInput>) {
    const [server] = await db
      .update(mcpServers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(mcpServers.id, serverId), eq(mcpServers.userId, userId)))
      .returning()

    return server
  }

  static async deleteServer(userId: string, serverId: string) {
    // Disconnect first if connected
    await MCPService.disconnectServer(serverId)

    // Soft delete by setting isActive to false
    await db
      .update(mcpServers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(mcpServers.id, serverId), eq(mcpServers.userId, userId)))
  }

  // Server Connection Management
  static async connectServer(
    userId: string,
    workspaceId: string,
    serverIdOrName: string
  ): Promise<void> {
    // Resolve the actual server ID
    const serverId = await MCPService.resolveServerId(userId, workspaceId, serverIdOrName)

    const server = await MCPService.getServer(userId, workspaceId, serverId)
    if (!server) throw new Error('Server not found')

    try {
      // Update status to connecting
      await MCPService.updateServerStatus(serverId, 'connecting')

      // Create real MCP connection based on server type
      // The config is already the specific config for the server type (not nested)
      const connectionConfig = server.config
      const settings = server.settings as MCPServerSettings
      const timeoutMs = (settings?.timeout || 30) * 1000

      console.log('Connecting to MCP server:', {
        serverId,
        type: server.type,
        config: connectionConfig,
        timeoutMs,
      })

      const connection = createMCPConnection(server.type, connectionConfig, timeoutMs)

      // Connect to the server
      await connection.connect()

      // Store connection in registry
      MCPService.connections.set(serverId, connection)

      // Update server status and metadata
      await MCPService.updateServerStatus(serverId, 'connected', {
        lastConnected: new Date().toISOString(),
      })

      // Auto-discover tools if enabled
      const toolConfig = server.toolConfig as MCPServerToolConfig
      if (toolConfig?.autoDiscover) {
        await MCPService.refreshServerTools(serverId)
      }
    } catch (error) {
      await MCPService.updateServerStatus(serverId, 'error')
      throw error
    }
  }

  static async disconnectServer(serverId: string): Promise<void> {
    const connection = MCPService.connections.get(serverId)

    if (connection) {
      try {
        await connection.disconnect()
      } catch (error) {
        console.error(`Error disconnecting server ${serverId}:`, error)
      }
      MCPService.connections.delete(serverId)
    }

    // Skip DB update for temporary in-memory servers (they have no DB record)
    if (!serverId.startsWith('temp_')) {
      await MCPService.updateServerStatus(serverId, 'disconnected')
    }
  }

  static async refreshServerTools(serverId: string): Promise<MCPServerTool[]> {
    const connection = MCPService.connections.get(serverId)
    if (!connection) {
      throw new Error('Server not connected')
    }

    try {
      const tools = await connection.listTools()
      await MCPService.saveServerTools(serverId, tools)

      // Return transformed tools for UI
      return tools
    } catch (error) {
      console.error(`Error refreshing tools for server ${serverId}:`, error)
      throw error
    }
  }

  /**
   * List tools from a connected server without persisting to the database.
   * Useful for temporary/in-memory servers that have no DB record.
   */
  static async listServerTools(serverId: string): Promise<MCPServerTool[]> {
    const connection = MCPService.connections.get(serverId)
    if (!connection) {
      throw new Error('Server not connected')
    }
    return await connection.listTools()
  }

  private static async updateServerStatus(
    serverId: string,
    status: 'connected' | 'disconnected' | 'error' | 'connecting' | null,
    metadata?: Partial<MCPServerMetadata>
  ) {
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Only set status if explicitly provided (not null)
    if (status !== null && status !== undefined) {
      updateData.status = status
    }

    if (metadata) {
      // Merge with existing metadata using COALESCE to handle null metadata
      updateData.metadata = sql`COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(metadata)}::jsonb`
    }

    await db.update(mcpServers).set(updateData).where(eq(mcpServers.id, serverId))
  }

  // Update only metadata without changing status
  private static async updateServerMetadata(
    serverId: string,
    metadata: Partial<MCPServerMetadata>
  ) {
    await MCPService.updateServerStatus(serverId, null, metadata)
  }

  // Tool Management
  private static async saveServerTools(serverId: string, tools: MCPServerTool[]) {
    // Wrap in a transaction to prevent race conditions during concurrent refreshes
    return await db.transaction(async (tx) => {
      // First, remove existing tools
      await tx.delete(mcpServerTools).where(eq(mcpServerTools.serverId, serverId))

      if (tools.length === 0) {
        // Update server metadata with tool count (without changing status)
        await MCPService.updateServerMetadata(serverId, { toolCount: 0 })
        return []
      }

      // Insert new tools
      const toolsData = tools.map((tool) => ({
        serverId,
        toolId: tool.toolId,
        name: tool.name,
        description: tool.description || null,
        category: tool.category || [],
        inputSchema: tool.inputSchema || {},
        outputSchema: tool.outputSchema || {},
        lastDiscovered: new Date(),
      }))

      const savedTools = await tx.insert(mcpServerTools).values(toolsData).returning()

      // Update server metadata with tool count (without changing status)
      await MCPService.updateServerMetadata(serverId, { toolCount: tools.length })

      return savedTools
    })
  }

  static async getServerTools(serverId: string) {
    return await db
      .select()
      .from(mcpServerTools)
      .where(and(eq(mcpServerTools.serverId, serverId), eq(mcpServerTools.isEnabled, true)))
      .orderBy(mcpServerTools.name)
  }

  static async getAllTools(userId: string, workspaceId: string) {
    return await db
      .select({
        tool: mcpServerTools,
        server: mcpServers,
      })
      .from(mcpServerTools)
      .innerJoin(mcpServers, eq(mcpServers.id, mcpServerTools.serverId))
      .where(
        and(
          eq(mcpServers.userId, userId),
          eq(mcpServers.workspaceId, workspaceId),
          eq(mcpServers.isActive, true),
          eq(mcpServerTools.isEnabled, true)
        )
      )
      .orderBy(mcpServers.name, mcpServerTools.name)
  }

  // Tool Execution Tracking
  static async logToolExecution(
    serverId: string,
    toolId: string,
    userId: string,
    parameters: any,
    result: any,
    success: boolean,
    latency: number,
    workflowId?: string,
    error?: string
  ) {
    const [execution] = await db
      .insert(mcpToolExecutions)
      .values({
        serverId,
        toolId,
        userId,
        workflowId,
        parameters,
        result,
        success,
        latency,
        error,
      })
      .returning()

    // Update server average latency
    const avgLatencyResult = await db
      .select({
        avgLatency: sql<number>`AVG(${mcpToolExecutions.latency})::int`,
      })
      .from(mcpToolExecutions)
      .where(and(eq(mcpToolExecutions.serverId, serverId), eq(mcpToolExecutions.success, true)))

    if (avgLatencyResult[0]?.avgLatency) {
      await MCPService.updateServerMetadata(serverId, {
        avgLatency: avgLatencyResult[0].avgLatency,
      })
    }

    return execution
  }

  static async getExecutionHistory(serverId: string, limit = 50) {
    return await db
      .select()
      .from(mcpToolExecutions)
      .where(eq(mcpToolExecutions.serverId, serverId))
      .orderBy(desc(mcpToolExecutions.executedAt))
      .limit(limit)
  }

  // Analytics
  static async getServerStats(userId: string, workspaceId: string) {
    const stats = await db
      .select({
        totalServers: sql<number>`COUNT(*)::int`,
        connectedServers: sql<number>`COUNT(*) FILTER (WHERE status = 'connected')::int`,
        totalTools: sql<number>`COALESCE(SUM((metadata->>'toolCount')::int), 0)::int`,
        avgLatency: sql<number>`COALESCE(AVG((metadata->>'avgLatency')::int), 0)::int`,
      })
      .from(mcpServers)
      .where(
        and(
          eq(mcpServers.userId, userId),
          eq(mcpServers.workspaceId, workspaceId),
          eq(mcpServers.isActive, true)
        )
      )

    return (
      stats[0] || {
        totalServers: 0,
        connectedServers: 0,
        totalTools: 0,
        avgLatency: 0,
      }
    )
  }

  static getConnection(serverId: string): MCPConnection | null {
    return MCPService.connections.get(serverId) || null
  }

  // Tool Execution
  static async executeTool(
    serverId: string,
    toolName: string,
    parameters: Record<string, any>,
    userId: string,
    workflowId?: string
  ): Promise<{
    success: boolean
    result?: any
    error?: string
    latency: number
    metadata?: any
  }> {
    const startTime = Date.now()

    try {
      // Get the connection
      const connection = MCPService.connections.get(serverId)
      if (!connection) {
        throw new Error(`Server ${serverId} is not connected. Please connect to the server first.`)
      }

      // Execute the tool
      const result = await connection.callTool(toolName, parameters)
      const latency = Date.now() - startTime

      // Log the execution
      await MCPService.logToolExecution(
        serverId,
        toolName, // Use toolName as toolId for now
        userId,
        parameters,
        result,
        true, // success
        latency,
        workflowId
      )

      return {
        success: true,
        result,
        latency,
      }
    } catch (error) {
      const latency = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Log the failed execution
      await MCPService.logToolExecution(
        serverId,
        toolName,
        userId,
        parameters,
        null,
        false, // failed
        latency,
        workflowId,
        errorMessage
      )

      return {
        success: false,
        error: errorMessage,
        latency,
      }
    }
  }

  // Helper function to resolve server by ID or name
  static async resolveServerId(
    userId: string,
    workspaceId: string,
    serverIdOrName: string
  ): Promise<string> {
    // First try to get by ID
    try {
      const serverById = await MCPService.getServer(userId, workspaceId, serverIdOrName)
      if (serverById) {
        return serverById.id
      }
    } catch (error) {
      // Ignore error, try by name
    }

    // Try to get by name
    try {
      const servers = await db
        .select()
        .from(mcpServers)
        .where(
          and(
            eq(mcpServers.userId, userId),
            eq(mcpServers.workspaceId, workspaceId),
            eq(mcpServers.name, serverIdOrName)
          )
        )

      if (servers.length > 0) {
        return servers[0].id
      }
    } catch (error) {
      console.error('Error resolving server by name:', error)
    }

    throw new Error(`Server not found with ID or name: ${serverIdOrName}`)
  }
}
