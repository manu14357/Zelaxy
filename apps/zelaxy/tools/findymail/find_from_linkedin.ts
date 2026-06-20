import type { FindFromLinkedinParams, FindymailObjectResponse } from '@/tools/findymail/types'
import type { ToolConfig } from '@/tools/types'

export const findFromLinkedinTool: ToolConfig<FindFromLinkedinParams, FindymailObjectResponse> = {
  id: 'findymail_find_from_linkedin',
  name: 'Findymail Find From LinkedIn',
  description: 'Find an email address from a LinkedIn profile URL',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Findymail API key',
    },
    linkedin_url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Person's LinkedIn profile URL (e.g. 'https://linkedin.com/in/johndoe')",
    },
  },

  request: {
    url: () => 'https://app.findymail.com/api/search/linkedin',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ linkedin_url: params.linkedin_url }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { email: data.contact?.email ?? null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The find-from-LinkedIn response with the contact object' },
    metadata: {
      type: 'json',
      description: 'Result identifiers',
      properties: {
        email: { type: 'string', description: 'The found email address, if any' },
      },
    },
  },
}
