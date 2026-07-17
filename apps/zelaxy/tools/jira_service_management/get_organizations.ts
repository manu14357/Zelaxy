import {
  JIRA_SM_ORGANIZATION_ITEM_PROPERTIES,
  type JiraSmGetOrganizationsParams,
  type JiraSmGetOrganizationsResponse,
} from '@/tools/jira_service_management/types'
import {
  buildJsmQuery,
  getJsmApiBaseUrl,
  getJsmHeaders,
} from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetOrganizationsTool: ToolConfig<
  JiraSmGetOrganizationsParams,
  JiraSmGetOrganizationsResponse
> = {
  id: 'jira_service_management_get_organizations',
  name: 'Jira Service Management Get Organizations',
  description: 'Get organizations for a service desk in Jira Service Management',
  version: '1.0.0',

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
      description: 'Jira Cloud ID for the instance',
    },
    serviceDeskId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Service Desk ID (e.g., "1", "2")',
    },
    start: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Start index for pagination (e.g., 0, 50, 100)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum results to return (e.g., 10, 25, 50)',
    },
  },

  request: {
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/servicedesk/${encodeURIComponent(params.serviceDeskId)}/organization${buildJsmQuery(
        { start: params.start, limit: params.limit }
      )}`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        organizations: data.values || [],
        total: data.size || 0,
        isLastPage: data.isLastPage ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    organizations: {
      type: 'array',
      description: 'List of organizations',
      items: {
        type: 'object',
        properties: JIRA_SM_ORGANIZATION_ITEM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of organizations' },
    isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
