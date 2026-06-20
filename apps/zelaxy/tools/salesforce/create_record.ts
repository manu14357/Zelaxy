import type { CreateRecordParams, SalesforceObjectResponse } from '@/tools/salesforce/types'
import type { ToolConfig } from '@/tools/types'

export const createRecordTool: ToolConfig<CreateRecordParams, SalesforceObjectResponse> = {
  id: 'salesforce_create_record',
  name: 'Salesforce Create Record',
  description: 'Create a new record for a Salesforce sObject',
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
      description: 'The sObject type to create (e.g. Contact, Account, Lead, Opportunity)',
    },
    fields: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Field values as a JSON object (e.g. {"LastName":"Doe","Email":"j@x.com"})',
    },
  },

  request: {
    url: (params) =>
      `${params.instanceUrl.replace(/\/$/, '')}/services/data/v59.0/sobjects/${params.sobject}`,
    method: 'POST',
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

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Salesforce create result' },
    metadata: {
      type: 'json',
      description: 'Record identifiers',
      properties: {
        id: { type: 'string', description: 'Created record ID' },
      },
    },
  },
}
