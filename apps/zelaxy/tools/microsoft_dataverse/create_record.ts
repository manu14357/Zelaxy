import type { CreateRecordParams, DataverseObjectResponse } from '@/tools/microsoft_dataverse/types'
import type { ToolConfig } from '@/tools/types'

export const createRecordTool: ToolConfig<CreateRecordParams, DataverseObjectResponse> = {
  id: 'microsoft_dataverse_create_record',
  name: 'Microsoft Dataverse Create Record',
  description: 'Create a new record in a Microsoft Dataverse table',
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
    fields: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Record fields as a JSON object with column names as keys',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.orgUrl.replace(/\/$/, '')
      return `${baseUrl}/api/data/v9.2/${params.entitySetName}`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      Accept: 'application/json',
      Prefer: 'return=representation',
    }),
    body: (params) => {
      let fields = params.fields
      if (typeof fields === 'string') {
        try {
          fields = JSON.parse(fields)
        } catch {
          throw new Error('Invalid JSON format for record fields')
        }
      }
      return fields as Record<string, any>
    },
  },

  transformResponse: async (response, params) => {
    const data = await response.json().catch(() => ({}))
    let recordId = ''
    const idKey = Object.keys(data).find((k) => k.endsWith('id') && !k.startsWith('@'))
    if (idKey) recordId = String(data[idKey])
    if (!recordId) {
      const entityIdHeader = response.headers.get('OData-EntityId')
      const match = entityIdHeader?.match(/\(([^)]+)\)/)
      if (match) recordId = match[1]
    }
    return {
      success: true,
      output: {
        data,
        metadata: { entitySetName: params?.entitySetName ?? '', recordId },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Dataverse record' },
    metadata: {
      type: 'json',
      description: 'Record identifiers',
      properties: {
        entitySetName: { type: 'string', description: 'The entity set name' },
        recordId: { type: 'string', description: 'The created record ID' },
      },
    },
  },
}
