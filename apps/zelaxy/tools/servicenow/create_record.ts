import type {
  ServiceNowCreateRecordParams,
  ServiceNowRecordResponse,
} from '@/tools/servicenow/types'
import type { ToolConfig } from '@/tools/types'

export const createRecordTool: ToolConfig<ServiceNowCreateRecordParams, ServiceNowRecordResponse> =
  {
    id: 'servicenow_create_record',
    name: 'ServiceNow Create Record',
    description: 'Create a new record in a ServiceNow table',
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
        description: 'Table name to create the record in (e.g. incident)',
      },
      fields: {
        type: 'json',
        required: true,
        visibility: 'user-or-llm',
        description: 'Field values as a JSON object (e.g. {"short_description":"Issue"})',
      },
    },

    request: {
      url: (params) => {
        const baseUrl = params.instanceUrl.trim().replace(/\/$/, '')
        return `${baseUrl}/api/now/table/${params.tableName.trim()}`
      },
      method: 'POST',
      headers: (params) => ({
        Authorization: `Basic ${Buffer.from(`${params.username}:${params.password}`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
      body: (params) => params.fields,
    },

    transformResponse: async (response, params) => {
      const data = await response.json()
      const record = data.result ?? data
      return {
        success: true,
        output: {
          data: record,
          metadata: { table: params?.tableName ?? '', sysId: record?.sys_id },
        },
      }
    },

    outputs: {
      data: { type: 'json', description: 'The created ServiceNow record' },
      metadata: {
        type: 'json',
        description: 'Record identifiers',
        properties: {
          table: { type: 'string', description: 'Table the record was created in' },
          sysId: { type: 'string', description: 'sys_id of the created record' },
        },
      },
    },
  }
