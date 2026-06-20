import type { GetBusinessPartnerParams, SapS4HanaResponse } from '@/tools/sap_s4hana/types'
import type { ToolConfig } from '@/tools/types'

export const getBusinessPartnerTool: ToolConfig<GetBusinessPartnerParams, SapS4HanaResponse> = {
  id: 'sap_s4hana_get_business_partner',
  name: 'SAP S/4HANA Get Business Partner',
  description:
    'Retrieve a single business partner by BusinessPartner key from SAP S/4HANA (API_BUSINESS_PARTNER, A_BusinessPartner).',
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
    businessPartner: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'BusinessPartner key (string, up to 10 characters)',
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
      const key = String(params.businessPartner).trim().replace(/'/g, "''")
      const url = new URL(
        `${base}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner('${key}')`
      )
      url.searchParams.append('$format', 'json')
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
    return {
      success: true,
      output: { data, metadata: { status: response.status } },
    }
  },

  outputs: {
    data: {
      type: 'json',
      description: 'OData v2 envelope `{ d: {...} }` for the A_BusinessPartner entity',
    },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        status: { type: 'number', description: 'HTTP status code returned by SAP' },
      },
    },
  },
}
