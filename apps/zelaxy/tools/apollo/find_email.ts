import type { ApolloFindEmailParams, ApolloFindEmailResponse } from '@/tools/apollo/types'
import type { ToolConfig } from '@/tools/types'

export const apolloFindEmailTool: ToolConfig<ApolloFindEmailParams, ApolloFindEmailResponse> = {
  id: 'apollo_find_email',
  name: 'Apollo Find Email',
  description:
    "Find a person's email address using Apollo's people match endpoint given their name and company information.",
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Apollo API key',
    },
    first_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'First name of the person',
    },
    last_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Last name of the person',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Full name of the person',
    },
    domain: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company domain (e.g., "apollo.io")',
    },
    organization_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name',
    },
    linkedin_url: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'LinkedIn profile URL',
    },
  },

  request: {
    url: 'https://api.apollo.io/api/v1/people/match?reveal_personal_emails=true',
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': params.apiKey,
    }),
    body: (params) => {
      const body: Record<string, unknown> = {}
      if (params.first_name) body.first_name = params.first_name
      if (params.last_name) body.last_name = params.last_name
      if (params.name) body.name = params.name
      if (params.domain) body.domain = params.domain
      if (params.organization_name) body.organization_name = params.organization_name
      if (params.linkedin_url) body.linkedin_url = params.linkedin_url
      return body
    },
  },

  transformResponse: async (response: Response) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`)
    }
    const data = await response.json()
    const person = data.person ?? null
    return {
      success: true,
      output: {
        email: (person?.email as string) ?? null,
        emailStatus: (person?.email_status as string) ?? null,
        person,
        found: !!person?.email,
      },
    }
  },

  outputs: {
    email: { type: 'string', description: 'Found email address', optional: true },
    emailStatus: { type: 'string', description: 'Email verification status', optional: true },
    person: { type: 'json', description: 'Person data from Apollo', optional: true },
    found: { type: 'boolean', description: 'Whether an email was found' },
  },
}
