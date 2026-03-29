import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import {
  createBadRequestResponse,
  createInternalServerErrorResponse,
  createRequestTracker,
  createUnauthorizedResponse,
} from '@/lib/copilot/auth'
import { ASK_MODE_SYSTEM_PROMPT, ENHANCED_DIRECT_CHAT_PROMPT } from '@/lib/copilot/prompts'
import { executeLocalTool, getToolsForMode } from '@/lib/copilot/tools/local-tools'
import { createLogger } from '@/lib/logs/console/logger'
import { toonEncodeForLLM } from '@/lib/toon/encoder'
import { getRotatingApiKey } from '@/lib/utils'
import { db } from '@/db'
import { copilotChats } from '@/db/schema'
import { executeProviderRequest } from '@/providers'

const logger = createLogger('DirectCopilotAPI')

// Schema for file attachments
const FileAttachmentSchema = z.object({
  id: z.string(),
  s3_key: z.string(),
  filename: z.string(),
  media_type: z.string(),
  size: z.number(),
})

// Schema for direct chat messages (simpler than full copilot)
const DirectChatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  userMessageId: z.string().optional(),
  chatId: z.string().optional(),
  workflowId: z.string().min(1, 'Workflow ID is required'),
  mode: z.enum(['agent', 'ask']).optional().default('agent'), // Agent mode includes tools
  createNewChat: z.boolean().optional().default(false),
  stream: z.boolean().optional().default(true),
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  customApiKey: z.string().optional(), // Optional custom API key from user
  fileAttachments: z.array(FileAttachmentSchema).optional(),
})

/**
 * POST /api/copilot/direct-chat
 * Direct LLM chat without Python service dependency
 */
