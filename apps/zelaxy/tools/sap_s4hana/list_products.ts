import type { ListProductsParams, SapS4HanaResponse } from '@/tools/sap_s4hana/types'
import type { ToolConfig } from '@/tools/types'

export const listProductsTool: ToolConfig<ListProductsParams, SapS4HanaResponse> = {
  id: 'sap_s4hana_list_products',
  name: 'SAP S/4HANA List Products',
  description:
    'List products (materials) from SAP S/4HANA (API_PRODUCT_SRV, A_Product) with optional OData $filter, $top, $skip, and $select.',
  version: '1.0.0',

  params: {
    baseUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Base URL of the S/4HANA host (e.g. https://my000000.s4hana.cloud.sap)',
    },
    username: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Username for HTTP Basic authentication',
    },
    password: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Password for HTTP Basic authentication',
    },
    filter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'OData $filter expression (e.g., "ProductType eq \'FERT\'")',
    },
    top: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum results to return ($top, default 10)',
    },
    skip: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip ($skip)',
    },
    select: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated fields to return ($select)',
    },
  },

  request: {
    url: (params) => {
      const base = params.baseUrl.replace(/\/$/, '')
      const url = new URL(`${base}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`)
      url.searchParams.append('$format', 'json')
      url.searchParams.append('$top', String(params.top ?? 10))
      if (params.filter) url.searchParams.append('$filter', params.filter)
      if (typeof params.skip === 'number') url.searchParams.append('$skip', String(params.skip))
      if (params.select) url.searchParams.append('$select', params.select)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.username}:${params.password}`).toString('base64')}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data?.d?.results ?? []
    return {
      success: true,
      output: {
        data,
        metadata: { status: response.status, count: Array.isArray(results) ? results.length : 0 },
      },
    }
  },

  outputs: {
    data: {
      type: 'json',
      description: 'OData v2 envelope `{ d: { results: [...] } }` of A_Product entities',
    },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        status: { type: 'number', description: 'HTTP status code returned by SAP' },
        count: { type: 'number', description: 'Number of products returned' },
      },
    },
  },
}
