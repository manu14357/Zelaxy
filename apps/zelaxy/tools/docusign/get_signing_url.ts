import type { ToolConfig } from '@/tools/types'

export const docusignGetSigningUrlTool: ToolConfig = {
  id: 'docusign_get_signing_url',
  name: 'DocuSign Get Signing URL',
  description: 'Generate an embedded signing URL for a DocuSign envelope.',
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
      description: 'The envelope ID to get a signing URL for',
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
    returnUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL to redirect to after signing',
    },
  },

  request: {
    url: '/api/tools/docusign',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      operation: 'get_signing_url',
      envelopeId: params.envelopeId,
      signerEmail: params.signerEmail,
      signerName: params.signerName,
      returnUrl: params.returnUrl || null,
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
        signingUrl: data.signingUrl ?? '',
        envelopeId: data.envelopeId ?? '',
      },
    }
  },

  outputs: {
    signingUrl: { type: 'string', description: 'Embedded signing URL' },
    envelopeId: { type: 'string', description: 'Envelope ID' },
  },
}
