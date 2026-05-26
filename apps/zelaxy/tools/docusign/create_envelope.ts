import type { ToolConfig } from '@/tools/types'

export const docusignCreateEnvelopeTool: ToolConfig = {
  id: 'docusign_create_envelope',
  name: 'DocuSign Create Envelope',
  description: 'Create a new DocuSign envelope for document signing.',
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
      description: 'Email subject for the envelope',
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
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Envelope status: "created" (draft) or "sent" (default: created)',
    },
  },

  request: {
    url: '/api/tools/docusign',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      operation: 'create_envelope',
      emailSubject: params.emailSubject,
      signerEmail: params.signerEmail,
      signerName: params.signerName,
      status: params.status || 'created',
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
        statusDateTime: data.statusDateTime ?? null,
        uri: data.uri ?? null,
      },
    }
  },

  outputs: {
    envelopeId: { type: 'string', description: 'Envelope ID' },
    status: { type: 'string', description: 'Envelope status' },
    statusDateTime: { type: 'string', description: 'Status change timestamp', optional: true },
    uri: { type: 'string', description: 'Envelope URI', optional: true },
  },
}
