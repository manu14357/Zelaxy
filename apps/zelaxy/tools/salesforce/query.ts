import type { QueryParams, SalesforceQueryResponse } from '@/tools/salesforce/types'
import type { ToolConfig } from '@/tools/types'

export const queryTool: ToolConfig<QueryParams, SalesforceQueryResponse> = {
  id: 'salesforce_query',
  name: 'Salesforce Query',
  description: 'Execute a SOQL query to retrieve records from Salesforce',
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
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'SOQL query to execute (e.g. SELECT Id, Name FROM Account LIMIT 10)',
    },
  },

  request: {
    url: (params) =>
      `${params.instanceUrl.replace(/\/$/, '')}/services/data/v59.0/query?q=${encodeURIComponent(params.query)}`,
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
      output: {
        data: data.records || [],
        metadata: {
          totalSize: data.totalSize ?? (data.records || []).length,
          done: data.done !== false,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of records returned by the query' },
    metadata: {
      type: 'json',
      description: 'Query result metadata',
      properties: {
        totalSize: { type: 'number', description: 'Total number of matching records' },
        done: { type: 'boolean', description: 'Whether all records have been returned' },
      },
    },
  },
}
