import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { MCPService } from '@/services/mcp'

// POST /api/mcp/execute-tool - Execute a tool on an MCP server
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  try {
    const body = await request.json()
    const { serverId, toolName, parameters, workflowId } = body

    // Auth: use workflowId fallback for server-side tool execution
    const contextWorkflowId = workflowId || body._context?.workflowId
    const userId = await getUserId(requestId, contextWorkflowId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 })
    }

    if (!toolName) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 })
    }

    // Check if server is connected, if not, connect first
    const connection = MCPService.getConnection(serverId)
    if (!connection) {
      // Server not connected, try to connect
      const workspaceId = new URL(request.url).searchParams.get('workspaceId')
      if (!workspaceId) {
        return NextResponse.json(
          {
            error: 'Server is not connected and workspace ID is required to connect',
          },
          { status: 400 }
        )
      }

      try {
        console.log(`Server ${serverId} not connected, connecting now...`)
        await MCPService.connectServer(userId, workspaceId, serverId)
        console.log(`Server ${serverId} connected successfully`)
      } catch (connectError) {
        console.error('Failed to auto-connect server:', connectError)
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

    // Execute the tool
    const executionResult = await MCPService.executeTool(
      serverId,
      toolName,
      parameters || {},
      userId,
      contextWorkflowId
    )

    if (!executionResult.success) {
      return NextResponse.json(
        {
          serverId,
          toolName,
          error: executionResult.error,
          latency: executionResult.latency,
        },
        { status: 500 }
      )
    }

    // Get server info for response
    const workspaceId = new URL(request.url).searchParams.get('workspaceId')
    let serverName = serverId

    if (workspaceId) {
      try {
        const server = await MCPService.getServer(userId, workspaceId, serverId)
        serverName = server?.name || serverId
      } catch (error) {
        console.warn('Could not fetch server name:', error)
      }
    }

    return NextResponse.json({
      serverId,
      serverName,
      toolName,
      result: executionResult.result,
      latency: executionResult.latency,
      metadata: executionResult.metadata,
    })
  } catch (error) {
    console.error('Failed to execute tool:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute tool',
      },
      { status: 500 }
    )
  }
}
