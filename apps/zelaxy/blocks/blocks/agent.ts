import { AgentIcon } from '@/components/icons'
import { isHosted } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import type { BlockConfig } from '@/blocks/types'
import {
  getAllModelProviders,
  getBaseModelProviders,
  getHostedModels,
  getProviderIcon,
  MODELS_TEMP_RANGE_0_1,
  MODELS_TEMP_RANGE_0_2,
  MODELS_WITH_TEMPERATURE_SUPPORT,
  providers,
} from '@/providers/utils'

// Get current Ollama models dynamically
const getCurrentOllamaModels = () => {
  return useOllamaStore.getState().models
}

import { useOllamaStore } from '@/stores/ollama/store'

const logger = createLogger('AgentBlock')

const getToolIdFromBlock = (blockType: string): string | undefined => {
  try {
    const { getAllBlocks } = require('@/blocks/registry')
    const blocks = getAllBlocks()
    const block = blocks.find(
      (b: { type: string; tools?: { access?: string[] } }) => b.type === blockType
    )
    return block?.tools?.access?.[0]
  } catch (error) {
    logger.error('Error getting tool ID from block', { error, blockType })
    return undefined
  }
}

export const AgentBlock: BlockConfig = {
  type: 'agent',
  name: 'Agent',
  description: 'Build AI agents with LLM capabilities and tool use',
  longDescription:
    'Create AI agents powered by LLMs with support for tools, structured output, file processing, and all major providers (OpenAI, Anthropic, Google, and more).',
  docsLink: 'https://docs.zelaxy.dev/blocks/advanced-agent',
  category: 'blocks',
  bgColor: '#FFFFFF',
  icon: AgentIcon,
  subBlocks: [
    {
      id: 'systemPrompt',
      title: 'System Prompt',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter system prompt...',
      rows: 8,
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `You are an expert prompt engineer. Create a clear, effective system prompt based on the user's requirements.

### CONTEXT
{context}

Create a system prompt that defines the agent's role, behavior, and constraints. Be specific and practical.`,
        placeholder: 'Describe the AI agent you want to create...',
        generationType: 'system-prompt',
      },
    },
    {
      id: 'userPrompt',
      title: 'User Message',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter user message or instructions...',
      rows: 4,
      wandConfig: {
        enabled: true,
        prompt: 'Enhance this user prompt for better clarity and effectiveness',
        placeholder: 'Describe what you want the agent to do...',
      },
    },
    {
      id: 'memories',
      title: 'Persistent Memory',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Connect memory block output for conversation continuity...',
      mode: 'advanced',
    },
    {
      id: 'model',
      title: 'AI Model',
      type: 'combobox',
      layout: 'half',
      placeholder: 'Select or type a model name...',
      required: true,
      options: () => {
        const ollamaModels = useOllamaStore.getState().models
        const baseModels = Object.keys(getBaseModelProviders())
        const allModels = [...baseModels, ...ollamaModels]

        return allModels.map((model) => {
          const icon = getProviderIcon(model)
          return { label: model, id: model, ...(icon && { icon }) }
        })
      },
    },
    {
      id: 'timeout',
      title: 'Timeout (seconds)',
      type: 'slider',
      layout: 'half',
      min: 10,
      max: 300,
      step: 10,
      mode: 'advanced',
    },
    {
      id: 'temperature',
      title: 'Temperature (Creativity)',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 1,
      step: 0.1,
      condition: {
        field: 'model',
        value: MODELS_TEMP_RANGE_0_1,
      },
    },
    {
      id: 'temperature',
      title: 'Temperature (Creativity)',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 2,
      step: 0.1,
      condition: {
        field: 'model',
        value: MODELS_TEMP_RANGE_0_2,
      },
    },
    {
      id: 'temperature',
      title: 'Temperature (Creativity)',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 2,
      step: 0.1,
      condition: {
        field: 'model',
        value: [...MODELS_TEMP_RANGE_0_1, ...MODELS_TEMP_RANGE_0_2],
        not: true,
        and: {
          field: 'model',
          value: Object.keys(getBaseModelProviders()).filter(
            (model) => !MODELS_WITH_TEMPERATURE_SUPPORT.includes(model)
          ),
          not: true,
        },
      },
    },
    {
      id: 'topP',
      title: 'Top-P (Nucleus Sampling)',
      type: 'slider',
      layout: 'half',
      min: 0.1,
      max: 1,
      step: 0.1,
      mode: 'advanced',
    },
    {
      id: 'topK',
      title: 'Top-K (Token Sampling)',
      type: 'slider',
      layout: 'half',
      min: 1,
      max: 100,
      step: 1,
      mode: 'advanced',
    },
    {
      id: 'maxTokens',
      title: 'Max Output Tokens',
      type: 'slider',
      layout: 'half',
      min: 100,
      max: 8192,
      step: 1,
      mode: 'advanced',
    },
    {
      id: 'presencePenalty',
      title: 'Presence Penalty',
      type: 'slider',
      layout: 'half',
      min: -2,
      max: 2,
      step: 0.1,
      mode: 'advanced',
    },
    {
      id: 'frequencyPenalty',
      title: 'Frequency Penalty',
      type: 'slider',
      layout: 'half',
      min: -2,
      max: 2,
      step: 0.1,
      mode: 'advanced',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your API key',
      password: true,
      connectionDroppable: false,
      required: true,
      // Hide API key for hosted models and Ollama models
      condition: isHosted
        ? {
            field: 'model',
            value: getHostedModels(),
            not: true, // Show for all models EXCEPT those listed
          }
        : () => ({
            field: 'model',
            value: getCurrentOllamaModels(),
            not: true, // Show for all models EXCEPT Ollama models
          }),
    },
    {
      id: 'azureEndpoint',
      title: 'Azure OpenAI Endpoint',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'https://your-resource.openai.azure.com',
      connectionDroppable: false,
      condition: {
        field: 'model',
        value: providers['azure-openai'].models,
      },
    },
    {
      id: 'azureApiVersion',
      title: 'Azure API Version',
      type: 'short-input',
      layout: 'full',
      placeholder: '2024-07-01-preview',
      connectionDroppable: false,
      condition: {
        field: 'model',
        value: providers['azure-openai'].models,
      },
    },
    {
      id: 'tools',
      title: 'Tools & Capabilities',
      type: 'tool-input',
      layout: 'full',
    },
    {
      id: 'enableOcr',
      title: 'Enable OCR (Extract Text)',
      type: 'switch',
      layout: 'full',
      description:
        'Extract text from images and PDFs using OCR instead of sending files directly to the LLM. Supports PNG, JPG, WEBP, TIFF, BMP, GIF, and PDF files.',
    },
    {
      id: 'enableStreaming',
      title: 'Enable Streaming',
      type: 'switch',
      layout: 'half',
      mode: 'advanced',
    },
    {
      id: 'customInstructions',
      title: 'Custom Instructions',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Additional behavioral instructions, constraints, or preferences...',
      rows: 3,
      mode: 'advanced',
    },
    {
      id: 'responseFormat',
      title: 'Response Format',
      type: 'code',
      layout: 'full',
      placeholder: 'Enter JSON schema...',
      language: 'json',
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `You are an expert programmer specializing in creating JSON schemas according to a specific format.
Generate ONLY the JSON schema based on the user's request.
The output MUST be a single, valid JSON object, starting with { and ending with }.
The JSON object MUST have the following top-level properties: 'name' (string), 'description' (string), 'strict' (boolean, usually true), and 'schema' (object).
The 'schema' object must define the structure and MUST contain 'type': 'object', 'properties': {...}, 'additionalProperties': false, and 'required': [...].
Inside 'properties', use standard JSON Schema properties (type, description, enum, items for arrays, etc.).

Current schema: {context}

Do not include any explanations, markdown formatting, or other text outside the JSON object.

Valid Schema Examples:

Example 1:
{
    "name": "reddit_post",
    "description": "Fetches the reddit posts in the given subreddit",
    "strict": true,
    "schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "The title of the post"
            },
            "content": {
                "type": "string",
                "description": "The content of the post"
            }
        },
        "additionalProperties": false,
        "required": [ "title", "content" ]
    }
}

Example 2:
{
    "name": "get_weather",
    "description": "Fetches the current weather for a specific location.",
    "strict": true,
    "schema": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The city and state, e.g., San Francisco, CA"
            },
            "unit": {
                "type": "string",
                "description": "Temperature unit",
                "enum": ["celsius", "fahrenheit"]
            }
        },
        "additionalProperties": false,
        "required": ["location", "unit"]
    }
}

Example 3 (Array Input):
{
    "name": "process_items",
    "description": "Processes a list of items with specific IDs.",
    "strict": true,
    "schema": {
        "type": "object",
        "properties": {
            "item_ids": {
                "type": "array",
                "description": "A list of unique item identifiers to process.",
                "items": {
                    "type": "string",
                    "description": "An item ID"
                }
            },
            "processing_mode": {
                "type": "string",
                "description": "The mode for processing",
                "enum": ["fast", "thorough"]
            }
        },
        "additionalProperties": false,
        "required": ["item_ids", "processing_mode"]
    }
}
`,
        placeholder: 'Describe the JSON schema structure you need...',
        generationType: 'json-schema',
      },
    },
  ],
  tools: {
    access: [
      'openai_chat',
      'anthropic_chat',
      'google_chat',
      'xai_chat',
      'deepseek_chat',
      'deepseek_reasoner',
      'cohere_chat',
      'mistral_chat',
      'perplexity_chat',
    ],
    config: {
      tool: (params: Record<string, any>) => {
        const model = params.model || 'gpt-4o'

        if (!model) {
          throw new Error('No model selected')
        }

        const selectedTool = getAllModelProviders()[model]

        if (!selectedTool) {
          const availableModels = Object.keys(getAllModelProviders()).join(', ')
          throw new Error(`Invalid model selected: ${model}. Available models: ${availableModels}`)
        }

        return selectedTool
      },
      params: (params: Record<string, any>) => {
        const sanitizedParams = sanitizeParameters(params)

        const processedParams: any = {
          ...sanitizedParams,
        }

        // Tool processing
        if (sanitizedParams.tools && Array.isArray(sanitizedParams.tools)) {
          processedParams.tools = sanitizedParams.tools
            .filter((tool: any) => {
              const usageControl = tool.usageControl || 'auto'
              return usageControl !== 'none' && tool.title && tool.type
            })
            .map((tool: any) => ({
              id:
                tool.type === 'custom-tool'
                  ? tool.schema?.function?.name
                  : tool.operation || getToolIdFromBlock(tool.type),
              name: tool.title,
              description:
                tool.type === 'custom-tool'
                  ? tool.schema?.function?.description
                  : tool.description || `Tool for ${tool.title}`,
              params: tool.params || {},
              parameters: tool.type === 'custom-tool' ? tool.schema?.function?.parameters : {},
              usageControl: tool.usageControl || 'auto',
            }))
        }

        return processedParams
      },
    },
  },
  inputs: {
    systemPrompt: { type: 'string', description: 'System instructions for the agent' },
    userPrompt: { type: 'string', description: 'User message or context' },
    customInstructions: {
      type: 'string',
      description: 'Additional instructions appended to system prompt',
    },
    memories: { type: 'json', description: 'Conversation history for continuity' },
    model: { type: 'string', description: 'AI model to use' },
    apiKey: { type: 'string', description: 'Provider API key' },
    azureEndpoint: { type: 'string', description: 'Azure OpenAI endpoint URL' },
    azureApiVersion: { type: 'string', description: 'Azure API version' },
    temperature: { type: 'number', description: 'Controls randomness (0.0-2.0)' },
    topP: { type: 'number', description: 'Nucleus sampling (0.0-1.0)' },
    topK: { type: 'number', description: 'Top-K token sampling (1-100)' },
    maxTokens: { type: 'number', description: 'Maximum output tokens' },
    presencePenalty: { type: 'number', description: 'Penalizes repeated topics (-2.0 to 2.0)' },
    frequencyPenalty: { type: 'number', description: 'Penalizes repeated tokens (-2.0 to 2.0)' },
    timeout: { type: 'number', description: 'Request timeout in seconds' },
    enableOcr: { type: 'boolean', description: 'Extract text from images/PDFs via OCR' },
    enableStreaming: { type: 'boolean', description: 'Enable real-time streaming' },
    tools: { type: 'json', description: 'Tools available to the agent' },
    responseFormat: {
      type: 'json',
      description: 'JSON schema for structured output',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Schema name' },
          description: { type: 'string', description: 'Schema description' },
          schema: {
            type: 'object',
            description: 'JSON Schema definition',
            properties: {
              type: { type: 'string', enum: ['object'] },
              properties: { type: 'object', description: 'Property definitions' },
              required: { type: 'array', items: { type: 'string' } },
              additionalProperties: { type: 'boolean' },
            },
            required: ['type', 'properties'],
          },
          strict: { type: 'boolean', default: true },
        },
        required: ['schema'],
      },
    },
  },
  outputs: {
    content: { type: 'string', description: 'Generated response content' },
    model: { type: 'string', description: 'Model used for generation' },
    tokens: { type: 'any', description: 'Token usage statistics' },
    toolCalls: { type: 'any', description: 'Tool call results' },
    context: { type: 'any', description: 'Conversation context data' },
  },
}

// Parameter sanitization to ensure correct data types
const sanitizeParameters = (params: Record<string, any>): Record<string, any> => {
  const integerFields = ['timeout', 'topK', 'maxTokens']
  const floatFields = ['temperature', 'topP', 'presencePenalty', 'frequencyPenalty']

  const sanitized = { ...params }

  for (const field of integerFields) {
    if (sanitized[field] != null) {
      const value = Number(sanitized[field])
      if (!Number.isNaN(value)) sanitized[field] = Math.round(value)
    }
  }

  for (const field of floatFields) {
    if (sanitized[field] != null) {
      const value = Number(sanitized[field])
      if (!Number.isNaN(value)) sanitized[field] = value
    }
  }

  return sanitized
}
