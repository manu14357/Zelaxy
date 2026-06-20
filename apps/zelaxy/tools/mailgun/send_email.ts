import type { MailgunObjectResponse, SendEmailParams } from '@/tools/mailgun/types'
import type { ToolConfig } from '@/tools/types'

export const sendEmailTool: ToolConfig<SendEmailParams, MailgunObjectResponse> = {
  id: 'mailgun_send_email',
  name: 'Mailgun Send Email',
  description: 'Send an email through the Mailgun API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Mailgun API key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Mailgun sending domain (e.g. mg.example.com)',
    },
    from: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Sender email address',
    },
    to: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Recipient email address',
    },
    subject: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email subject line',
    },
    text: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Plain text email body',
    },
  },

  request: {
    url: (params) => `https://api.mailgun.net/v3/${params.domain}/messages`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`api:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: (params) => {
      const form = new URLSearchParams()
      form.append('from', params.from)
      form.append('to', params.to)
      form.append('subject', params.subject)
      form.append('text', params.text)
      return { body: form.toString() }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { statusCode: response.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Mailgun send response' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        statusCode: { type: 'number', description: 'HTTP status code' },
      },
    },
  },
}
