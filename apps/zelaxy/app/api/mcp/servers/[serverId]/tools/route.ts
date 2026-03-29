import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { MCPService } from '@/services/mcp'

// GET /api/mcp/servers/[serverId]/tools - Get tools for a server
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  try {
    const { serverId } = await params

    // Auth: use workflowId from query params for server-side calls
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('workflowId') || undefined
    const userId = await getUserId(requestId, workflowId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tools = await MCPService.getServerTools(serverId)

    return NextResponse.json({ tools })
  } catch (error: any) {
    // Return 404 for "not found" type errors, 500 for unexpected ones
    const isNotFound =
      error?.message?.toLowerCase().includes('not found') || error?.code === 'P2025' // Prisma/Drizzle not found
    if (!isNotFound) {
      console.error('Failed to get server tools:', error)
    }
    return NextResponse.json(
      { error: 'Failed to get server tools' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}

// POST /api/mcp/servers/[serverId]/tools - Refresh tools for a server
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const refreshRequestId = crypto.randomUUID().slice(0, 8)
  try {
    const { serverId } = await params

    // Auth: use workflowId from body for server-side calls
    let workflowId: string | undefined
    try {
      const body = await request.json()
      workflowId = body.workflowId || body._context?.workflowId
    } catch {}
    const refreshUserId = await getUserId(refreshRequestId, workflowId)
    if (!refreshUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tools = await MCPService.refreshServerTools(serverId)

    return NextResponse.json({ tools })
  } catch (error) {
    console.error('Failed to refresh tools:', error)
    return NextResponse.json({ error: 'Failed to refresh tools' }, { status: 500 })
  }
}
