import type { ListEventsParams, MailgunListResponse } from '@/tools/mailgun/types'
import type { ToolConfig } from '@/tools/types'

export const listEventsTool: ToolConfig<ListEventsParams, MailgunListResponse> = {
  id: 'mailgun_list_events',
  name: 'Mailgun List Events',
  description: 'List delivery events for a Mailgun domain',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Mailgun API key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Mailgun sending domain (e.g. mg.example.com)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of events to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://api.mailgun.net/v3/${params.domain}/events`)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`api:${params.apiKey}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Mailgun event objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of events returned' },
      },
    },
  },
}
