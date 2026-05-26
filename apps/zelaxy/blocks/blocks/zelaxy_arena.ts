import { AgentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface ZelaxyArenaResponse {
  success: boolean
  output: {
    content: string
    model: string
    conversationId: string
    tokens: {
      prompt: number
      completion: number
      total: number
    }
    toolCalls?: Array<{
      id: string
      name: string
      arguments: Record<string, any>
      result?: any
    }>
    cost?: {
      input: number
      output: number
      total: number
      currency: string
    }
  }
}

export const ZelaxyArenaBlock: BlockConfig<ZelaxyArenaResponse> = {
  type: 'zelaxy-arena',
  name: 'ZelaxyArena',
  description: 'Stream AI completions via the ZelaxyArena execution engine',
  longDescription:
    'Execute AI model completions using the ZelaxyArena streaming engine. Supports multi-turn conversations, system prompts, tool calls, and full token cost tracking. The response is streamed in real time.',
  docsLink: '#',
  category: 'blocks',
  bgColor: '#7C3AED',
  icon: AgentIcon,
  subBlocks: [
    {
      id: 'model',
      title: 'Model',
      type: 'short-input',
      layout: 'half',
      placeholder: 'gpt-4o',
      required: true,
      description: 'Model identifier to use for the completion',
    },
    {
      id: 'conversationId',
      title: 'Conversation ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'conv_xxxxxxxx (leave blank to start a new conversation)',
      description: 'Reuse an existing conversation context; omit to create a new one',
    },
    {
      id: 'systemPrompt',
      title: 'System Prompt',
      type: 'long-input',
      layout: 'full',
      rows: 3,
      placeholder: 'You are a helpful assistant...',
      description: 'Optional system-level instructions for the model',
    },
    {
      id: 'messages',
      title: 'Messages',
      type: 'long-input',
      layout: 'full',
      rows: 4,
      placeholder: '[{"role": "user", "content": "Hello!"}]',
      required: true,
      description: 'JSON array of message objects with role and content fields',
    },
    {
      id: 'temperature',
      title: 'Temperature',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 2,
      step: 0.1,
      description: 'Sampling temperature (0 = deterministic, 2 = creative)',
    },
    {
      id: 'maxTokens',
      title: 'Max Tokens',
      type: 'short-input',
      layout: 'half',
      placeholder: '1024',
      description: 'Maximum tokens to generate in the response',
    },
    {
      id: 'stream',
      title: 'Enable Streaming',
      type: 'switch',
      layout: 'half',
      description: 'Stream the response token-by-token to the UI',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    model: {
      type: 'string',
      description: 'Model identifier for the completion',
    },
    conversationId: {
      type: 'string',
      description: 'Conversation ID for multi-turn context; omit for new conversation',
    },
    systemPrompt: {
      type: 'string',
      description: 'System-level prompt text',
    },
    messages: {
      type: 'json',
      description: 'Array of {role, content} message objects',
    },
    temperature: {
      type: 'number',
      description: 'Sampling temperature between 0 and 2',
    },
    maxTokens: {
      type: 'number',
      description: 'Maximum number of tokens to generate',
    },
    stream: {
      type: 'boolean',
      description: 'Whether to stream the response',
    },
  },
  outputs: {
    content: {
      type: 'string',
      description: 'Generated text content from the model',
    },
    model: {
      type: 'string',
      description: 'Model that was used for the completion',
    },
    conversationId: {
      type: 'string',
      description: 'Conversation ID to pass to subsequent turns',
    },
    tokens: {
      type: 'json',
      description: 'Token usage: { prompt, completion, total }',
    },
    toolCalls: {
      type: 'json',
      description: 'Tool calls made during the completion, if any',
    },
    cost: {
      type: 'json',
      description: 'Estimated cost breakdown: { input, output, total, currency }',
    },
  },
}
