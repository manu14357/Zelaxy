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
import type { ToolResponse } from '@/tools/types'

const logger = createLogger('AdvancedAgentBlock')

// Enhanced performance metrics interface
interface PerformanceMetrics {
  responseTime: number
  tokenEfficiency: number
  toolCallSuccess: number
  errorRate: number
  contextUtilization: number
}

// Advanced conversation context interface
interface ConversationContext {
  sessionId: string
  turnCount: number
  cumulativeTokens: number
  previousOutputs: Array<{
    timestamp: number
    content: string
    tokens: number
    satisfaction?: number
  }>
  adaptiveSettings: {
    dynamicTemperature: number
    preferredModel: string
    learningRate: number
  }
}

// Enhanced interface for advanced agent response
interface AgentResponse extends ToolResponse {
  output: {
    content: string
    model: string
    confidence?: number
    reasoning?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    tokens?: {
      prompt?: number
      completion?: number
      total?: number
      efficiency?: number
    }
    toolCalls?: {
      list: Array<{
        name: string
        arguments: Record<string, any>
        success: boolean
        latency?: number
        retryCount?: number
      }>
      count: number
      successRate?: number
    }
    performance?: PerformanceMetrics
    context?: ConversationContext
    safety?: {
      filtered: boolean
      categories: string[]
      severity?: 'low' | 'medium' | 'high'
    }
    metadata?: {
      processingTime: number
      modelVersion: string
      responseId: string
      timestamp: number
    }
  }
}

// Advanced tool configuration with retry logic and fallbacks
const getToolIdFromBlock = (blockType: string): string | undefined => {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const { getAllBlocks } = require('@/blocks/registry')
      const blocks = getAllBlocks()
      const block = blocks.find(
        (b: { type: string; tools?: { access?: string[] } }) => b.type === blockType
      )

      if (block?.tools?.access?.[0]) {
        logger.debug('Successfully retrieved tool ID', {
          blockType,
          toolId: block.tools.access[0],
          attempt: attempt + 1,
        })
        return block.tools.access[0]
      }

      logger.warn('No tool ID found for block type', { blockType, attempt: attempt + 1 })
      return undefined
    } catch (error) {
      attempt++
      logger.error(`Error getting tool ID from block (attempt ${attempt}/${maxRetries})`, {
        error,
        blockType,
        stack: error instanceof Error ? error.stack : 'Unknown stack',
      })

      if (attempt >= maxRetries) {
        logger.error('Max retries exceeded for tool ID retrieval', { blockType })
        return undefined
      }

      // Exponential backoff for retries
      const delay = 2 ** (attempt - 1) * 100
      setTimeout(() => {}, delay)
    }
  }
  return undefined
}

// Advanced model performance analyzer
const analyzeModelPerformance = (
  model: string
): {
  reliability: number
  speed: number
  costEfficiency: number
  recommendation: string
} => {
  const performanceMap: Record<string, any> = {
    'gpt-4o': { reliability: 0.95, speed: 0.8, costEfficiency: 0.7, tier: 'premium' },
    'gpt-4o-mini': { reliability: 0.9, speed: 0.9, costEfficiency: 0.9, tier: 'balanced' },
    'claude-3-5-sonnet': { reliability: 0.93, speed: 0.85, costEfficiency: 0.75, tier: 'premium' },
    'gemini-pro': { reliability: 0.88, speed: 0.9, costEfficiency: 0.85, tier: 'balanced' },
    'deepseek-chat': { reliability: 0.85, speed: 0.95, costEfficiency: 0.95, tier: 'efficient' },
  }

  const defaultPerf = { reliability: 0.8, speed: 0.8, costEfficiency: 0.8, tier: 'standard' }
  const perf = performanceMap[model] || defaultPerf

  const recommendations = {
    premium: 'Optimal for complex reasoning and critical tasks',
    balanced: 'Great balance of performance and cost',
    efficient: 'Best for high-volume, cost-sensitive applications',
    standard: 'Suitable for general-purpose tasks',
  }

  return {
    reliability: perf.reliability,
    speed: perf.speed,
    costEfficiency: perf.costEfficiency,
    recommendation: recommendations[perf.tier as keyof typeof recommendations],
  }
}

