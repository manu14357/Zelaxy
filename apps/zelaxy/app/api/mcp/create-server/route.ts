import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { MCPService } from '@/services/mcp'

const createServerRequestSchema = z.object({
  serverName: z.string().min(1).max(100),
  serverType: z.enum(['stdio', 'sse', 'http']),
  description: z.string().optional(),
  config: z.any(), // Allow any config structure, will be validated by MCPService
  settings: z
    .object({
      autoReconnect: z.boolean().optional(),
      timeout: z.number().optional(),
      retryAttempts: z.number().optional(),
      rateLimit: z.number().optional(),
      logging: z.enum(['none', 'errors', 'all']).optional(),
      validateSSL: z.boolean().optional(),
    })
    .optional(),
  toolConfig: z
    .object({
      autoDiscover: z.boolean().optional(),
      refreshInterval: z.number().optional(),
      categories: z.array(z.string()).optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  action: z.enum(['test', 'connect', 'create']).optional(),
})

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  try {
    const body = await req.json()

    // Get workspaceId from various sources
    let workspaceId = body.workspaceId || body._context?.workspaceId

    if (!workspaceId) {
      // Try to extract from URL path or headers
      const url = new URL(req.url)
      workspaceId = url.searchParams.get('workspaceId')

      if (!workspaceId) {
        // As fallback, try to get from headers
        workspaceId = req.headers.get('x-workspace-id')
      }
    }

    if (!workspaceId) {
      return Response.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    // Auth: use workflowId fallback for server-side tool execution
    const workflowId = body.workflowId || body._context?.workflowId
    const userId = await getUserId(requestId, workflowId)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validatedData = createServerRequestSchema.parse(body)

    // Create the server
    const server = await MCPService.createServer(userId, workspaceId, {
      name: validatedData.serverName,
      description: validatedData.description,
      type: validatedData.serverType,
      config: validatedData.config,
      settings: validatedData.settings,
      toolConfig: validatedData.toolConfig,
      tags: validatedData.tags,
    })

    // Handle the action if specified
    let connectionStatus = 'disconnected'
    let availableTools: any[] = []
    let errorMessage = ''

    if (validatedData.action === 'test' || validatedData.action === 'connect') {
      try {
        await MCPService.connectServer(userId, workspaceId, server.id)
        connectionStatus = 'connected'

        // Auto-discover tools after connecting
        try {
          const tools = await MCPService.refreshServerTools(server.id)
          availableTools = tools.map((tool) => ({
            id: tool.toolId,
            name: tool.name,
            description: tool.description || '',
            category: tool.category || [],
            inputSchema: tool.inputSchema || {},
            outputSchema: tool.outputSchema || {},
          }))
        } catch (toolError) {
          console.warn('Failed to auto-discover tools:', toolError)
        }
      } catch (connectError) {
        console.error('Failed to connect to server:', connectError)
        connectionStatus = 'error'
        errorMessage = connectError instanceof Error ? connectError.message : String(connectError)
      }
    }

    return Response.json({
      serverId: server.id,
      serverName: server.name,
      connectionStatus,
      availableTools,
      serverMetadata: {
        type: server.type,
        version: '',
        lastConnected: connectionStatus === 'connected' ? new Date().toISOString() : '',
        toolCount: availableTools.length,
        avgLatency: 0,
      },
      error: errorMessage || undefined,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Failed to create MCP server:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
