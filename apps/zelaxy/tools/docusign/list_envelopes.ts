import type { ToolConfig } from '@/tools/types'

export const docusignListEnvelopesTool: ToolConfig = {
  id: 'docusign_list_envelopes',
  name: 'DocuSign List Envelopes',
  description: 'List DocuSign envelopes with optional filters.',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'docusign',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'DocuSign OAuth access token',
    },
    fromDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter envelopes from this date (ISO 8601)',
    },
    toDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter envelopes to this date (ISO 8601)',
    },
    envelopeStatus: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status (e.g., sent, completed, voided)',
    },
    count: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of envelopes to return',
    },
  },

  request: {
    url: '/api/tools/docusign',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      operation: 'list_envelopes',
      fromDate: params.fromDate || null,
      toDate: params.toDate || null,
      envelopeStatus: params.envelopeStatus || null,
      count: params.count || null,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if ((data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Operation failed')
    }
    return {
      success: true,
      output: {
        envelopes: data.envelopes ?? [],
        totalSetSize: data.totalSetSize ?? 0,
        resultSetSize: data.resultSetSize ?? 0,
      },
    }
  },

  outputs: {
    envelopes: { type: 'json', description: 'Array of envelopes' },
    totalSetSize: { type: 'number', description: 'Total number of matching envelopes' },
    resultSetSize: { type: 'number', description: 'Number of envelopes returned' },
  },
}
