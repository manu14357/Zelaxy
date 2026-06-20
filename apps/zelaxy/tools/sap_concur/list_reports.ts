import type { ListReportsParams, SapConcurListResponse } from '@/tools/sap_concur/types'
import type { ToolConfig } from '@/tools/types'

export const listReportsTool: ToolConfig<ListReportsParams, SapConcurListResponse> = {
  id: 'sap_concur_list_reports',
  name: 'SAP Concur List Reports',
  description: 'List expense reports from SAP Concur (GET /api/v3.0/expense/reports).',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'SAP Concur OAuth bearer access token',
    },
    user: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by a specific user (login ID) or "ALL"',
    },
    approvalStatusCode: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by approval status code (e.g. A_NOTF, A_PEND, A_APPR)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of records to return (default 25, max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://www.concursolutions.com/api/v3.0/expense/reports')
      if (params.user) url.searchParams.append('user', params.user)
      if (params.approvalStatusCode)
        url.searchParams.append('approvalStatusCode', params.approvalStatusCode)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data?.Items ?? []
    return {
      success: true,
      output: {
        data: Array.isArray(items) ? items : [],
        metadata: { count: Array.isArray(items) ? items.length : 0, status: response.status },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of expense report header objects (Items)' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of reports returned' },
        status: { type: 'number', description: 'HTTP status code returned by Concur' },
      },
    },
  },
}
