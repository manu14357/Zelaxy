import type { BrexListCashTransactionsParams, BrexListResponse } from '@/tools/brex/types'
import type { ToolConfig } from '@/tools/types'

export const listCashTransactionsTool: ToolConfig<
  BrexListCashTransactionsParams,
  BrexListResponse
> = {
  id: 'brex_list_cash_transactions',
  name: 'Brex List Cash Transactions',
  description: 'List transactions for a Brex cash account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Brex user token (generated from Developer Settings in the Brex dashboard)',
    },
    accountId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the cash account to list transactions for',
    },
    postedAtStart: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Only include transactions posted at or after this ISO 8601 timestamp',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of transactions to return (default 100, max 1000)',
    },
  },

  request: {
    url: (params) => {
      const query = new URLSearchParams()
      if (params.postedAtStart) query.append('posted_at_start', params.postedAtStart)
      if (params.cursor) query.append('cursor', params.cursor)
      if (params.limit) query.append('limit', params.limit)
      const qs = query.toString()
      const base = `https://api.brex.com/v2/transactions/cash/${encodeURIComponent(params.accountId.trim())}`
      return qs ? `${base}?${qs}` : base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items ?? []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, next_cursor: data.next_cursor ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Brex cash transaction objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        next_cursor: { type: 'string', description: 'Cursor for the next page of results' },
      },
    },
  },
}
