import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { MCPService } from '@/services/mcp'

const createServerSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
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
  settings: z
    .object({
      autoReconnect: z.boolean().default(true),
      timeout: z.number().min(5).max(300).default(30),
      retryAttempts: z.number().min(0).max(10).default(3),
      rateLimit: z.number().min(10).max(1000).default(60),
      logging: z.enum(['none', 'errors', 'all']).default('errors'),
      validateSSL: z.boolean().default(true),
    })
    .partial()
    .optional(),
  toolConfig: z
    .object({
      autoDiscover: z.boolean().default(true),
      refreshInterval: z.number().min(1).max(60).default(15),
      categories: z.array(z.string()).default([]),
    })
    .partial()
    .optional(),
  tags: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  try {
    // Get workspaceId from query parameter
    const url = new URL(req.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return Response.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    // Validate workspaceId format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(workspaceId)) {
      return Response.json({ error: 'Invalid workspace ID format' }, { status: 400 })
    }

    // Auth: use workflowId from query params for server-side calls
    const workflowId = url.searchParams.get('workflowId') || undefined
    const userId = await getUserId(requestId, workflowId)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const servers = await MCPService.getServers(userId, workspaceId)
    const stats = await MCPService.getServerStats(userId, workspaceId)

    return Response.json({ servers, stats })
  } catch (error) {
    console.error('Failed to fetch MCP servers:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const postRequestId = crypto.randomUUID().slice(0, 8)
  try {
    const body = await req.json()

    // Auth: use workflowId fallback for server-side tool execution
    const workflowId = body.workflowId || body._context?.workflowId
    const userId = await getUserId(postRequestId, workflowId)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const validatedData = createServerSchema.parse(body)

    // Validate config based on server type
    const config: any = {}
    if (validatedData.type === 'stdio' && validatedData.config.stdio) {
      config.stdio = validatedData.config.stdio
    } else if (validatedData.type === 'sse' && validatedData.config.sse) {
      config.sse = validatedData.config.sse
    } else if (validatedData.type === 'http' && validatedData.config.http) {
      config.http = validatedData.config.http
    } else {
      return Response.json(
        { error: `Configuration for ${validatedData.type} server type is required` },
        { status: 400 }
      )
    }

    const server = await MCPService.createServer(userId, validatedData.workspaceId, {
      ...validatedData,
      config,
    })

    return Response.json({ server }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Failed to create MCP server:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