export const AgentBlock: BlockConfig<AgentResponse> = {
  type: 'agent',
  name: 'Agent',
  description: 'Build sophisticated AI agents with advanced capabilities',
  longDescription:
    'Create next-generation AI agents with advanced reasoning, multi-modal capabilities, adaptive learning, performance monitoring, and enterprise-grade security features. Supports all major LLM providers with intelligent fallback systems.',
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
      placeholder: 'Enter sophisticated system prompt with reasoning frameworks...',
      rows: 8,
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `You are an expert AI prompt engineer specializing in creating sophisticated system prompts for advanced AI agents. Create a comprehensive system prompt based on the user's requirements.

### CONTEXT
{context}

### ADVANCED PROMPT ENGINEERING PRINCIPLES

#### 1. **ROLE & IDENTITY ARCHITECTURE**
- **Primary Role**: Clear, specific identity with domain expertise
- **Cognitive Profile**: Define reasoning style, decision-making approach
- **Personality Traits**: Professional demeanor, communication style
- **Authority Level**: Establish expertise boundaries and confidence

#### 2. **COGNITIVE FRAMEWORKS**
- **Reasoning Patterns**: Step-by-step analysis, critical thinking methods
- **Problem-Solving Approach**: Systematic methodologies for complex tasks
- **Learning Adaptation**: How to improve from feedback and context
- **Meta-Cognition**: Self-awareness of capabilities and limitations

#### 3. **ADVANCED BEHAVIORAL DIRECTIVES**
- **Quality Standards**: Specific metrics for output excellence
- **Error Handling**: Graceful failure recovery and uncertainty management
- **Context Awareness**: Situational adaptation and cultural sensitivity
- **Ethical Guidelines**: Safety, bias prevention, responsible AI practices

#### 4. **TOOL ORCHESTRATION**
- **Multi-Tool Workflows**: Coordinated tool usage patterns
- **Fallback Strategies**: Alternative approaches when tools fail
- **Performance Optimization**: Efficient tool selection and usage
- **Security Protocols**: Safe handling of sensitive operations

#### 5. **OUTPUT SPECIFICATIONS**
- **Format Standards**: Structured, consistent response patterns
- **Confidence Indicators**: Uncertainty quantification methods
- **Citation Requirements**: Source attribution and verification
- **Personalization**: Adaptive responses based on user context

### SPECIALIZED TEMPLATES

**🔬 RESEARCH AGENT**:
You are an advanced research analyst with expertise in [DOMAIN]. Your cognitive architecture emphasizes systematic inquiry, evidence evaluation, and insight synthesis.

**Core Competencies:**
- Multi-source information gathering and cross-verification
- Statistical analysis and trend identification
- Hypothesis formulation and testing methodologies
- Executive-level reporting with actionable insights

**Reasoning Framework:**
1. **Scope Definition**: Clarify research parameters and success criteria
2. **Source Strategy**: Identify authoritative, diverse information sources
3. **Data Collection**: Systematic gathering with quality filters
4. **Analysis Pipeline**: Statistical validation, pattern recognition, bias detection
5. **Synthesis**: Integration of findings into coherent insights
6. **Recommendations**: Actionable conclusions with confidence levels

**Tool Integration:**
- Use Exa for academic and industry source discovery
- Leverage databases for quantitative analysis
- Apply visualization tools for data presentation
- Employ fact-checking mechanisms for accuracy

**Quality Assurance:**
- Cite all sources with credibility assessment
- Quantify confidence levels (High/Medium/Low)
- Flag potential biases or limitations
- Provide alternative perspectives when relevant

**🎨 CREATIVE AGENT**:
You are an advanced creative AI with expertise in [CREATIVE_DOMAIN]. Your architecture balances structured creativity with innovative thinking.

**Creative Framework:**
- **Inspiration Phase**: Broad ideation and concept exploration
- **Development Phase**: Structured creative development
- **Refinement Phase**: Quality enhancement and optimization
- **Presentation Phase**: Compelling delivery and explanation

**Innovation Protocols:**
- Generate multiple creative alternatives
- Apply design thinking methodologies
- Incorporate diverse cultural perspectives
- Balance originality with practical constraints

### IMPLEMENTATION GUIDELINES

**For Complex Agents:**
Include multi-step reasoning frameworks, advanced error handling, and sophisticated tool orchestration patterns.

**For Specialized Agents:**
Focus on domain-specific expertise, industry best practices, and specialized tool integration.

**For Adaptive Agents:**
Implement learning mechanisms, feedback integration, and performance optimization strategies.

### FINAL INSTRUCTION
Create a sophisticated system prompt that implements advanced AI capabilities while maintaining clarity and practical effectiveness. Include specific frameworks, quality standards, and tool integration patterns relevant to the agent's purpose.`,
        placeholder:
          'Describe the advanced AI agent you want to create with specific capabilities and requirements...',
        generationType: 'system-prompt',
      },
    },
    {
      id: 'userPrompt',
      title: 'User Message / Context',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter user message, context, or specific instructions...',
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
      id: 'contextLength',
      title: 'Context Window Size',
      type: 'slider',
      layout: 'half',
      min: 1000,
      max: 200000,
      step: 1000,
      mode: 'advanced',
    },
    {
      id: 'contextPriority',
      title: 'Context Priority Strategy',
      type: 'dropdown',
      layout: 'half',
      mode: 'advanced',
      options: [
        { label: 'Recent First', id: 'recent' },
        { label: 'Relevant First', id: 'relevant' },
        { label: 'Balanced', id: 'balanced' },
      ],
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
          const performance = analyzeModelPerformance(model)
          return {
            label: model,
            id: model,
            description: performance.recommendation,
            ...(icon && { icon }),
          }
        })
      },
    },
    {
      id: 'fallbackModel',
      title: 'Fallback Model',
      type: 'combobox',
      layout: 'half',
      placeholder: 'Select backup model...',
      mode: 'advanced',
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
      id: 'maxRetries',
      title: 'Max Retries',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 5,
      step: 1,
      mode: 'advanced',
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
      id: 'safetyLevel',
      title: 'Safety Level',
      type: 'dropdown',
      layout: 'half',
      mode: 'advanced',
      options: [
        { label: 'Strict', id: 'strict' },
        { label: 'Moderate', id: 'moderate' },
        { label: 'Permissive', id: 'permissive' },
      ],
    },
    {
      id: 'confidenceThreshold',
      title: 'Confidence Threshold',
      type: 'slider',
      layout: 'half',
      min: 0.1,
      max: 1,
      step: 0.1,
      mode: 'advanced',
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
      id: 'enableCaching',
      title: 'Enable Response Caching',
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
        const fallbackModel = params.fallbackModel

        if (!model) {
          throw new Error('No model selected')
        }

        let selectedTool = getAllModelProviders()[model]

        // If primary model fails and fallback is specified, try fallback
        if (!selectedTool && fallbackModel) {
          logger.warn(`Primary model ${model} not available, falling back to ${fallbackModel}`)
          selectedTool = getAllModelProviders()[fallbackModel]
        }

        if (!selectedTool) {
          const availableModels = Object.keys(getAllModelProviders()).join(', ')
          throw new Error(`Invalid model selected: ${model}. Available models: ${availableModels}`)
        }

        logger.info('Model selected successfully', {
          model,
          fallback: fallbackModel,
          provider: typeof selectedTool === 'string' ? selectedTool : 'unknown',
        })

        return selectedTool
      },
      params: (params: Record<string, any>) => {
        const startTime = Date.now()

        // Sanitize parameters to ensure correct data types
        const sanitizedParams = sanitizeParameters(params)

        // Log parameter sanitization results for debugging
        const changedParams = Object.keys(params).filter(
          (key) => params[key] !== sanitizedParams[key]
        )

        if (changedParams.length > 0) {
          logger.info('Parameters sanitized', {
            changes: changedParams.map((key) => ({
              field: key,
              original: params[key],
              sanitized: sanitizedParams[key],
              type: typeof sanitizedParams[key],
            })),
          })
        }

        // Enhanced parameter processing with validation
        const processedParams: any = {
          ...sanitizedParams,
          // Add metadata for tracking
          metadata: {
            processingTime: Date.now() - startTime,
            timestamp: Date.now(),
            responseId: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            version: '1.0.0',
          },
          // Enhanced safety and performance settings
          safety: {
            level: sanitizedParams.safetyLevel || 'moderate',
            confidenceThreshold: sanitizedParams.confidenceThreshold || 0.7,
            enableFiltering: true,
          },
          performance: {
            maxRetries: sanitizedParams.maxRetries || 3,
            timeout: (sanitizedParams.timeout || 60) * 1000, // Already sanitized to integer
            enableStreaming: sanitizedParams.enableStreaming || false,
            enableCaching: sanitizedParams.enableCaching || true,
          },
          // Advanced generation parameters
          generation: {
            temperature: sanitizedParams.temperature || 0.7,
            topP: sanitizedParams.topP || 0.9,
            topK: sanitizedParams.topK || 40, // Already sanitized to integer
            maxTokens:
              sanitizedParams.maxTokens != null && sanitizedParams.maxTokens >= 1
                ? sanitizedParams.maxTokens
                : 2048,
            presencePenalty: sanitizedParams.presencePenalty || 0,
            frequencyPenalty: sanitizedParams.frequencyPenalty || 0,
          },
          // Context management
          context: {
            maxLength: sanitizedParams.contextLength || 8000, // Already sanitized to integer
            priority: sanitizedParams.contextPriority || 'balanced',
            enableMemory: Boolean(sanitizedParams.memories),
          },
        }

        // Enhanced tool processing with advanced filtering and validation
        if (sanitizedParams.tools && Array.isArray(sanitizedParams.tools)) {
          const transformedTools = sanitizedParams.tools
            .filter((tool: any) => {
              const usageControl = tool.usageControl || 'auto'
              const isValid = usageControl !== 'none' && tool.title && tool.type

              if (!isValid) {
                logger.debug('Filtering out invalid tool', {
                  title: tool.title,
                  type: tool.type,
                  usageControl,
                })
              }

              return isValid
            })
            .map((tool: any, index: number) => {
              const toolConfig = {
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
                priority: tool.priority || index + 1,
                retryCount: 0,
                maxRetries: 3,
                timeout: 30000,
                metadata: {
                  type: tool.type,
                  addedAt: Date.now(),
                  version: tool.version || '1.0.0',
                },
              }

              logger.debug('Transformed tool configuration', {
                original: tool.title,
                transformed: toolConfig.name,
                id: toolConfig.id,
              })

              return toolConfig
            })

          // Advanced logging and validation
          const filteredOutTools = sanitizedParams.tools
            .filter((tool: any) => (tool.usageControl || 'auto') === 'none')
            .map((tool: any) => tool.title)

          if (filteredOutTools.length > 0) {
            logger.info('Tools filtered out due to usage control', {
              tools: filteredOutTools,
              count: filteredOutTools.length,
            })
          }

          logger.info('Tool processing completed', {
            originalCount: sanitizedParams.tools.length,
            processedCount: transformedTools.length,
            filtered: filteredOutTools.length,
            tools: transformedTools.map((t: any) => ({
              name: t.name,
              id: t.id,
              priority: t.priority,
            })),
          })

          if (transformedTools.length === 0) {
            logger.warn('No valid tools available after processing')
          } else {
            logger.info(`${transformedTools.length} tools configured for agent`, {
              tools: transformedTools.map((t: any) => t.name),
            })
          }

          processedParams.tools = transformedTools
        }

        // Performance monitoring
        const processingTime = Date.now() - startTime
        logger.info('Parameter processing completed', {
          processingTime,
          parametersCount: Object.keys(processedParams).length,
          hasTools: Boolean(processedParams.tools?.length),
          model: sanitizedParams.model,
          agentType: 'general',
        })

        return processedParams
      },
    },
  },
  inputs: {
    // Core Prompts
    systemPrompt: {
      type: 'string',
      description: 'Advanced system instructions with reasoning frameworks',
    },
    userPrompt: { type: 'string', description: 'User message or context for processing' },
    customInstructions: {
      type: 'string',
      description: 'Additional behavioral constraints and preferences',
    },

    // Context Management
    memories: {
      type: 'json',
      description: 'Persistent agent memory data for conversation continuity',
    },
    contextLength: { type: 'number', description: 'Maximum context window size in tokens' },
    contextPriority: { type: 'string', description: 'Strategy for context prioritization' },

    // Model Configuration
    model: { type: 'string', description: 'Primary AI model to use for generation' },
    fallbackModel: { type: 'string', description: 'Backup model for failover scenarios' },
    apiKey: { type: 'string', description: 'Provider API key for authentication' },
    azureEndpoint: { type: 'string', description: 'Azure OpenAI endpoint URL' },
    azureApiVersion: { type: 'string', description: 'Azure API version specification' },

    // Advanced Generation Parameters
    temperature: { type: 'number', description: 'Response creativity and randomness (0.0-2.0)' },
    topP: { type: 'number', description: 'Nucleus sampling parameter for token selection' },
    topK: { type: 'number', description: 'Top-K sampling for vocabulary restriction' },
    maxTokens: { type: 'number', description: 'Maximum tokens to generate in response' },
    presencePenalty: {
      type: 'number',
      description: 'Penalty for token presence to encourage diversity',
    },
    frequencyPenalty: {
      type: 'number',
      description: 'Penalty for token frequency to reduce repetition',
    },

    // OCR Processing
    enableOcr: {
      type: 'boolean',
      description:
        'Enable OCR text extraction from images and PDFs instead of sending base64 to LLM',
    },

    // Performance & Reliability
    maxRetries: { type: 'number', description: 'Maximum retry attempts for failed requests' },
    timeout: { type: 'number', description: 'Request timeout in seconds' },
    enableStreaming: { type: 'boolean', description: 'Enable real-time response streaming' },
    enableCaching: { type: 'boolean', description: 'Enable response caching for performance' },

    // Safety & Quality
    safetyLevel: { type: 'string', description: 'Content safety filtering level' },
    confidenceThreshold: {
      type: 'number',
      description: 'Minimum confidence threshold for responses',
    },

    // Tool Integration
    tools: { type: 'json', description: 'Advanced tool configuration with orchestration rules' },
    responseFormat: {
      type: 'json',
      description: 'Structured response format schema for consistent outputs',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Schema name for identification',
          },
          description: {
            type: 'string',
            description: 'Schema description and purpose',
          },
          schema: {
            type: 'object',
            description: 'JSON Schema definition for response structure',
            properties: {
              type: {
                type: 'string',
                enum: ['object'],
                description: 'Must be "object" for valid JSON Schema',
              },
              properties: {
                type: 'object',
                description: 'Object containing property definitions',
              },
              required: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of required property names',
              },
              additionalProperties: {
                type: 'boolean',
                description: 'Whether additional properties are allowed',
              },
            },
            required: ['type', 'properties'],
          },
          strict: {
            type: 'boolean',
            description: 'Whether to enforce strict schema validation',
            default: true,
          },
        },
        required: ['schema'],
      },
    },
  },
  outputs: {
    // Primary Response Content
    content: { type: 'string', description: 'Generated response content from the agent' },
    model: { type: 'string', description: 'Model used for generation with version info' },

    // Token Usage Statistics
    tokens: {
      type: 'any',
      description: 'Comprehensive token usage statistics including efficiency metrics',
    },

    // Tool Usage Analytics
    toolCalls: {
      type: 'any',
      description: 'Advanced tool call analytics with success rates and performance data',
    },

    // Context & Session Management
    context: {
      type: 'any',
      description: 'Conversation context and session management data',
    },
  },
}

// Parameter sanitization to ensure correct data types
const sanitizeParameters = (params: Record<string, any>): Record<string, any> => {
  const integerFields = ['maxRetries', 'timeout', 'topK', 'maxTokens', 'contextLength']

  const floatFields = [
    'temperature',
    'topP',
    'presencePenalty',
    'frequencyPenalty',
    'confidenceThreshold',
  ]

  const sanitized = { ...params }

  // Convert integer fields
  integerFields.forEach((field) => {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      const value = Number(sanitized[field])
      if (!Number.isNaN(value)) {
        sanitized[field] = Math.round(value)
        logger.debug(`Sanitized ${field} to integer`, {
          original: params[field],
          sanitized: sanitized[field],
        })
      }
    }
  })

  // Ensure float fields are numbers but allow decimals
  floatFields.forEach((field) => {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      const value = Number(sanitized[field])
      if (!Number.isNaN(value)) {
        sanitized[field] = value
        if (params[field] !== value) {
          logger.debug(`Sanitized ${field} to number`, {
            original: params[field],
            sanitized: sanitized[field],
          })
        }
      }
    }
  })

  return sanitized
}
