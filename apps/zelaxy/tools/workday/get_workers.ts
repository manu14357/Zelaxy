import type { ToolConfig } from '@/tools/types'
import type { WorkdayGetWorkersParams, WorkdayListResponse } from '@/tools/workday/types'

export const getWorkersTool: ToolConfig<WorkdayGetWorkersParams, WorkdayListResponse> = {
  id: 'workday_get_workers',
  name: 'Workday Get Workers',
  description: 'List workers from the Workday Staffing REST API',
  version: '1.0.0',

  params: {
    tenantUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description:
        'Workday Staffing API base URL including tenant (e.g. https://wd5-impl-services1.workday.com/ccx/api/staffing/v6/your_tenant)',
    },
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Workday OAuth bearer access token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of workers to return (default 20)',
    },
    offset: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of records to skip for pagination',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.tenantUrl.trim().replace(/\/$/, '')
      const url = new URL(`${baseUrl}/workers`)
      url.searchParams.append('limit', String(params.limit ?? 20))
      if (params.offset !== undefined && params.offset !== null) {
        url.searchParams.append('offset', String(params.offset))
      }
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
    const workers = Array.isArray(data.data) ? data.data : []
    return {
      success: true,
      output: {
        data: workers,
        metadata: { count: workers.length, total: data.total },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Workday worker objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of workers returned' },
        total: { type: 'number', description: 'Total number of matching workers' },
      },
    },
  },
}
