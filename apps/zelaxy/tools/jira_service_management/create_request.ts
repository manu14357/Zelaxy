import type {
  JiraSmCreateRequestParams,
  JiraSmObjectResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const createRequestTool: ToolConfig<JiraSmCreateRequestParams, JiraSmObjectResponse> = {
  id: 'jira_service_management_create_request',
  name: 'Jira Service Management Create Request',
  description: 'Create a new customer request in a Jira Service Management service desk',
  version: '1.0.0',

  params: {
    siteUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Atlassian site URL (e.g. https://your-domain.atlassian.net)',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Atlassian account email',
    },
    apiToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Atlassian API token',
    },
    serviceDeskId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the service desk to create the request in',
    },
    requestTypeId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the request type',
    },
    requestFieldValues: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Field values for the request as a JSON object (e.g. {"summary":"...","description":"..."})',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.siteUrl.trim().replace(/\/$/, '')
      return `${baseUrl}/rest/servicedeskapi/request`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.email}:${params.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: (params) => ({
      serviceDeskId: params.serviceDeskId,
      requestTypeId: params.requestTypeId,
      requestFieldValues: params.requestFieldValues,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { id: data.issueId, issueKey: data.issueKey },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created customer request object' },
    metadata: {
      type: 'json',
      description: 'Request identifiers',
      properties: {
        id: { type: 'string', description: 'Issue ID' },
        issueKey: { type: 'string', description: 'Issue key' },
      },
    },
  },
}
