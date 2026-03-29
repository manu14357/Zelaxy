import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { MCPService } from '@/services/mcp'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  try {
    const { serverId } = await params
    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    // Auth: use workflowId fallback for server-side tool execution
    const workflowId = body.workflowId || body._context?.workflowId
    const userId = await getUserId(requestId, workflowId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await MCPService.connectServer(userId, workspaceId, serverId)

    // After successful connection, return server info and discovered tools
    let server = null
    let availableTools: any[] = []

    try {
      server = await MCPService.getServer(userId, workspaceId, serverId)
    } catch (e) {
      console.warn('Failed to fetch server details after connect:', e)
    }

    try {
      const tools = await MCPService.refreshServerTools(serverId)
      availableTools = tools.map((tool: any) => ({
        id: tool.toolId || tool.name,
        name: tool.name,
        description: tool.description || '',
        category: tool.category || [],
        inputSchema: tool.inputSchema || {},
        outputSchema: tool.outputSchema || {},
      }))
    } catch (e) {
      console.warn('Failed to discover tools after connect:', e)
    }

    return NextResponse.json({
      success: true,
      serverId,
      serverName: server?.name || 'Unknown',
      serverType: server?.type || 'unknown',
      connectionStatus: 'connected',
      availableTools,
      toolCount: availableTools.length,
    })
  } catch (error) {
    console.error('Failed to connect server:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const disconnectRequestId = crypto.randomUUID().slice(0, 8)
  try {
    const { serverId } = await params

    // For disconnect, try workflowId from query params since DELETE may not have body
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('workflowId') || undefined
    const userId = await getUserId(disconnectRequestId, workflowId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await MCPService.disconnectServer(serverId)

    return NextResponse.json({
      success: true,
      serverId,
      connectionStatus: 'disconnected',
    })
  } catch (error) {
    console.error('Failed to disconnect server:', error)
    return NextResponse.json({ error: 'Failed to disconnect server' }, { status: 500 })
  }
}
