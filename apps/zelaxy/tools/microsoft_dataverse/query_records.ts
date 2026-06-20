import type { DataverseListResponse, QueryRecordsParams } from '@/tools/microsoft_dataverse/types'
import type { ToolConfig } from '@/tools/types'

export const queryRecordsTool: ToolConfig<QueryRecordsParams, DataverseListResponse> = {
  id: 'microsoft_dataverse_query_records',
  name: 'Microsoft Dataverse Query Records',
  description: 'Query records from a Microsoft Dataverse table with optional OData filter',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth bearer access token for Microsoft Dataverse',
    },
    orgUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Dataverse environment URL (e.g., https://myorg.crm.dynamics.com)',
    },
    entitySetName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Entity set name (plural table name, e.g., accounts, contacts)',
    },
    filter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'OData $filter expression (e.g., statecode eq 0)',
    },
    top: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of records to return (default 10)',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.orgUrl.replace(/\/$/, '')
      const url = new URL(`${baseUrl}/api/data/v9.2/${params.entitySetName}`)
      if (params.filter) url.searchParams.append('$filter', params.filter)
      url.searchParams.append('$top', String(params.top ?? 10))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    const records = data.value || []
    return {
      success: true,
      output: {
        data: records,
        metadata: { entitySetName: params?.entitySetName ?? '', count: records.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Dataverse records' },
    metadata: {
      type: 'json',
      description: 'Query metadata',
      properties: {
        entitySetName: { type: 'string', description: 'The queried entity set name' },
        count: { type: 'number', description: 'Number of records returned' },
      },
    },
  },
}
