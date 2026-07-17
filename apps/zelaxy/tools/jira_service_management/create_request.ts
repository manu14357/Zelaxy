import type {
  JiraSmCreateRequestParams,
  JiraSmObjectResponse,
} from '@/tools/jira_service_management/types'
import { getJsmApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const createRequestTool: ToolConfig<JiraSmCreateRequestParams, JiraSmObjectResponse> = {
  id: 'jira_service_management_create_request',
  name: 'Jira Service Management Create Request',
  description: 'Create a new customer request in a Jira Service Management service desk',
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
    url: (params) => `${getJsmApiBaseUrl(params.cloudId)}/request`,
    method: 'POST',
    headers: (params) => getJsmHeaders(params.accessToken),
    body: (params) => ({
      serviceDeskId: params.serviceDeskId,
      requestTypeId: params.requestTypeId,
      requestFieldValues:
        typeof params.requestFieldValues === 'string'
          ? JSON.parse(params.requestFieldValues)
          : params.requestFieldValues,
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
