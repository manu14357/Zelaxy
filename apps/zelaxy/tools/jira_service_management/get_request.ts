import type {
  JiraSmGetRequestParams,
  JiraSmObjectResponse,
} from '@/tools/jira_service_management/types'
import {
  buildJsmQuery,
  getJsmApiBaseUrl,
  getJsmHeaders,
} from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const getRequestTool: ToolConfig<JiraSmGetRequestParams, JiraSmObjectResponse> = {
  id: 'jira_service_management_get_request',
  name: 'Jira Service Management Get Request',
  description: 'Retrieve a single customer request by issue ID or key',
  version: '2.0.0',

  oauth: {
    required: true,
    provider: 'jira',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Jira Service Management',
    },
    cloudId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Jira Cloud ID',
    },
    expand: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated fields to expand (e.g. serviceDesk,requestType,status)',
    },
    issueIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Issue ID or key of the request (e.g. SD-123)',
    },
  },

  request: {
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/request/${encodeURIComponent(params.issueIdOrKey.trim())}${buildJsmQuery({ expand: params.expand })}`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
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
