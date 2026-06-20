import type { GetRecordParams, SalesforceObjectResponse } from '@/tools/salesforce/types'
import type { ToolConfig } from '@/tools/types'

export const getRecordTool: ToolConfig<GetRecordParams, SalesforceObjectResponse> = {
  id: 'salesforce_get_record',
  name: 'Salesforce Get Record',
  description: 'Retrieve a single record by ID for a Salesforce sObject',
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
      description: 'The sObject type to retrieve (e.g. Contact, Account, Lead, Opportunity)',
    },
    recordId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the record to retrieve',
    },
    fields: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated field API names to return (e.g. "Id,Name,Email")',
    },
  },

  request: {
    url: (params) => {
      const base = `${params.instanceUrl.replace(/\/$/, '')}/services/data/v59.0/sobjects/${params.sobject}/${params.recordId.trim()}`
      if (params.fields) return `${base}?fields=${encodeURIComponent(params.fields)}`
      return base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.Id || data.id || '' } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The retrieved Salesforce record' },
    metadata: {
      type: 'json',
      description: 'Record identifiers',
      properties: {
        id: { type: 'string', description: 'Record ID' },
      },
    },
  },
}
