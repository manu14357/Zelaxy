import type { ToolConfig } from '@/tools/types'

export const docusignGetEnvelopeTool: ToolConfig = {
  id: 'docusign_get_envelope',
  name: 'DocuSign Get Envelope',
  description: 'Get the details of a DocuSign envelope by its ID.',
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
      description: 'The envelope ID to retrieve',
    },
  },

  request: {
    url: '/api/tools/docusign',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      operation: 'get_envelope',
      envelopeId: params.envelopeId,
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
        emailSubject: data.emailSubject ?? '',
        sentDateTime: data.sentDateTime ?? null,
        completedDateTime: data.completedDateTime ?? null,
        createdDateTime: data.createdDateTime ?? null,
        statusChangedDateTime: data.statusChangedDateTime ?? null,
      },
    }
  },

  outputs: {
    envelopeId: { type: 'string', description: 'Envelope ID' },
    status: { type: 'string', description: 'Envelope status' },
    emailSubject: { type: 'string', description: 'Email subject' },
    sentDateTime: { type: 'string', description: 'Sent timestamp', optional: true },
    completedDateTime: { type: 'string', description: 'Completed timestamp', optional: true },
    createdDateTime: { type: 'string', description: 'Created timestamp', optional: true },
    statusChangedDateTime: {
      type: 'string',
      description: 'Last status change timestamp',
      optional: true,
    },
  },
}
