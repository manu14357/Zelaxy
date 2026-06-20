import type { LoopsResponse, LoopsSendTransactionalParams } from '@/tools/loops/types'
import type { ToolConfig } from '@/tools/types'

export const sendTransactionalTool: ToolConfig<LoopsSendTransactionalParams, LoopsResponse> = {
  id: 'loops_send_transactional',
  name: 'Loops Send Transactional',
  description: 'Send a transactional email using a Loops template',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Loops API key',
    },
    transactionalId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the transactional email template to send',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The email address of the recipient',
    },
  },

  request: {
    url: () => 'https://app.loops.so/api/v1/transactional',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ transactionalId: params.transactionalId, email: params.email }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { success: data.success ?? true } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Loops API response' },
    metadata: {
      type: 'json',
      description: 'Send result',
      properties: {
        success: { type: 'boolean', description: 'Whether the email was sent' },
      },
    },
  },
}