export async function POST(req: NextRequest) {
  const tracker = createRequestTracker()

  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return createUnauthorizedResponse()
    }

    const authenticatedUserId = session.user.id

    const body = await req.json()
    const {
      message,
      userMessageId,
      chatId,
      workflowId,
      mode,
      createNewChat,
      stream,
      provider,
      model,
      customApiKey,
      fileAttachments,
    } = DirectChatMessageSchema.parse(body)

    logger.info(`[${tracker.requestId}] Processing direct copilot chat request`, {
      userId: authenticatedUserId,
      workflowId,
      chatId,
      provider,
      model,
      mode,
      stream,
      createNewChat,
      messageLength: message.length,
    })

    // Get or create chat
    let currentChat: any = null
    let conversationHistory: any[] = []
    let actualChatId = chatId

    if (chatId) {
      // Get existing chat
      const [chat] = await db
        .select()
        .from(copilotChats)
        .where(and(eq(copilotChats.id, chatId), eq(copilotChats.userId, authenticatedUserId)))
        .limit(1)

      if (chat) {
        currentChat = chat
        conversationHistory = Array.isArray(chat.messages) ? chat.messages : []
      }
    } else if (createNewChat && workflowId) {
      // Create new chat
      const [newChat] = await db
        .insert(copilotChats)
        .values({
          userId: authenticatedUserId,
          workflowId,
          title: null,
          model: `${provider}:${model}`, // Store provider:model format
          messages: [],
        })
        .returning()

      if (newChat) {
        currentChat = newChat
        actualChatId = newChat.id
        conversationHistory = []
      }
    }

    // Build messages for the LLM (system prompt is sent via the systemPrompt param, not in messages)
    const messages = []

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    })

    logger.info(`[${tracker.requestId}] Calling ${provider} provider directly`, {
      model,
      messageCount: messages.length,
    })

    // Get the appropriate API key for the provider (prefer custom API key if provided)
    let apiKey = customApiKey || '' // Use custom API key first

    // If no custom API key, fall back to environment variables
    if (!apiKey) {
      switch (provider) {
        case 'nvidia':
          apiKey = process.env.NVIDIA_API_KEY || ''
          break
        case 'anthropic':
          // Use rotating API keys for load balancing
          try {
            apiKey = getRotatingApiKey('anthropic')
          } catch {
            // Fallback to single key if rotation not configured
            apiKey = process.env.ANTHROPIC_API_KEY || ''
          }
          break
        case 'openai':
          // Use rotating API keys for load balancing
          try {
            apiKey = getRotatingApiKey('openai')
          } catch {
            // Fallback to single key if rotation not configured
            apiKey = process.env.OPENAI_API_KEY || ''
          }
          break
        case 'google':
          apiKey = process.env.GOOGLE_API_KEY || ''
          break
        case 'groq':
          apiKey = process.env.GROQ_API_KEY || ''
          break
        case 'deepseek':
          apiKey = process.env.DEEPSEEK_API_KEY || ''
          break
        case 'xai':
          apiKey = process.env.XAI_API_KEY || ''
          break
        case 'cerebras':
          apiKey = process.env.CEREBRAS_API_KEY || ''
          break
        case 'lmstudio':
          // LM Studio uses localhost OpenAI-compatible API, no key needed
          apiKey = 'lm-studio'
          break
        case 'ollama':
          // Ollama doesn't require an API key
          break
        default:
          logger.warn(`[${tracker.requestId}] Unknown provider: ${provider}`)
      }
    }

    // Log which API key source is being used (without exposing the key)
    if (customApiKey) {
      logger.info(`[${tracker.requestId}] Using custom API key for ${provider}`)
    } else if (apiKey) {
      logger.info(`[${tracker.requestId}] Using system API key for ${provider}`)
    } else {
      logger.info(`[${tracker.requestId}] No API key configured for ${provider}`)
    }

    // Fail early if no API key is available (except for local providers)
    const localProviders = ['ollama', 'lmstudio']
    if (!apiKey && !localProviders.includes(provider)) {
      logger.error(`[${tracker.requestId}] No API key available for ${provider}`)
      return NextResponse.json(
        {
          error: `No API key configured for ${provider}. Please add your API key in the LLM settings dialog, or configure ${provider.toUpperCase()}_API_KEY in your environment variables.`,
          provider,
          suggestion: 'Click the model selector dropdown and add your API key in Settings.',
        },
        { status: 400 }
      )
    }

    // Get tools for the current mode (both modes get tools, agent mode gets all, ask mode gets informational tools)
    const tools = getToolsForMode(mode as 'agent' | 'ask')

    logger.info(`[${tracker.requestId}] Tools configuration`, {
      mode,
      toolCount: tools?.length || 0,
      toolNames: tools?.map((t) => t.id) || [],
    })

    // Select system prompt based on mode
    const systemPrompt = mode === 'agent' ? ENHANCED_DIRECT_CHAT_PROMPT : ASK_MODE_SYSTEM_PROMPT

    // Call the provider directly with tools support for both modes
    const providerResponse = await executeProviderRequest(provider as any, {
      model,
      messages: messages as any,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4000,
      apiKey: apiKey,
      stream: stream,
      // Include tools for both modes
      ...(tools && tools.length > 0 && { tools }),
      workflowId,
      userId: authenticatedUserId,
      isCopilotRequest: true,
    })

    // Handle streaming response
    if (
      stream &&
      (providerResponse instanceof ReadableStream ||
        (typeof providerResponse === 'object' && providerResponse && 'stream' in providerResponse))
    ) {
      logger.info(`[${tracker.requestId}] Streaming response from ${provider}`)

      // Extract the actual stream
      const actualStream =
        providerResponse instanceof ReadableStream
          ? providerResponse
          : (providerResponse as any).stream

      // Create user message to save
      const userMessage = {
        id: userMessageId || crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        ...(fileAttachments && fileAttachments.length > 0 && { fileAttachments }),
      }

      // Create a pass-through stream that captures the response
      const transformedStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          let assistantContent = ''

          // Send chatId as first event
          if (actualChatId) {
            const chatIdEvent = `data: ${JSON.stringify({
              type: 'chat_id',
              chatId: actualChatId,
            })}\n\n`
            controller.enqueue(encoder.encode(chatIdEvent))
          }

          try {
            const reader = actualStream.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              assistantContent += chunk

              // Forward the chunk to the client
              const event = `data: ${JSON.stringify({
                type: 'content',
                data: chunk,
              })}\n\n`
              controller.enqueue(encoder.encode(event))
            }

            // Send completion event
            controller.enqueue(encoder.encode('data: {"type": "done"}\n\n'))
            controller.close()

            // Save messages to database
            if (actualChatId && (assistantContent.trim() || userMessage)) {
              const updatedMessages = [
                ...conversationHistory,
                userMessage,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date().toISOString(),
                },
              ]

              await db
                .update(copilotChats)
                .set({
                  messages: updatedMessages,
                  updatedAt: new Date(),
                })
                .where(eq(copilotChats.id, actualChatId))

              logger.info(`[${tracker.requestId}] Saved messages to chat ${actualChatId}`)
            }
          } catch (error) {
            logger.error(`[${tracker.requestId}] Error in stream processing:`, error)
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              error: 'Stream processing failed',
            })}\n\n`
            controller.enqueue(encoder.encode(errorEvent))
            controller.close()
          }
        },
      })

      return new Response(transformedStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Handle non-streaming response with potential tool calls (convert to SSE format for client compatibility)
    if (typeof providerResponse === 'object' && 'content' in providerResponse) {
      const userMessage = {
        id: userMessageId || crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        ...(fileAttachments && fileAttachments.length > 0 && { fileAttachments }),
      }

      let finalContent = providerResponse.content || ''
      const allToolResults: any[] = []
      let workflowState: any = null

      // Tool call loop - continue calling LLM until no more tool calls
      const MAX_TOOL_ITERATIONS = 10
      let currentResponse = providerResponse
      const conversationMessages = [...messages] // Clone messages for the loop
      let iteration = 0

      while (
        currentResponse.toolCalls &&
        currentResponse.toolCalls.length > 0 &&
        iteration < MAX_TOOL_ITERATIONS
      ) {
        iteration++
        logger.info(
          `[${tracker.requestId}] Tool call iteration ${iteration}: Processing ${currentResponse.toolCalls.length} tool calls`
        )

        // Execute all tool calls in this iteration
        const iterationToolResults: any[] = []
        const toolResultMessages: any[] = []

        for (const toolCall of currentResponse.toolCalls) {
          const toolCallId =
            (toolCall as any).id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

          logger.info(`[${tracker.requestId}] Executing tool: ${toolCall.name}`, {
            arguments: toolCall.arguments,
          })

          // Inject request context (workflowId, userId) into tool arguments
          // Many tools need these but the LLM doesn't have them in its tool schema
          const enrichedArguments = {
            ...toolCall.arguments,
            workflowId: toolCall.arguments.workflowId || workflowId,
            userId: toolCall.arguments.userId || authenticatedUserId,
          }

          const toolResult = await executeLocalTool(toolCall.name, enrichedArguments)

          iterationToolResults.push({
            toolId: toolCall.name,
            toolCallId,
            result: toolResult,
          })

          allToolResults.push({
            toolId: toolCall.name,
            toolCallId,
            result: toolResult,
          })

          logger.info(`[${tracker.requestId}] Tool result for ${toolCall.name}:`, {
            success: toolResult.success,
            hasData: !!toolResult.data,
          })

          // Extract workflowState from build_workflow or edit_workflow results
          if (
            (toolCall.name === 'build_workflow' || toolCall.name === 'edit_workflow') &&
            toolResult.success &&
            toolResult.data?.workflowState
          ) {
            workflowState = toolResult.data.workflowState
            logger.info(
              `[${tracker.requestId}] Extracted workflowState with ${Object.keys(workflowState.blocks || {}).length} blocks`
            )
          }

          // Build tool result message for the LLM
          // Smart truncation to prevent context_length_exceeded errors
          let resultContent = toolResult.success
            ? toonEncodeForLLM(toolResult.data || {})
            : `Error: ${toolResult.error}`

          // Use higher limits for important tools, lower for info tools
          const toolResultLimits: Record<string, number> = {
            get_blocks_metadata: 6000,
            search_documentation: 6000,
            get_user_workflow: 6000,
            get_blocks_and_tools: 4000,
            build_workflow: 2000,
            edit_workflow: 2000,
          }
          const MAX_TOOL_RESULT_LENGTH = toolResultLimits[toolCall.name] || 4000
          if (resultContent.length > MAX_TOOL_RESULT_LENGTH) {
            logger.info(
              `[${tracker.requestId}] Truncating large tool result for ${toolCall.name}: ${resultContent.length} -> ${MAX_TOOL_RESULT_LENGTH} chars`
            )
            // Try to truncate at a clean JSON boundary
            let truncated = resultContent.substring(0, MAX_TOOL_RESULT_LENGTH)
            const lastBrace = Math.max(truncated.lastIndexOf('}'), truncated.lastIndexOf(']'))
            if (lastBrace > MAX_TOOL_RESULT_LENGTH * 0.7) {
              truncated = truncated.substring(0, lastBrace + 1)
            }
            resultContent = `${truncated}\n... [truncated]`
          }

          toolResultMessages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: resultContent,
          })
        }

        // Add assistant message with tool calls to conversation
        conversationMessages.push({
          role: 'assistant',
          content: currentResponse.content || null,
          tool_calls: currentResponse.toolCalls.map((tc: any, idx: number) => ({
            id: iterationToolResults[idx]?.toolCallId || tc.id || `tool_${idx}`,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments || {}),
            },
          })),
        } as any)

        // Add tool result messages to conversation
        conversationMessages.push(...toolResultMessages)

        logger.info(
          `[${tracker.requestId}] Sending tool results back to LLM, conversation now has ${conversationMessages.length} messages`
        )

        // Call the LLM again with tool results
        // Dynamically reduce maxTokens based on conversation size to prevent context overflow
        const estimatedTokens = JSON.stringify(conversationMessages).length / 4
        const dynamicMaxTokens = Math.max(1000, Math.min(4000, 16000 - Math.ceil(estimatedTokens)))

        try {
          const nextResponse = await executeProviderRequest(provider as any, {
            model,
            messages: conversationMessages as any,
            systemPrompt,
            temperature: 0.7,
            maxTokens: dynamicMaxTokens,
            apiKey: apiKey,
            stream: false, // Use non-streaming for tool loop
            ...(tools && tools.length > 0 && { tools }),
            workflowId,
            userId: authenticatedUserId,
            isCopilotRequest: true,
          })

          if (typeof nextResponse === 'object' && 'content' in nextResponse) {
            currentResponse = nextResponse
            // Accumulate content from each iteration
            if (currentResponse.content) {
              finalContent = currentResponse.content
            }
            logger.info(`[${tracker.requestId}] LLM response after tools:`, {
              hasContent: !!currentResponse.content,
              contentLength: currentResponse.content?.length || 0,
              hasMoreToolCalls: !!(
                currentResponse.toolCalls && currentResponse.toolCalls.length > 0
              ),
              toolCallCount: currentResponse.toolCalls?.length || 0,
            })
          } else {
            logger.warn(
              `[${tracker.requestId}] Unexpected response format from LLM after tool calls`
            )
            break
          }
        } catch (toolLoopError: any) {
          // Handle context_length_exceeded by generating a response without tools
          const errorMessage = toolLoopError?.message || toolLoopError?.error?.message || ''
          if (
            errorMessage.includes('context_length_exceeded') ||
            errorMessage.includes('maximum context length')
          ) {
            logger.warn(
              `[${tracker.requestId}] Context length exceeded in tool loop iteration ${iteration}, generating final response without tools`
            )
            try {
              // Retry with minimal context: just the user message and a summary
              const summaryMessages = [
                { role: 'user' as const, content: message },
                {
                  role: 'assistant' as const,
                  content: `I have completed the requested operations. Here is a summary of what was done:\n${allToolResults.map((r) => (r.result.success ? `✅ ${r.toolId}: Success` : `❌ ${r.toolId}: ${r.result.error}`)).join('\n')}`,
                },
                {
                  role: 'user' as const,
                  content: 'Please provide a brief summary of what was accomplished.',
                },
              ]
              const retryResponse = await executeProviderRequest(provider as any, {
                model,
                messages: summaryMessages as any,
                systemPrompt:
                  'You are Agie, the AI assistant for Zelaxy. Summarize what was accomplished based on the tool results provided.',
                temperature: 0.7,
                maxTokens: 1000,
                apiKey: apiKey,
                stream: false,
                workflowId,
                userId: authenticatedUserId,
                isCopilotRequest: true,
              })
              if (typeof retryResponse === 'object' && 'content' in retryResponse) {
                finalContent =
                  retryResponse.content ||
                  allToolResults
                    .map((r) =>
                      r.result.success
                        ? `✅ **${r.toolId}**: Success`
                        : `❌ **${r.toolId}**: ${r.result.error}`
                    )
                    .join('\n')
              }
            } catch (retryError) {
              logger.error(`[${tracker.requestId}] Retry also failed:`, retryError)
              finalContent = `I completed the following operations:\n${allToolResults.map((r) => (r.result.success ? `✅ **${r.toolId}**: ${r.result.data?.message || 'Success'}` : `❌ **${r.toolId}**: ${r.result.error}`)).join('\n')}`
            }
            break // Exit the tool loop
          }
          throw toolLoopError // Re-throw non-context-length errors
        }
      }

      if (iteration >= MAX_TOOL_ITERATIONS) {
        logger.warn(
          `[${tracker.requestId}] Reached maximum tool iterations (${MAX_TOOL_ITERATIONS})`
        )
      }

      // Create SSE stream for client compatibility
      const sseStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()

          try {
            // Send chatId as first event
            if (actualChatId) {
              const chatIdEvent = `data: ${JSON.stringify({
                type: 'chat_id',
                chatId: actualChatId,
              })}\n\n`
              controller.enqueue(encoder.encode(chatIdEvent))
            }

            // Send tool call events for each tool - use consistent IDs
            for (let i = 0; i < allToolResults.length; i++) {
              const toolResult = allToolResults[i]
              const toolCallId = toolResult.toolCallId

              // Send tool_call event (store expects data.data with id, name, arguments)
              const toolStartEvent = `data: ${JSON.stringify({
                type: 'tool_call',
                data: {
                  id: toolCallId,
                  name: toolResult.toolId,
                  arguments: toolResult.result.data || {},
                },
              })}\n\n`
              controller.enqueue(encoder.encode(toolStartEvent))

              // Send tool_result event (store expects top-level toolCallId, result, success, error)
              const resultData = toolResult.result.data || {}
              const toolResultEvent = `data: ${JSON.stringify({
                type: 'tool_result',
                toolCallId: toolCallId,
                success: toolResult.result.success,
                result: typeof resultData === 'string' ? resultData : JSON.stringify(resultData),
                error: toolResult.result.error || null,
              })}\n\n`
              controller.enqueue(encoder.encode(toolResultEvent))
            }

            // Send final content from LLM
            if (finalContent) {
              const contentEvent = `data: ${JSON.stringify({
                type: 'content',
                data: finalContent,
              })}\n\n`
              controller.enqueue(encoder.encode(contentEvent))
            }

            // Send done event
            controller.enqueue(encoder.encode('data: {"type": "done"}\n\n'))
            controller.close()

            // Save messages to database after streaming completes
            if (actualChatId) {
              const assistantContent =
                finalContent +
                allToolResults
                  .map((r) =>
                    r.result.success
                      ? `\n\n✅ **${r.toolId}**: ${r.result.data?.message || 'Success'}`
                      : `\n\n❌ **${r.toolId}** failed: ${r.result.error}`
                  )
                  .join('')

              const updatedMessages = [
                ...conversationHistory,
                userMessage,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date().toISOString(),
                  ...(allToolResults.length > 0 && { toolCalls: allToolResults }),
                },
              ]

              await db
                .update(copilotChats)
                .set({
                  messages: updatedMessages,
                  updatedAt: new Date(),
                })
                .where(eq(copilotChats.id, actualChatId))
            }
          } catch (error) {
            logger.error(`[${tracker.requestId}] Error in SSE stream:`, error)
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              error: 'Stream processing failed',
            })}\n\n`
            controller.enqueue(encoder.encode(errorEvent))
            controller.close()
          }
        },
      })

      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    throw new Error('Unexpected provider response format')
  } catch (error) {
    logger.error(`[${tracker.requestId}] Error in direct chat:`, error)

    if (error instanceof z.ZodError) {
      return createBadRequestResponse(
        `Invalid request: ${error.errors.map((e) => e.message).join(', ')}`
      )
    }

    return createInternalServerErrorResponse('Failed to process direct chat request')
  }
}
