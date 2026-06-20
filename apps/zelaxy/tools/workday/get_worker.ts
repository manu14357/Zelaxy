import type { ToolConfig } from '@/tools/types'
import type { WorkdayGetWorkerParams, WorkdayObjectResponse } from '@/tools/workday/types'

export const getWorkerTool: ToolConfig<WorkdayGetWorkerParams, WorkdayObjectResponse> = {
  id: 'workday_get_worker',
  name: 'Workday Get Worker',
  description: 'Retrieve a single worker by ID from the Workday Staffing REST API',
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
    workerId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Workday worker ID (WID) to retrieve',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.tenantUrl.trim().replace(/\/$/, '')
      return `${baseUrl}/workers/${encodeURIComponent(params.workerId.trim())}`
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
      output: {
        data,
        metadata: { id: data.id },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The requested Workday worker object' },
    metadata: {
      type: 'json',
      description: 'Worker identifiers',
      properties: {
        id: { type: 'string', description: 'Worker ID' },
      },
    },
  },
}
