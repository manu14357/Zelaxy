import type { SalesforceObjectResponse, UpdateRecordParams } from '@/tools/salesforce/types'
import type { ToolConfig } from '@/tools/types'

export const updateRecordTool: ToolConfig<UpdateRecordParams, SalesforceObjectResponse> = {
  id: 'salesforce_update_record',
  name: 'Salesforce Update Record',
  description: 'Update an existing record for a Salesforce sObject',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Salesforce OAuth access token',
    },
    instanceUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Salesforce instance URL (e.g. https://your-domain.my.salesforce.com)',
    },
    sobject: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The sObject type to update (e.g. Contact, Account, Lead, Opportunity)',
    },
    recordId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the record to update',
    },
    fields: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Field values to update as a JSON object (e.g. {"Email":"new@x.com"})',
    },
  },

  request: {
    url: (params) =>
      `${params.instanceUrl.replace(/\/$/, '')}/services/data/v59.0/sobjects/${params.sobject}/${params.recordId.trim()}`,
    method: 'PATCH',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      let fields = params.fields
      if (typeof fields === 'string') fields = JSON.parse(fields)
      return fields as Record<string, any>
    },
  },

  transformResponse: async (response, params) => {
    // Salesforce PATCH returns 204 No Content on success
    let data: Record<string, any> = {}
    const text = await response.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = {}
      }
    }
    return {
      success: true,
      output: {
        data: { updated: true, ...data },
        metadata: { id: params?.recordId?.trim() || '' },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Salesforce update result' },
    metadata: {
      type: 'json',
      description: 'Record identifiers',
      properties: {
        id: { type: 'string', description: 'Updated record ID' },
      },
    },
  },
}
