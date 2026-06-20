import type { KetchConsentResponse, KetchSetConsentParams } from '@/tools/ketch/types'
import type { ToolConfig } from '@/tools/types'

export const setConsentTool: ToolConfig<KetchSetConsentParams, KetchConsentResponse> = {
  id: 'ketch_set_consent',
  name: 'Ketch Set Consent',
  description: 'Update consent preferences for a data subject in Ketch',
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
      required: true,
      visibility: 'user-or-llm',
      description:
        'Map of purpose codes to consent settings (e.g., {"analytics": {"allowed": "granted", "legalBasisCode": "consent_optin"}})',
    },
    collectedAt: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'UNIX timestamp when consent was collected (defaults to current time)',
    },
  },

  request: {
    url: (params) =>
      `https://global.ketchcdn.com/web/v2/consent/${encodeURIComponent(params.organizationCode.trim())}/update`,
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
        purposes: params.purposes,
        collectedAt: params.collectedAt ?? Math.floor(Date.now() / 1000),
      }
      if (params.jurisdictionCode) body.jurisdictionCode = params.jurisdictionCode
      return body
    },
  },

  transformResponse: async (response, params) => {
    const data = response.status === 204 ? {} : await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { organizationCode: params?.organizationCode.trim() ?? '' },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Updated consent purposes from Ketch' },
    metadata: {
      type: 'json',
      description: 'Request identifiers',
      properties: {
        organizationCode: { type: 'string', description: 'Ketch organization code' },
      },
    },
  },
}
