import type { ToolConfig } from '@/tools/types'

export const docusignVoidEnvelopeTool: ToolConfig = {
  id: 'docusign_void_envelope',
  name: 'DocuSign Void Envelope',
  description: 'Void a DocuSign envelope to cancel the signing process.',
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
    envelopeId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The envelope ID to void',
    },
    voidedReason: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Reason for voiding the envelope',
    },
  },

  request: {
    url: '/api/tools/docusign',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      operation: 'void_envelope',
      envelopeId: params.envelopeId,
      voidedReason: params.voidedReason,
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
        envelopeId: data.envelopeId ?? '',
        status: data.status ?? '',
      },
    }
  },

  outputs: {
    envelopeId: { type: 'string', description: 'Envelope ID' },
    status: { type: 'string', description: 'Envelope status after voiding' },
  },
}
