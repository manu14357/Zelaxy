import type { GetListParams, MailchimpObjectResponse } from '@/tools/mailchimp/types'
import type { ToolConfig } from '@/tools/types'

export const getListTool: ToolConfig<GetListParams, MailchimpObjectResponse> = {
  id: 'mailchimp_get_list',
  name: 'Mailchimp Get List',
  description: 'Get details about a Mailchimp audience list',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Mailchimp API key',
    },
    dc: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Mailchimp data center (e.g. us21)',
    },
    listId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Audience (list) ID',
    },
  },

  request: {
    url: (params) => `https://${params.dc}.api.mailchimp.com/3.0/lists/${params.listId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`anystring:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Mailchimp list object' },
    metadata: {
      type: 'json',
      description: 'List identifiers',
      properties: {
        id: { type: 'string', description: 'List ID' },
      },
    },
  },
}
