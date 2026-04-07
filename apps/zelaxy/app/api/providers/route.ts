import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { registerMCPService, registerMCPToolId } from '@/lib/mcp-service-registry'
import type { StreamingExecution } from '@/executor/types'
import { executeProviderRequest } from '@/providers'
import { getApiKey } from '@/providers/utils'
import { MCPService } from '@/services/mcp'

// Register MCPService so that tools/index.ts and other shared modules
// can access it without importing @/services/mcp (which pulls in child_process).
registerMCPService(MCPService)

const logger = createLogger('ProvidersAPI')

const MCP_TOOL_PREFIX = 'mcp_'

export const dynamic = 'force-dynamic'

/**
 * Expand MCP tools by connecting to the server and discovering actual tools.
 * This converts MCP tool placeholders into real tool definitions that the LLM can use.
 */
async function expandMCPTools(
  tools: any[],
  workflowId: string | undefined,
  workspaceId: string | undefined,
  requestId: string
): Promise<any[]> {
  if (!tools || tools.length === 0) return tools

  const expandedTools: any[] = []

  for (const tool of tools) {
    // Check if this is an MCP tool that needs expansion
    if (tool.type === 'mcp') {
      logger.info(`[${requestId}] Expanding MCP tool`, {
        hasExistingServerId: !!tool.params?.existingServerId,
        hasRawConfig: !!tool.params?.rawMcpConfig,
        useExistingServer: tool.params?.useExistingServer,
      })

      try {
        const params = tool.params || {}
        const usageControl = tool.usageControl || 'auto'

        // Determine server ID
        let serverId: string | undefined
        const isExisting = params.useExistingServer === true || params.useExistingServer === 'true'
        const isRawConfig = params.useRawConfig === true || params.useRawConfig === 'true'

        if (isExisting && params.existingServerId) {
          serverId = params.existingServerId
          logger.info(`[${requestId}] Using existing MCP server: ${serverId}`)
        } else if (isRawConfig && params.rawMcpConfig) {
          // Parse and create temporary server from raw config
          serverId = await createMCPServerFromRawConfig(params.rawMcpConfig, workspaceId, requestId)
        }

        if (!serverId) {
          logger.warn(`[${requestId}] No MCP server ID available, skipping tool expansion`)
          continue
        }

        // Ensure server is connected
        let connection = MCPService.getConnection(serverId)
        if (!connection && workspaceId) {
          logger.info(`[${requestId}] Connecting to MCP server: ${serverId}`)
          try {
            await MCPService.connectServer('system', workspaceId, serverId)
            connection = MCPService.getConnection(serverId)
          } catch (connectError) {
            logger.error(`[${requestId}] Failed to connect to MCP server`, {
              serverId,
              error: connectError instanceof Error ? connectError.message : String(connectError),
            })
            continue
          }
        }

        if (!connection) {
          logger.warn(`[${requestId}] No connection available for MCP server: ${serverId}`)
          continue
        }

        // Discover tools directly from the connection
        // (avoids DB operations that would fail for temporary servers)
        const mcpTools = await connection.listTools()

        if (!mcpTools || mcpTools.length === 0) {
          logger.warn(`[${requestId}] No tools discovered from MCP server: ${serverId}`)
          continue
        }

        logger.info(
          `[${requestId}] Discovered ${mcpTools.length} tools from MCP server: ${serverId}`
        )

        // Transform MCP tools to provider-compatible format
        // Use a short, OpenAI-safe tool ID (^[a-zA-Z0-9_-]{1,64}$) and register
        // the mapping so executeMCPTool can look up serverId + toolName later.
        for (const mcpTool of mcpTools) {
          // Build a short unique tool ID: mcp_<8-char-hash>_<toolName>
          const shortHash = crypto.randomUUID().replace(/-/g, '').substring(0, 8)
          const toolId = `${MCP_TOOL_PREFIX}${shortHash}_${mcpTool.name}`

          // Register mapping from toolId → { serverId, toolName }
          registerMCPToolId(toolId, { serverId, toolName: mcpTool.name })

          expandedTools.push({
            id: toolId,
            name: mcpTool.name,
            description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
            params: {},
            parameters: mcpTool.inputSchema || { type: 'object', properties: {} },
            usageControl,
            _mcpMetadata: {
              serverId,
              toolName: mcpTool.name,
              workspaceId,
            },
          })
        }
      } catch (error) {
        logger.error(`[${requestId}] Error expanding MCP tools`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    } else {
      // Non-MCP tool, keep as-is
      expandedTools.push(tool)
    }
  }

  return expandedTools
}

/**
 * Create a temporary MCP server connection from raw JSON config (Claude Desktop format).
 * Connects directly without creating a DB record to avoid foreign-key constraints.
 * Returns a synthetic serverId that can be used to look up the in-memory connection.
 */
async function createMCPServerFromRawConfig(
  rawConfig: string | object,
  workspaceId: string | undefined,
  requestId: string
): Promise<string | undefined> {
  try {
    let parsed: any
    if (typeof rawConfig === 'string') {
      parsed = rawConfig.trim() ? JSON.parse(rawConfig) : {}
    } else {
      parsed = rawConfig
    }

    let serverName: string
    let serverConfig: any

    // Handle { "mcpServers": { "name": { ... } } } wrapper
    if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
      const serverNames = Object.keys(parsed.mcpServers)
      if (serverNames.length === 0) {
        throw new Error('No server found in mcpServers configuration')
      }
      serverName = serverNames[0]
      serverConfig = parsed.mcpServers[serverName]
    } else if (parsed.command || parsed.endpoint || parsed.baseUrl || parsed.url) {
      serverName = parsed.name || `mcp-temp-${Date.now()}`
      serverConfig = parsed
    } else {
      throw new Error('Invalid MCP config format')
    }

    // Determine server type and build config object
    let serverType = 'stdio'
    let config: any = {}

    if (serverConfig.command) {
      // Stdio: { "command": "uvx", "args": [...] }
      serverType = 'stdio'
      config = {
        stdio: {
          command: serverConfig.command,
          args: serverConfig.args || [],
          env: serverConfig.env || {},
        },
      }
    } else if (serverConfig.url) {
      // URL-based server: { "url": "https://...", "transport": "http"|"sse", "headers": {...} }
      // Use StreamableHTTP transport (official MCP SDK transport for HTTP servers)
      const transport = serverConfig.transport || 'http'
      if (transport === 'sse') {
        serverType = 'sse'
        config = {
          sse: {
            endpoint: serverConfig.url,
            headers: serverConfig.headers || {},
          },
        }
      } else {
        // "http" or "streamable-http" → use StreamableHTTPClientTransport
        serverType = 'streamable-http'
        config = {
          streamableHttp: {
            url: serverConfig.url,
            headers: serverConfig.headers || {},
          },
        }
      }
    } else if (serverConfig.endpoint) {
      // SSE: { "endpoint": "https://..." }
      serverType = 'sse'
      config = {
        sse: {
          endpoint: serverConfig.endpoint,
          headers: serverConfig.headers || {},
        },
      }
    } else if (serverConfig.baseUrl) {
      // Legacy HTTP: { "baseUrl": "https://..." }
      serverType = 'http'
      config = {
        http: {
          baseUrl: serverConfig.baseUrl,
          apiKey: serverConfig.apiKey,
          headers: serverConfig.headers || {},
        },
      }
    }

    logger.info(`[${requestId}] Creating MCP connection`, {
      serverName,
      serverType,
      hasHeaders: !!(serverConfig.headers && Object.keys(serverConfig.headers).length > 0),
    })

    // Use createMCPConnection directly — no DB record needed
    const { createMCPConnection } = await import('@/services/mcp/connections')
    const connection = createMCPConnection(serverType, config, 30_000)

    // Connect
    await connection.connect()

    // Generate a synthetic server ID and register the connection in MCPService
    const serverId = `temp_${serverName}_${Date.now()}`
    MCPService.registerConnection(serverId, connection)

    logger.info(`[${requestId}] Connected temporary MCP server: ${serverId} (${serverName})`)

    return serverId
  } catch (error) {
    logger.error(`[${requestId}] Error creating MCP server from raw config`, {
      error: error instanceof Error ? error.message : String(error),
    })
    return undefined
  }
}

/**
 * Server-side proxy for provider requests
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const startTime = Date.now()

  try {
    logger.info(`[${requestId}] Provider API request started`, {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent'),
      contentType: request.headers.get('Content-Type'),
    })

    const body = await request.json()
    const {
      provider,
      model,
      systemPrompt,
      context,
      tools,
      temperature,
      maxTokens,
      topP,
      topK,
      presencePenalty,
      frequencyPenalty,
      apiKey,
      azureEndpoint,
      azureApiVersion,
      responseFormat,
      workflowId,
      stream,
      messages,
      environmentVariables,
    } = body

    logger.info(`[${requestId}] Provider request details`, {
      provider,
      model,
      hasSystemPrompt: !!systemPrompt,
      hasContext: !!context,
      hasTools: !!tools?.length,
      toolCount: tools?.length || 0,
      hasApiKey: !!apiKey,
      hasAzureEndpoint: !!azureEndpoint,
      hasAzureApiVersion: !!azureApiVersion,
      hasResponseFormat: !!responseFormat,
      workflowId,
      stream: !!stream,
      hasMessages: !!messages?.length,
      messageCount: messages?.length || 0,
      hasEnvironmentVariables:
        !!environmentVariables && Object.keys(environmentVariables).length > 0,
    })

    let finalApiKey: string
    try {
      finalApiKey = getApiKey(provider, model, apiKey)
    } catch (error) {
      logger.error(`[${requestId}] Failed to get API key:`, {
        provider,
        model,
        error: error instanceof Error ? error.message : String(error),
        hasProvidedApiKey: !!apiKey,
      })
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API key error' },
        { status: 400 }
      )
    }

    logger.info(`[${requestId}] Executing provider request`, {
      provider,
      model,
      workflowId,
      hasApiKey: !!finalApiKey,
    })

    // Expand MCP tools if present - this discovers actual tools from MCP servers
    // Extract workspaceId from body, URL params, or try to get it from the workflow
    let workspaceId = body.workspaceId || new URL(request.url).searchParams.get('workspaceId')

    // If workspaceId is not available but workflowId is, try to get it from the workflow
    if (!workspaceId && workflowId && tools?.some((t: any) => t.type === 'mcp')) {
      try {
        const { db } = await import('@/db')
        const { workflow } = await import('@/db/schema')
        const { eq } = await import('drizzle-orm')
        const result = await db
          .select({ workspaceId: workflow.workspaceId })
          .from(workflow)
          .where(eq(workflow.id, workflowId))
          .limit(1)
        if (result.length > 0 && result[0].workspaceId) {
          workspaceId = result[0].workspaceId
          logger.info(`[${requestId}] Retrieved workspaceId from workflow: ${workspaceId}`)
        }
      } catch (error) {
        logger.warn(`[${requestId}] Could not retrieve workspaceId from workflow`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const expandedTools = await expandMCPTools(
      tools,
      workflowId,
      workspaceId || undefined,
      requestId
    )

    logger.info(`[${requestId}] Tools after MCP expansion`, {
      originalToolCount: tools?.length || 0,
      expandedToolCount: expandedTools?.length || 0,
      hasMCPTools: tools?.some((t: any) => t.type === 'mcp') || false,
    })

    // Execute provider request directly with the managed key
    const response = await executeProviderRequest(provider, {
      model,
      systemPrompt,
      context,
      tools: expandedTools,
      temperature,
      maxTokens,
      topP,
      topK,
      presencePenalty,
      frequencyPenalty,
      apiKey: finalApiKey,
      azureEndpoint,
      azureApiVersion,
      responseFormat,
      workflowId,
      stream,
      messages,
      environmentVariables,
    })

    const executionTime = Date.now() - startTime
    logger.info(`[${requestId}] Provider request completed successfully`, {
      provider,
      model,
      workflowId,
      executionTime,
      responseType:
        response instanceof ReadableStream
          ? 'stream'
          : response && typeof response === 'object' && 'stream' in response
            ? 'streaming-execution'
            : 'json',
    })

    // Check if the response is a StreamingExecution
    if (
      response &&
      typeof response === 'object' &&
      'stream' in response &&
      'execution' in response
    ) {
      const streamingExec = response as StreamingExecution
      logger.info(`[${requestId}] Received StreamingExecution from provider`)

      // Extract the stream and execution data
      const stream = streamingExec.stream
      const executionData = streamingExec.execution

      // Attach the execution data as a custom header
      // We need to safely serialize the execution data to avoid circular references
      let executionDataHeader
      try {
        // Create a safe version of execution data with the most important fields
        const safeExecutionData = {
          success: executionData.success,
          output: {
            // Sanitize content to remove non-ASCII characters that would cause ByteString errors
            content: executionData.output?.content
              ? String(executionData.output.content).replace(/[\u0080-\uFFFF]/g, '')
              : '',
            model: executionData.output?.model,
            tokens: executionData.output?.tokens || {
              prompt: 0,
              completion: 0,
              total: 0,
            },
            // Sanitize any potential Unicode characters in tool calls
            toolCalls: executionData.output?.toolCalls
              ? sanitizeToolCalls(executionData.output.toolCalls)
              : undefined,
            providerTiming: executionData.output?.providerTiming,
            cost: executionData.output?.cost,
          },
          error: executionData.error,
          logs: [], // Strip logs from header to avoid encoding issues
          metadata: {
            startTime: executionData.metadata?.startTime,
            endTime: executionData.metadata?.endTime,
            duration: executionData.metadata?.duration,
          },
          isStreaming: true, // Always mark streaming execution data as streaming
          blockId: executionData.logs?.[0]?.blockId,
          blockName: executionData.logs?.[0]?.blockName,
          blockType: executionData.logs?.[0]?.blockType,
        }
        executionDataHeader = JSON.stringify(safeExecutionData)
      } catch (error) {
        logger.error(`[${requestId}] Failed to serialize execution data:`, error)
        executionDataHeader = JSON.stringify({
          success: executionData.success,
          error: 'Failed to serialize full execution data',
        })
      }

      // Return the stream with execution data in a header
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Execution-Data': executionDataHeader,
        },
      })
    }

    // Check if the response is a ReadableStream for streaming
    if (response instanceof ReadableStream) {
      logger.info(`[${requestId}] Streaming response from provider`)
      return new Response(response, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Return regular JSON response for non-streaming
    return NextResponse.json(response)
  } catch (error) {
    const executionTime = Date.now() - startTime
    logger.error(`[${requestId}] Provider request failed:`, {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
      executionTime,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * Helper function to sanitize tool calls to remove Unicode characters
 */
function sanitizeToolCalls(toolCalls: any) {
  // If it's an object with a list property, sanitize the list
  if (toolCalls && typeof toolCalls === 'object' && Array.isArray(toolCalls.list)) {
    return {
      ...toolCalls,
      list: toolCalls.list.map(sanitizeToolCall),
    }
  }

  // If it's an array, sanitize each item
  if (Array.isArray(toolCalls)) {
    return toolCalls.map(sanitizeToolCall)
  }

  return toolCalls
}

/**
 * Sanitize a single tool call to remove Unicode characters
 */
function sanitizeToolCall(toolCall: any) {
  if (!toolCall || typeof toolCall !== 'object') return toolCall

  // Create a sanitized copy
  const sanitized = { ...toolCall }

  // Sanitize any string fields that might contain Unicode
  if (typeof sanitized.name === 'string') {
    sanitized.name = sanitized.name.replace(/[\u0080-\uFFFF]/g, '')
  }

  // Sanitize input/arguments
  if (sanitized.input && typeof sanitized.input === 'object') {
    sanitized.input = sanitizeObject(sanitized.input)
  }

  if (sanitized.arguments && typeof sanitized.arguments === 'object') {
    sanitized.arguments = sanitizeObject(sanitized.arguments)
  }

  // Sanitize output/result
  if (sanitized.output && typeof sanitized.output === 'object') {
    sanitized.output = sanitizeObject(sanitized.output)
  }

  if (sanitized.result && typeof sanitized.result === 'object') {
    sanitized.result = sanitizeObject(sanitized.result)
  }

  // Sanitize error message
  if (typeof sanitized.error === 'string') {
    sanitized.error = sanitized.error.replace(/[\u0080-\uFFFF]/g, '')
  }

  return sanitized
}

/**
 * Recursively sanitize an object to remove Unicode characters from strings
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  // Handle objects
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = value.replace(/[\u0080-\uFFFF]/g, '')
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value)
    } else {
      result[key] = value
    }
  }

  return result
}
