import type { NewRelicResponse, NrqlQueryParams } from '@/tools/new_relic/types'
import type { ToolConfig } from '@/tools/types'

export const nrqlQueryTool: ToolConfig<NrqlQueryParams, NewRelicResponse> = {
  id: 'new_relic_nrql_query',
  name: 'New Relic NRQL Query',
  description: 'Run a NRQL query against a New Relic account using NerdGraph',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'New Relic user API key for NerdGraph',
    },
    accountId: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'New Relic account ID to query',
    },
    nrql: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'NRQL query to execute',
    },
  },

  request: {
    url: () => 'https://api.newrelic.com/graphql',
    method: 'POST',
    headers: (params) => ({
      'Api-Key': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: `{
  actor {
    account(id: ${Math.trunc(Number(params.accountId))}) {
      nrql(query: ${JSON.stringify(params.nrql)}) {
        results
      }
    }
  }
}`,
    }),
  },

  transformResponse: async (response) => {
    const payload = await response.json()
    const results = payload?.data?.actor?.account?.nrql?.results || []
    return {
      success: true,
      output: { data: results, metadata: { count: results.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'NRQL result rows' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of result rows returned' },
      },
    },
  },
}
