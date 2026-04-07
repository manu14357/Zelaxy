import OpenAI from 'openai'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import type { ProviderConfig, ProviderRequest, ProviderResponse } from '@/providers/types'

const logger = createLogger('NvidiaProvider')

// Default NVIDIA API configuration
const DEFAULT_NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1'

// NVIDIA provider configuration
export const nvidiaProvider: ProviderConfig = {
  id: 'nvidia',
  name: 'NVIDIA',
  description: 'NVIDIA NIM (NVIDIA Inference Microservices) API',
  version: '1.0.0',
  models: [
    'qwen/qwen3-coder-480b-a35b-instruct',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'nvidia/llama-3.1-nemotron-405b-instruct',
    'meta/llama-3.1-405b-instruct',
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.1-8b-instruct',
    'microsoft/phi-3-medium-4k-instruct',
    'microsoft/phi-3-mini-4k-instruct',
    'mistralai/mixtral-8x7b-instruct-v0.1',
    'mistralai/mistral-7b-instruct-v0.2',
    'google/gemma-2-9b-it',
    'google/gemma-2-27b-it',
  ],
  defaultModel: 'qwen/qwen3-coder-480b-a35b-instruct',
  executeRequest: async (request: ProviderRequest): Promise<ProviderResponse | ReadableStream> => {
    try {
      logger.info('Executing NVIDIA request', {
        model: request.model,
        stream: request.stream,
        hasContext: !!request.context,
        hasSystemPrompt: !!request.systemPrompt,
      })

      // Get API key from environment or request
      const apiKey = request.apiKey || env.NVIDIA_API_KEY
      if (!apiKey) {
        throw new Error('NVIDIA API key is required')
      }

      // Initialize OpenAI client with NVIDIA base URL
      const client = new OpenAI({
        apiKey,
        baseURL: DEFAULT_NVIDIA_API_URL,
      })

      // Build messages array
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

      // Add system prompt if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        })
      }

      // Add conversation messages
      if (request.messages && Array.isArray(request.messages)) {
        for (const msg of request.messages) {
          if (msg.content) {
            // Ensure content is not null/empty
            messages.push({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content,
            })
          }
        }
      }

      // Add context/user message if provided (this would be an additional message)
      if (request.context) {
        messages.push({
          role: 'user',
          content: request.context,
        })
      }

      // Prepare completion parameters
      const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: request.model || nvidiaProvider.defaultModel,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens && request.maxTokens >= 1 ? request.maxTokens : 4096,
        stream: request.stream ?? false,
        ...(request.topP !== undefined && { top_p: request.topP }),
        ...(request.presencePenalty !== undefined && { presence_penalty: request.presencePenalty }),
        ...(request.frequencyPenalty !== undefined && {
          frequency_penalty: request.frequencyPenalty,
        }),
      }

      logger.debug('NVIDIA API request params', {
        model: completionParams.model,
        messagesCount: messages.length,
        temperature: completionParams.temperature,
        maxTokens: completionParams.max_tokens,
        stream: completionParams.stream,
      })

      if (request.stream) {
        // Return streaming response
        const stream = await client.chat.completions.create({
          ...completionParams,
          stream: true,
        })

        return new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()

            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content
                if (content) {
                  // For direct LLM calls, just return the raw content
                  // The API route will handle SSE formatting
                  controller.enqueue(encoder.encode(content))
                }
              }
            } catch (error) {
              logger.error('NVIDIA streaming error:', error)
              throw error
            } finally {
              controller.close()
            }
          },
        })
      }
      // Non-streaming response
      const completion = (await client.chat.completions.create({
        ...completionParams,
        stream: false,
      })) as OpenAI.Chat.Completions.ChatCompletion

      const response: ProviderResponse = {
        content: completion.choices[0]?.message?.content || '',
        model: completion.model,
        tokens: completion.usage
          ? {
              prompt: completion.usage.prompt_tokens,
              completion: completion.usage.completion_tokens,
              total: completion.usage.total_tokens,
            }
          : undefined,
      }

      logger.info('NVIDIA request completed', {
        model: response.model,
        contentLength: response.content.length,
        tokens: response.tokens,
      })

      return response
    } catch (error) {
      logger.error('NVIDIA request failed:', error)
      throw new Error(
        `NVIDIA API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },
}
