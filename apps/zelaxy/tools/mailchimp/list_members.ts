import type { ListMembersParams, MailchimpListResponse } from '@/tools/mailchimp/types'
import type { ToolConfig } from '@/tools/types'

export const listMembersTool: ToolConfig<ListMembersParams, MailchimpListResponse> = {
  id: 'mailchimp_list_members',
  name: 'Mailchimp List Members',
  description: 'List members of a Mailchimp audience',
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
    url: (params) => `https://${params.dc}.api.mailchimp.com/3.0/lists/${params.listId}/members`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`anystring:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const members = data.members || []
    return {
      success: true,
      output: {
        data: members,
        metadata: { count: members.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Mailchimp member objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of members returned' },
      },
    },
  },
}
