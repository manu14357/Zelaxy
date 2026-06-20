import type {
  JiraSmGetRequestParams,
  JiraSmObjectResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const getRequestTool: ToolConfig<JiraSmGetRequestParams, JiraSmObjectResponse> = {
  id: 'jira_service_management_get_request',
  name: 'Jira Service Management Get Request',
  description: 'Retrieve a single customer request by issue ID or key',
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
    issueIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Issue ID or key of the request (e.g. SD-123)',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.siteUrl.trim().replace(/\/$/, '')
      return `${baseUrl}/rest/servicedeskapi/request/${encodeURIComponent(params.issueIdOrKey.trim())}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.email}:${params.apiToken}`).toString('base64')}`,
      Accept: 'application/json',
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
    data: { type: 'json', description: 'The requested customer request object' },
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
