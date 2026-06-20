import type { QuartrListCompaniesParams, QuartrListResponse } from '@/tools/quartr/types'
import type { ToolConfig } from '@/tools/types'

export const listCompaniesTool: ToolConfig<QuartrListCompaniesParams, QuartrListResponse> = {
  id: 'quartr_list_companies',
  name: 'Quartr List Companies',
  description: 'List companies covered by Quartr, filterable by ticker, ISIN, and country',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Quartr API key',
    },
    tickers: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of company tickers (e.g. "AAPL,MSFT")',
    },
    isins: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of ISINs (e.g. "US0378331005")',
    },
    countries: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of ISO 3166-1 alpha-2 country codes (e.g. "US,SE")',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items to return (default 10, max 500)',
    },
    cursor: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response (nextCursor)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.quartr.com/public/v3/companies')
      if (params.tickers) url.searchParams.set('tickers', params.tickers)
      if (params.isins) url.searchParams.set('isins', params.isins)
      if (params.countries) url.searchParams.set('countries', params.countries)
      if (params.limit) url.searchParams.set('limit', String(params.limit))
      if (params.cursor) url.searchParams.set('cursor', String(params.cursor))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({ 'x-api-key': params.apiKey }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const companies = json.data ?? []
    return {
      success: true,
      output: {
        data: companies,
        metadata: { count: companies.length, nextCursor: json.pagination?.nextCursor ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Quartr company objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of companies returned' },
        nextCursor: { type: 'number', description: 'Cursor for the next page (null when none)' },
      },
    },
  },
}
