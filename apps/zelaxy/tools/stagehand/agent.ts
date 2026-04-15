import { createLogger } from '@/lib/logs/console/logger'
import type { StagehandAgentParams, StagehandAgentResponse } from '@/tools/stagehand/types'
import type { ToolConfig } from '@/tools/types'

const logger = createLogger('StagehandAgentTool')

export const agentTool: ToolConfig<StagehandAgentParams, StagehandAgentResponse> = {
  id: 'stagehand_agent',
  name: 'Stagehand Agent',
  description: 'Run an autonomous web agent to complete tasks and extract structured data',
  version: '1.0.0',

  params: {
    startUrl: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'URL of the webpage to start the agent on',
    },
    task: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The task to complete or goal to achieve on the website',
    },
    provider: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Model provider used by the Stagehand agent',
      default: 'anthropic',
    },
    model: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'LLM model used by the Stagehand agent',
      default: 'anthropic/claude-sonnet-4-5',
    },
    mode: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Stagehand mode: dom, cua, or hybrid',
      default: 'hybrid',
    },
    maxSteps: {
      type: 'number',
      required: false,
      visibility: 'user-only',
      description: 'Maximum number of execution steps for the agent',
      default: 20,
    },
    useSearch: {
      type: 'boolean',
      required: false,
      visibility: 'user-only',
      description: 'Whether to allow web search during execution',
      default: false,
    },
    systemPrompt: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Additional system instructions for the Stagehand agent',
    },
    excludeTools: {
      type: 'json',
      required: false,
      visibility: 'user-only',
      description: 'List of Stagehand tools to disable for this run',
    },
    variables: {
      type: 'json',
      required: false,
      visibility: 'user-only',
      description:
        'Optional variables to substitute in the task (format: {key: value}). Reference in task using %key%',
    },
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'API key for the selected model provider used by Stagehand',
    },
    browserbaseApiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Optional Browserbase API key override for this execution',
    },
    browserbaseProjectId: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Optional Browserbase project ID override for this execution',
    },
    customTools: {
      type: 'json',
      required: false,
      visibility: 'user-only',
      description: 'Optional Stagehand custom tools configuration',
    },
    mcpServers: {
      type: 'json',
      required: false,
      visibility: 'user-only',
      description: 'Optional MCP server definitions for Stagehand tools',
    },
    outputSchema: {
      type: 'json',
      required: false,
      visibility: 'user-only',
      description: 'Optional JSON schema defining the structure of data the agent should return',
    },
  },

  request: {
    url: '/api/tools/stagehand/agent',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      let startUrl = params.startUrl
      if (startUrl && !startUrl.match(/^https?:\/\//i)) {
        startUrl = `https://${startUrl.trim()}`
        logger.info(`Normalized URL from ${params.startUrl} to ${startUrl}`)
      }

      return {
        task: params.task,
        startUrl: startUrl,
        provider: params.provider,
        model: params.model,
        mode: params.mode,
        maxSteps: params.maxSteps,
        useSearch: params.useSearch,
        systemPrompt: params.systemPrompt,
        excludeTools: params.excludeTools,
        outputSchema: params.outputSchema,
        variables: params.variables,
        apiKey: params.apiKey,
        browserbaseApiKey: params.browserbaseApiKey,
        browserbaseProjectId: params.browserbaseProjectId,
        customTools: params.customTools,
        mcpServers: params.mcpServers,
      }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const agentResult = data.agentResult
    const isAgentSuccess = Boolean(agentResult?.success)

    return {
      success: response.ok && isAgentSuccess,
      error: response.ok && !isAgentSuccess ? agentResult?.message || 'Stagehand agent failed' : undefined,
      output: {
        agentResult,
        structuredOutput: data.structuredOutput || {},
      },
    }
  },

  outputs: {
    agentResult: {
      type: 'object',
      description: 'Result from the Stagehand agent execution',
      properties: {
        success: { type: 'boolean', description: 'Whether the agent task completed successfully' },
        completed: { type: 'boolean', description: 'Whether the task was fully completed' },
        message: { type: 'string', description: 'Status message or final result' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Type of action performed' },
              params: { type: 'object', description: 'Parameters used for the action' },
              result: { type: 'object', description: 'Result of the action' },
            },
          },
          description: 'List of actions performed by the agent',
        },
      },
    },
    structuredOutput: {
      type: 'object',
      description: 'Extracted data matching the provided output schema',
    },
  },
}
