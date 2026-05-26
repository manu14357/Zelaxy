import type { ToolConfig } from '@/tools/types'

export const docusignSendEnvelopeTool: ToolConfig = {
  id: 'docusign_send_envelope',
  name: 'DocuSign Send Envelope',
  description: 'Create and immediately send a DocuSign envelope for signing.',
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
    emailSubject: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email subject',
    },
    signerEmail: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address of the signer',
    },
    signerName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Full name of the signer',
    },
  },

  request: {
    url: '/api/tools/docusign',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      operation: 'send_envelope',
      emailSubject: params.emailSubject,
      signerEmail: params.signerEmail,
      signerName: params.signerName,
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
    envelopeId: { type: 'string', description: 'Sent envelope ID' },
    status: { type: 'string', description: 'Envelope status' },
  },
}
