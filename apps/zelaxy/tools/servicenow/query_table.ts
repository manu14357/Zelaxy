import type { ServiceNowListResponse, ServiceNowQueryTableParams } from '@/tools/servicenow/types'
import type { ToolConfig } from '@/tools/types'

export const queryTableTool: ToolConfig<ServiceNowQueryTableParams, ServiceNowListResponse> = {
  id: 'servicenow_query_table',
  name: 'ServiceNow Query Table',
  description: 'Query records from a ServiceNow table using an encoded query',
  version: '1.0.0',

  params: {
    instanceUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ServiceNow instance URL (e.g. https://dev12345.service-now.com)',
    },
    username: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ServiceNow username',
    },
    password: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ServiceNow password',
    },
    tableName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Table name to query (e.g. incident, task, sys_user)',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Encoded query string (e.g. active=true^priority=1)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of records to return (default 10)',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.instanceUrl.trim().replace(/\/$/, '')
      const url = new URL(`${baseUrl}/api/now/table/${params.tableName.trim()}`)
      if (params.query) url.searchParams.append('sysparm_query', params.query)
      url.searchParams.append('sysparm_limit', String(params.limit ?? 10))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.username}:${params.password}`).toString('base64')}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    const records = Array.isArray(data.result) ? data.result : []
    return {
      success: true,
      output: {
        data: records,
        metadata: { table: params?.tableName ?? '', count: records.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of ServiceNow records' },
    metadata: {
      type: 'json',
      description: 'Query metadata',
      properties: {
        table: { type: 'string', description: 'Table that was queried' },
        count: { type: 'number', description: 'Number of records returned' },
      },
    },
  },
}
