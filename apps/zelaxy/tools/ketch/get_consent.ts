import type { KetchConsentResponse, KetchGetConsentParams } from '@/tools/ketch/types'
import type { ToolConfig } from '@/tools/types'

export const getConsentTool: ToolConfig<KetchGetConsentParams, KetchConsentResponse> = {
  id: 'ketch_get_consent',
  name: 'Ketch Get Consent',
  description: 'Retrieve consent preferences for a data subject from Ketch',
  version: '1.0.0',

  params: {
    organizationCode: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Ketch organization code',
    },
    propertyCode: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Digital property code defined in Ketch',
    },
    environmentCode: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Environment code defined in Ketch (e.g., "production")',
    },
    jurisdictionCode: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Jurisdiction code (e.g., "gdpr", "ccpa")',
    },
    identities: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Identity map (e.g., {"email": "user@example.com"})',
    },
    purposes: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional purposes to filter the consent query',
    },
  },

  request: {
    url: (params) =>
      `https://global.ketchcdn.com/web/v2/consent/${encodeURIComponent(params.organizationCode.trim())}/get`,
    method: 'POST',
    headers: () => ({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {
        organizationCode: params.organizationCode.trim(),
        propertyCode: params.propertyCode,
        environmentCode: params.environmentCode,
        identities: params.identities,
      }
      if (params.jurisdictionCode) body.jurisdictionCode = params.jurisdictionCode
      if (params.purposes) body.purposes = params.purposes
      return body
    },
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { organizationCode: params?.organizationCode.trim() ?? '' },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Consent purposes and vendor statuses from Ketch' },
    metadata: {
      type: 'json',
      description: 'Request identifiers',
      properties: {
        organizationCode: { type: 'string', description: 'Ketch organization code' },
      },
    },
  },
}
