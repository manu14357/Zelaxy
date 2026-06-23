/**
 * Local tool definitions for Agie AI Copilot
 * These tools can be used without the external zelaxy-agent service
 */

import type { ProviderToolConfig } from '@/providers/types'
import { copilotToolRegistry } from './server-tools/registry'

/**
 * Tool definitions in OpenAI-compatible format for local execution
 */
export const LOCAL_COPILOT_TOOLS: ProviderToolConfig[] = [
  {
    id: 'build_workflow',
    name: 'build_workflow',
    description: `Build a new workflow from YAML definition. Use this tool when the user asks you to:
- Create a new workflow
- Build an automation
- Set up a workflow from scratch
- Create email automation, data processing, or any other workflow

YAML Format:
\`\`\`yaml
version: "1.0"
blocks:
  block_id:
    type: block_type  # e.g., agent, api_call, condition, loop
    name: "Block Name"
    inputs:
      input_name: "value"
    connections:
      outgoing:
        - target: next_block_id
\`\`\`

Available block types:
- starter: Entry point for workflows (handles triggers like webhook, schedule, manual)
- agent: AI agent for intelligent processing
- api_call: Make HTTP requests
- condition: Branch based on conditions
- code: Execute custom JavaScript code
- function: Reusable function components
- router: Route to different paths
- evaluator: Evaluate conditions
- loop: Iterate over items
- parallel: Run blocks in parallel`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        yamlContent: {
          type: 'string',
          description: 'The YAML content defining the workflow structure',
        },
        description: {
          type: 'string',
          description: 'A brief description of the workflow being created',
        },
      },
      required: ['yamlContent'],
    },
  },
  {
    id: 'get_user_workflow',
    name: 'get_user_workflow',
    description: `Get information about the user's current workflow. Use this tool to:
- Understand what blocks are already in the workflow
- Check the current workflow configuration
- See connections between blocks
- Analyze the workflow before making edits
Note: The workflowId is automatically injected from the request context.`,
    params: {},
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 'get_blocks_and_tools',
    name: 'get_blocks_and_tools',
    description: `Get a list of all available blocks and tools that can be used in workflows. Use this to:
- Show the user what blocks are available
- Find the right block type for a task
- Get block configuration information`,
    params: {},
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 'get_blocks_metadata',
    name: 'get_blocks_metadata',
    description: `Get detailed metadata about specific block types including their inputs, outputs, and configuration options.`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        blockIds: {
          type: 'array',
          items: { type: 'string' },
          description:
            'List of ALL block type IDs you need, in one batched call (e.g., ["agent", "api", "condition"]). The HTTP block id is "api" (NOT "api_call"). Call this once with every block you will use — do not call per-block.',
        },
      },
      required: ['blockIds'],
    },
  },
  {
    id: 'edit_workflow',
    name: 'edit_workflow',
    description: `Edit an existing workflow by applying targeted operations to specific blocks. Use this tool to:
- Modify existing blocks (change inputs, connections)
- Add new blocks to the workflow
- Delete blocks from the workflow
- Update block configurations

Each operation specifies a block_id and what to change.
Note: The workflowId is automatically injected from the request context.`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation_type: {
                type: 'string',
                enum: ['add', 'edit', 'delete'],
                description: 'The type of operation to perform',
              },
              block_id: {
                type: 'string',
                description: 'The ID of the block to operate on',
              },
              params: {
                type: 'object',
                description: 'Parameters for the operation (inputs, connections, type, name)',
              },
            },
            required: ['operation_type', 'block_id'],
          },
          description: 'Array of operations to apply to the workflow',
        },
      },
      required: ['operations'],
    },
  },
  {
    id: 'search_documentation',
    name: 'search_documentation',
    description: `Search through Zelaxy documentation and help resources. Use this to:
- Find information about how to use specific features
- Get examples of workflow configurations
- Learn about best practices
- Find block and tool documentation`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query for documentation',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'search_online',
    name: 'search_online',
    description: `Search the public web for up-to-date information. Use this to:
- Answer questions that need current/external facts the model may not know
- Look up API docs, services, or providers before building an integration
- Verify details (pricing, endpoints, parameters) for a third-party service`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The web search query' },
        num: { type: 'number', description: 'Number of results to return (default 10)' },
        type: {
          type: 'string',
          description: "Search type: 'search' (default), 'news', or 'images'",
        },
        gl: { type: 'string', description: 'Optional country code (e.g. "us")' },
        hl: { type: 'string', description: 'Optional language code (e.g. "en")' },
      },
      required: ['query'],
    },
  },
  {
    id: 'scrape_page',
    name: 'scrape_page',
    description: `Read a SPECIFIC web page and return its main content as clean text. Use this when:
- You have a URL (from a search result or the user) and need the actual page content
- You need to read documentation, an article, or a product page in detail`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The full URL of the page to read' },
      },
      required: ['url'],
    },
  },
  {
    id: 'crawl_website',
    name: 'crawl_website',
    description: `Crawl a website (follow its links) and return the content of multiple pages. Use this to:
- Gather information across a whole docs site or section
- Build broader context than a single page (use scrape_page for one page).
Requires a FIRECRAWL_API_KEY; if it's missing, use scrape_page instead.`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The starting URL to crawl' },
        limit: { type: 'number', description: 'Max pages to crawl (default 20, max 100)' },
      },
      required: ['url'],
    },
  },
  {
    id: 'get_workflow_console',
    name: 'get_workflow_console',
    description: `Get recent execution logs and console output for the workflow. Use this to:
- Debug workflow errors and failures
- Review recent execution results
- Check block-level execution details
- Analyze performance and costs
- See what happened during the last workflow run
Note: The workflowId is automatically injected from the request context.`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent executions to retrieve (default: 3)',
        },
        includeDetails: {
          type: 'boolean',
          description: 'Whether to include detailed block execution data (default: true)',
        },
      },
      required: [],
    },
  },
  {
    id: 'get_environment_variables',
    name: 'get_environment_variables',
    description: `Get the list of environment variable names configured by the user. Use this to:
- Check what API keys and secrets are available
- Verify integration credentials are set up
- Understand what services the user has configured
Note: Returns variable names only, not their values (for security).`,
    params: {},
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 'run_workflow',
    name: 'run_workflow',
    description: `Run the workflow that is currently OPEN on the canvas. Use this when the user asks to run / execute / test their current workflow. The user confirms before it runs, and results appear on the canvas. (This runs the live editor workflow — not a deployed one.)`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        workflow_input: {
          type: 'string',
          description: 'Optional input/payload to pass to the workflow run',
        },
      },
      required: [],
    },
  },
  {
    id: 'set_environment_variables',
    name: 'set_environment_variables',
    description: `Set or update environment variables for the user. Use this to:
- Configure API keys for integrations
- Set up authentication credentials
- Configure webhook URLs or database connections
Note: This stores variables securely and they can be referenced in workflow blocks.`,
    params: {},
    parameters: {
      type: 'object',
      properties: {
        variables: {
          type: 'object',
          description: 'Key-value pairs of environment variables to set',
        },
      },
      required: ['variables'],
    },
  },
]

/**
 * Execute a local copilot tool
 */
export async function executeLocalTool(
  toolId: string,
  params: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const tool = copilotToolRegistry.get(toolId)

  if (!tool) {
    return {
      success: false,
      error: `Tool not found: ${toolId}`,
    }
  }

  try {
    return await tool.execute(params)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get tools suitable for copilot mode
 * In 'agent' mode, returns all tools for workflow creation
 * In 'ask' mode, returns only informational tools
 */
export function getToolsForMode(mode: 'agent' | 'ask'): ProviderToolConfig[] {
  if (mode === 'ask') {
    // For ask mode, include informational and debugging tools (no workflow modification)
    return LOCAL_COPILOT_TOOLS.filter(
      (tool) =>
        tool.id === 'search_documentation' ||
        tool.id === 'search_online' ||
        tool.id === 'scrape_page' ||
        tool.id === 'crawl_website' ||
        tool.id === 'get_blocks_and_tools' ||
        tool.id === 'get_blocks_metadata' ||
        tool.id === 'get_user_workflow' ||
        tool.id === 'get_workflow_console' ||
        tool.id === 'get_environment_variables'
    )
  }

  // For agent mode, return all tools
  return LOCAL_COPILOT_TOOLS
}
