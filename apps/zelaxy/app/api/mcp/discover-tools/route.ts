import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { MCPService } from '@/services/mcp'

// POST /api/mcp/discover-tools - Discover tools from an MCP server
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  try {
    const body = await request.json()
    const { serverId, workspaceId } = body

    // Auth: use workflowId fallback for server-side tool execution
    const workflowId = body.workflowId || body._context?.workflowId
    const userId = await getUserId(requestId, workflowId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 })
    }

    // Get workspace ID from body or query params
    const resolvedWorkspaceId = workspaceId || new URL(request.url).searchParams.get('workspaceId')

    if (!resolvedWorkspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    // Resolve the server ID (could be a name)
    const resolvedServerId = await MCPService.resolveServerId(userId, resolvedWorkspaceId, serverId)

    // Ensure server is connected
    const connection = MCPService.getConnection(resolvedServerId)
    if (!connection) {
      // Auto-connect if not connected
      try {
        await MCPService.connectServer(userId, resolvedWorkspaceId, resolvedServerId)
      } catch (connectError) {
        return NextResponse.json(
          {
            error: `Server is not connected and auto-connect failed: ${
              connectError instanceof Error ? connectError.message : String(connectError)
            }`,
          },
          { status: 500 }
        )
      }
    }

    // Refresh/discover tools
    const tools = await MCPService.refreshServerTools(resolvedServerId)

    // Get server info for response
    const server = await MCPService.getServer(userId, resolvedWorkspaceId, resolvedServerId)

    return NextResponse.json({
      serverId: resolvedServerId,
      serverName: server?.name || serverId,
      connectionStatus: 'connected',
      tools: tools.map((tool) => ({
        toolId: tool.toolId,
        name: tool.name,
        description: tool.description || '',
        category: tool.category || ['general'],
        inputSchema: tool.inputSchema || {},
        outputSchema: tool.outputSchema || {},
        version: '1.0',
        metadata: {
          usageCount: 0,
          avgLatency: 0,
          successRate: 100,
        },
      })),
      discoveredAt: new Date().toISOString(),
      totalTools: tools.length,
    })
  } catch (error) {
    console.error('Failed to discover tools:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to discover tools',
      },
      { status: 500 }
    )
  }
}
