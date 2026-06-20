import type { AddMemberParams, MailchimpObjectResponse } from '@/tools/mailchimp/types'
import type { ToolConfig } from '@/tools/types'

export const addMemberTool: ToolConfig<AddMemberParams, MailchimpObjectResponse> = {
  id: 'mailchimp_add_member',
  name: 'Mailchimp Add Member',
  description: 'Add a subscriber to a Mailchimp audience list',
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
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Subscriber email address',
    },
  },

  request: {
    url: (params) => `https://${params.dc}.api.mailchimp.com/3.0/lists/${params.listId}/members`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`anystring:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      email_address: params.email,
      status: 'subscribed',
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
    data: { type: 'json', description: 'The created Mailchimp member object' },
    metadata: {
      type: 'json',
      description: 'Member identifiers',
      properties: {
        id: { type: 'string', description: 'Member ID' },
      },
    },
  },
}
