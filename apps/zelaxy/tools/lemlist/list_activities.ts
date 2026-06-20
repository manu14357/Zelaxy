import type { LemlistListActivitiesParams, LemlistListResponse } from '@/tools/lemlist/types'
import type { ToolConfig } from '@/tools/types'

export const listActivitiesTool: ToolConfig<LemlistListActivitiesParams, LemlistListResponse> = {
  id: 'lemlist_list_activities',
  name: 'Lemlist List Activities',
  description: 'List campaign activities such as opens, clicks, and replies in Lemlist',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Lemlist API key',
    },
  },

  request: {
    url: () => 'https://api.lemlist.com/api/activities',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const activities = Array.isArray(data) ? data : data.activities || []
    return {
      success: true,
      output: { data: activities, metadata: { count: activities.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Lemlist activity objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of activities returned' },
      },
    },
  },
}
