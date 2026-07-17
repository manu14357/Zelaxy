import {
  JIRA_SM_CUSTOMER_ITEM_PROPERTIES,
  type JiraSmGetCustomersParams,
  type JiraSmGetCustomersResponse,
} from '@/tools/jira_service_management/types'
import {
  buildJsmQuery,
  getJsmApiBaseUrl,
  getJsmHeaders,
} from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetCustomersTool: ToolConfig<
  JiraSmGetCustomersParams,
  JiraSmGetCustomersResponse
> = {
  id: 'jira_service_management_get_customers',
  name: 'Jira Service Management Get Customers',
  description: 'Get customers for a service desk in Jira Service Management',
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
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Search query to filter customers (e.g., "john", "acme")',
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
      `${getJsmApiBaseUrl(params.cloudId)}/servicedesk/${encodeURIComponent(params.serviceDeskId)}/customer${buildJsmQuery(
        { query: params.query, start: params.start, limit: params.limit }
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
        customers: data.values || [],
        total: data.size || 0,
        isLastPage: data.isLastPage ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    customers: {
      type: 'array',
      description: 'List of customers',
      items: {
        type: 'object',
        properties: JIRA_SM_CUSTOMER_ITEM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of customers' },
    isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
