export interface AgentInputs {
  model?: string
  responseFormat?: string | object
  tools?: ToolInput[]
  /** Attached Agent Skills (progressive disclosure via the load_skill tool). */
  skills?: Array<{ id?: string; name: string; description?: string }>

  systemPrompt?: string
  userPrompt?: string | object
  memories?: any
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  presencePenalty?: number
  frequencyPenalty?: number
  timeout?: number
  customInstructions?: string
  apiKey?: string
  azureEndpoint?: string
  azureApiVersion?: string
  /** Base URL override for self-hosted OpenAI-compatible providers (vLLM, LiteLLM, Baseten). */
  baseUrl?: string
  files?: import('@/executor/types').UserFile[]
}

export interface ToolInput {
  type?: string
  schema?: any
  title?: string
  code?: string
  params?: Record<string, any>
  timeout?: number
  usageControl?: 'auto' | 'force' | 'none'
  operation?: string
  toolId?: string
  // MCP-specific fields
  mcpServerId?: string
  mcpServerConfig?: {
    serverType: 'stdio' | 'sse' | 'http'
    command?: string
    args?: string[]
    env?: Record<string, string>
    endpoint?: string
    baseUrl?: string
    apiKey?: string
    headers?: Record<string, string>
  }
  mcpRawConfig?: string // Raw JSON config (Claude Desktop format)
}

/** A single part of a multimodal message (OpenAI vision format). */
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
  | { type: 'file'; file: { filename: string; file_data: string } }

export interface Message {
  role: 'system' | 'user' | 'assistant'
  /** Plain string OR multimodal content array (text + image_url parts). */
  content: string | ContentPart[]
  function_call?: any
  tool_calls?: any[]
}

export interface StreamingConfig {
  shouldUseStreaming: boolean
  isBlockSelectedForOutput: boolean
  hasOutgoingConnections: boolean
}
