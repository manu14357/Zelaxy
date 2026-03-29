import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { MCPService } from '@/services/mcp'

const updateServerSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string(),
    type: z.enum(['stdio', 'sse', 'http']),
    config: z.object({
      stdio: z
        .object({
          command: z.string(),
          args: z.array(z.string()).default([]),
          env: z.record(z.string()).default({}),
        })
        .optional(),
      sse: z
        .object({
          endpoint: z.string().url(),
          headers: z.record(z.string()).default({}),
        })
        .optional(),
      http: z
        .object({
          baseUrl: z.string().url(),
          apiKey: z.string().optional(),
          headers: z.record(z.string()).default({}),
        })
        .optional(),
    }),
    settings: z.object({
      autoReconnect: z.boolean(),
      timeout: z.number().min(5).max(300),
      retryAttempts: z.number().min(0).max(10),
      rateLimit: z.number().min(10).max(1000),
      logging: z.enum(['none', 'errors', 'all']),
      validateSSL: z.boolean(),
    }),
    toolConfig: z.object({
      autoDiscover: z.boolean(),
      refreshInterval: z.number().min(1).max(60),
      categories: z.array(z.string()),
    }),
    tags: z.array(z.string()),
  })
  .partial()

export async function GET(req: NextRequest, { params }: { params: Promise<{ serverId: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  try {
    // Get workspaceId from query parameter
    const url = new URL(req.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return Response.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    const { serverId } = await params
    if (!serverId) {
      return Response.json({ error: 'Server ID is required' }, { status: 400 })
    }

    // Auth: use workflowId from query params for server-side calls
    const workflowId = url.searchParams.get('workflowId') || undefined
    const userId = await getUserId(requestId, workflowId)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const server = await MCPService.getServer(userId, workspaceId, serverId)
    if (!server) {
      return Response.json({ error: 'Server not found' }, { status: 404 })
    }

    const tools = await MCPService.getServerTools(serverId)
    const executionHistory = await MCPService.getExecutionHistory(serverId, 20)

    return Response.json({
      server,
      tools,
      executionHistory,
    })
  } catch (error) {
    console.error('Failed to fetch MCP server:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ serverId: string }> }) {
  const putRequestId = crypto.randomUUID().slice(0, 8)
  try {
    // Get workspaceId from query parameter
    const url = new URL(req.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return Response.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    const { serverId } = await params
    if (!serverId) {
      return Response.json({ error: 'Server ID is required' }, { status: 400 })
    }

    const body = await req.json()

    // Auth: use workflowId fallback for server-side calls
    const workflowId =
      body.workflowId ||
      body._context?.workflowId ||
      url.searchParams.get('workflowId') ||
      undefined
    const putUserId = await getUserId(putRequestId, workflowId)
    if (!putUserId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validatedData = updateServerSchema.parse(body)

    const server = await MCPService.updateServer(putUserId, serverId, validatedData)
    if (!server) {
      return Response.json({ error: 'Server not found' }, { status: 404 })
    }

    return Response.json({ server })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Failed to update MCP server:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const deleteRequestId = crypto.randomUUID().slice(0, 8)
  try {
    // Get workspaceId from query parameter
    const url = new URL(req.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return Response.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    const { serverId } = await params
    if (!serverId) {
      return Response.json({ error: 'Server ID is required' }, { status: 400 })
    }

    // Auth: use workflowId from query params for server-side calls
    const workflowId = url.searchParams.get('workflowId') || undefined
    const deleteUserId = await getUserId(deleteRequestId, workflowId)
    if (!deleteUserId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await MCPService.deleteServer(deleteUserId, serverId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete MCP server:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
