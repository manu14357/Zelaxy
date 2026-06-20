import type { ServiceNowGetRecordParams, ServiceNowRecordResponse } from '@/tools/servicenow/types'
import type { ToolConfig } from '@/tools/types'

export const getRecordTool: ToolConfig<ServiceNowGetRecordParams, ServiceNowRecordResponse> = {
  id: 'servicenow_get_record',
  name: 'ServiceNow Get Record',
  description: 'Retrieve a single record from a ServiceNow table by sys_id',
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
      description: 'Table name (e.g. incident, task, sys_user)',
    },
    sysId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'sys_id of the record to retrieve',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.instanceUrl.trim().replace(/\/$/, '')
      return `${baseUrl}/api/now/table/${params.tableName.trim()}/${params.sysId.trim()}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.username}:${params.password}`).toString('base64')}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    const record = data.result ?? data
    return {
      success: true,
      output: {
        data: record,
        metadata: { table: params?.tableName ?? '', sysId: record?.sys_id ?? params?.sysId },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The requested ServiceNow record' },
    metadata: {
      type: 'json',
      description: 'Record identifiers',
      properties: {
        table: { type: 'string', description: 'Table the record was read from' },
        sysId: { type: 'string', description: 'sys_id of the record' },
      },
    },
  },
}
