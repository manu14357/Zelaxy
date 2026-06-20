import type { DataverseObjectResponse, GetRecordParams } from '@/tools/microsoft_dataverse/types'
import type { ToolConfig } from '@/tools/types'

export const getRecordTool: ToolConfig<GetRecordParams, DataverseObjectResponse> = {
  id: 'microsoft_dataverse_get_record',
  name: 'Microsoft Dataverse Get Record',
  description: 'Retrieve a single record from a Microsoft Dataverse table by ID',
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
    recordId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The unique identifier (GUID) of the record to retrieve',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.orgUrl.replace(/\/$/, '')
      return `${baseUrl}/api/data/v9.2/${params.entitySetName}(${params.recordId})`
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
    const idKey = Object.keys(data).find((k) => k.endsWith('id') && !k.startsWith('@'))
    const recordId = idKey ? String(data[idKey]) : (params?.recordId ?? '')
    return {
      success: true,
      output: {
        data,
        metadata: { entitySetName: params?.entitySetName ?? '', recordId },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Dataverse record' },
    metadata: {
      type: 'json',
      description: 'Record identifiers',
      properties: {
        entitySetName: { type: 'string', description: 'The entity set name' },
        recordId: { type: 'string', description: 'The record ID' },
      },
    },
  },
}
