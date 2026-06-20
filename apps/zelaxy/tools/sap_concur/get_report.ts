import type { GetReportParams, SapConcurObjectResponse } from '@/tools/sap_concur/types'
import type { ToolConfig } from '@/tools/types'

export const getReportTool: ToolConfig<GetReportParams, SapConcurObjectResponse> = {
  id: 'sap_concur_get_report',
  name: 'SAP Concur Get Report',
  description:
    'Retrieve a single expense report by ID from SAP Concur (GET /api/v3.0/expense/reports/{id}).',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'SAP Concur OAuth bearer access token',
    },
    reportId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Expense report ID',
    },
    user: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Login ID of the report owner (required when acting on behalf of another user)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://www.concursolutions.com/api/v3.0/expense/reports/${encodeURIComponent(params.reportId)}`
      )
      if (params.user) url.searchParams.append('user', params.user)
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
    return {
      success: true,
      output: { data, metadata: { id: data?.ID, status: response.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The expense report header object' },
    metadata: {
      type: 'json',
      description: 'Report identifiers',
      properties: {
        id: { type: 'string', description: 'Report ID' },
        status: { type: 'number', description: 'HTTP status code returned by Concur' },
      },
    },
  },
}
