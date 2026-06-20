import type { FindEmailParams, FindymailObjectResponse } from '@/tools/findymail/types'
import type { ToolConfig } from '@/tools/types'

export const findEmailTool: ToolConfig<FindEmailParams, FindymailObjectResponse> = {
  id: 'findymail_find_email',
  name: 'Findymail Find Email',
  description: 'Find an email address from a name and company domain',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Findymail API key',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Person's full name (e.g. 'John Doe')",
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company domain (e.g. stripe.com)',
    },
  },

  request: {
    url: () => 'https://app.findymail.com/api/search/name',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ name: params.name, domain: params.domain }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { email: data.contact?.email ?? null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The find-email response with the contact object' },
    metadata: {
      type: 'json',
      description: 'Result identifiers',
      properties: {
        email: { type: 'string', description: 'The found email address, if any' },
      },
    },
  },
}
