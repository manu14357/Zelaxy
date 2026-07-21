import { FlintIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

/**
 * Coerces the publish switch value to an explicit boolean, preserving an
 * explicit false so Flint never falls back to its server-side default.
 * Returns undefined only when the value was never set.
 */
function coercePublish(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

export const FlintBlock: BlockConfig = {
  type: 'flint',
  name: 'Flint',
  description: 'Run background agent tasks on your Flint sites',
  longDescription:
    'Create background agent tasks that modify your Flint sites from natural-language prompts, generate batches of pages from a template, and check task status and results.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F6F54F',
  icon: FlintIcon,

  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create Task', id: 'flint_create_task' },
        { label: 'Generate Pages', id: 'flint_generate_pages' },
        { label: 'Get Task', id: 'flint_get_task' },
      ],
      value: () => 'flint_create_task',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Flint API key (ak_...)',
      password: true,
      required: true,
    },
    {
      id: 'siteId',
      title: 'Site ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'ID of the Flint site to modify',
      condition: {
        field: 'operation',
        value: ['flint_create_task', 'flint_generate_pages'],
      },
      required: true,
    },
    {
      id: 'prompt',
      title: 'Prompt',
      type: 'long-input',
      layout: 'full',
      placeholder: 'e.g. Add a new About page with a team section',
      condition: { field: 'operation', value: 'flint_create_task' },
      required: true,
    },
    {
      id: 'templatePageSlug',
      title: 'Template Page Slug',
      type: 'short-input',
      layout: 'full',
      placeholder: '/case-studies/template',
      condition: { field: 'operation', value: 'flint_generate_pages' },
      required: true,
    },
    {
      id: 'items',
      title: 'Pages (JSON)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: `[
  {
    "targetPageSlug": "/case-studies/acme-corp",
    "context": "Company: Acme Corp. Industry: Manufacturing..."
  }
]`,
      condition: { field: 'operation', value: 'flint_generate_pages' },
      required: true,
      wandConfig: {
        enabled: true,
        prompt: `Generate a JSON array of pages to create from a Flint template based on the user's description.
Each page object must have exactly these fields:
- "targetPageSlug": The slug for the new page (e.g., "/case-studies/acme-corp")
- "context": Content details the agent should use to fill in the template

The array must contain between 1 and 10 items.
Return ONLY the raw JSON array starting with [ and ending with ] - no explanations, no markdown code blocks.`,
        placeholder: 'Describe the pages you want to generate...',
      },
    },
    {
      id: 'taskId',
      title: 'Task ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'The task ID returned when the task was created',
      condition: { field: 'operation', value: 'flint_get_task' },
      required: true,
    },
    {
      id: 'publish',
      title: 'Publish on Completion',
      type: 'switch',
      layout: 'full',
      mode: 'advanced',
      condition: {
        field: 'operation',
        value: ['flint_create_task', 'flint_generate_pages'],
      },
    },
    {
      id: 'callbackUrl',
      title: 'Callback URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://your-server.com/webhooks/flint',
      mode: 'advanced',
      condition: {
        field: 'operation',
        value: ['flint_create_task', 'flint_generate_pages'],
      },
    },
  ],

  tools: {
    access: ['flint_create_task', 'flint_generate_pages', 'flint_get_task'],
    config: {
      tool: (params) => params.operation || 'flint_create_task',
      params: (params) => {
        const base: Record<string, unknown> = { apiKey: params.apiKey }

        switch (params.operation) {
          case 'flint_generate_pages':
            return {
              ...base,
              siteId: params.siteId,
              templatePageSlug: params.templatePageSlug,
              items: params.items,
              callbackUrl: params.callbackUrl || undefined,
              publish: coercePublish(params.publish),
            }
          case 'flint_get_task':
            return { ...base, taskId: params.taskId }
          default:
            return {
              ...base,
              siteId: params.siteId,
              prompt: params.prompt,
              callbackUrl: params.callbackUrl || undefined,
              publish: coercePublish(params.publish),
            }
        }
      },
    },
  },

  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Flint API key' },
    siteId: { type: 'string', description: 'ID of the Flint site to modify' },
    prompt: { type: 'string', description: 'Natural-language instructions for the agent' },
    templatePageSlug: {
      type: 'string',
      description: 'Slug of the template page to generate from',
    },
    items: {
      type: 'json',
      description: 'JSON array of 1-10 pages to generate, each with targetPageSlug and context',
    },
    taskId: { type: 'string', description: 'Task ID to look up' },
    publish: { type: 'boolean', description: 'Publish changes automatically on completion' },
    callbackUrl: { type: 'string', description: 'HTTPS webhook URL notified on completion' },
  },

  outputs: {
    taskId: { type: 'string', description: 'Identifier of the background task' },
    status: { type: 'string', description: 'Task status: running, completed, or failed' },
    createdAt: { type: 'string', description: 'When the task was created' },
    pagesCreated: {
      type: 'json',
      description: 'Pages created by the task [{slug, previewUrl, editUrl, publishedUrl}]',
    },
    pagesModified: {
      type: 'json',
      description: 'Pages modified by the task [{slug, previewUrl, editUrl, publishedUrl}]',
    },
    pagesDeleted: {
      type: 'json',
      description: 'Pages deleted by the task [{slug, previewUrl, editUrl, publishedUrl}]',
    },
    errorMessage: { type: 'string', description: 'Error message when the task failed' },
  },
}
