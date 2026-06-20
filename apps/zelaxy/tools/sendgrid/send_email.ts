import type { SendEmailParams, SendgridObjectResponse } from '@/tools/sendgrid/types'
import type { ToolConfig } from '@/tools/types'

export const sendEmailTool: ToolConfig<SendEmailParams, SendgridObjectResponse> = {
  id: 'sendgrid_send_email',
  name: 'SendGrid Send Email',
  description: 'Send an email through the SendGrid API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'SendGrid API key',
    },
    to: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Recipient email address',
    },
    from: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Verified sender email address',
    },
    subject: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email subject line',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Plain text email body',
    },
  },

  request: {
    url: () => 'https://api.sendgrid.com/v3/mail/send',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      personalizations: [{ to: [{ email: params.to }] }],
      from: { email: params.from },
      subject: params.subject,
      content: [{ type: 'text/plain', value: params.content }],
    }),
  },

  transformResponse: async (response) => {
    return {
      success: true,
      output: { data: { status: 'sent' }, metadata: { statusCode: response.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Send status' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        statusCode: { type: 'number', description: 'HTTP status code' },
      },
    },
  },
}
