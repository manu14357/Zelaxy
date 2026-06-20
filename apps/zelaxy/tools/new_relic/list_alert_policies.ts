import type { ListAlertPoliciesParams, NewRelicResponse } from '@/tools/new_relic/types'
import type { ToolConfig } from '@/tools/types'

export const listAlertPoliciesTool: ToolConfig<ListAlertPoliciesParams, NewRelicResponse> = {
  id: 'new_relic_list_alert_policies',
  name: 'New Relic List Alert Policies',
  description: 'List alert policies for a New Relic account using NerdGraph',
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
      description: 'New Relic account ID to list alert policies for',
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
      alerts {
        policiesSearch {
          policies {
            id
            name
            incidentPreference
          }
        }
      }
    }
  }
}`,
    }),
  },

  transformResponse: async (response) => {
    const payload = await response.json()
    const policies = payload?.data?.actor?.account?.alerts?.policiesSearch?.policies || []
    return {
      success: true,
      output: { data: policies, metadata: { count: policies.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of alert policy objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of alert policies returned' },
      },
    },
  },
}
