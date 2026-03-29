import type { ToolConfig } from '@/tools/types'
import type { SMTPResponse, SMTPSendParams } from './types'

export const smtpSendTool: ToolConfig<SMTPSendParams, SMTPResponse> = {
  id: 'smtp_send',
  name: 'SMTP Send Email',
  description: 'Send an email via any SMTP server (Gmail, Outlook, Yahoo, custom SMTP, etc.)',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      description: 'SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)',
    },
    port: {
      type: 'number',
      required: false,
      default: 587,
      description: 'SMTP server port (default: 587 for STARTTLS, 465 for SSL)',
    },
    username: {
      type: 'string',
      required: true,
      description: 'SMTP authentication username (usually your email address)',
    },
    password: {
      type: 'string',
      required: true,
      description: 'SMTP authentication password or app password',
    },
    secure: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Use SSL/TLS (true for port 465, false for STARTTLS on port 587)',
    },
    from: {
      type: 'string',
      required: false,
      description: 'Sender email address (defaults to username if not provided)',
    },
    fromName: {
      type: 'string',
      required: false,
      description: 'Sender display name',
    },
    to: {
      type: 'string',
      required: true,
      description: 'Recipient email addresses (comma-separated)',
    },
    cc: {
      type: 'string',
      required: false,
      description: 'CC recipients (comma-separated)',
    },
    bcc: {
      type: 'string',
      required: false,
      description: 'BCC recipients (comma-separated)',
    },
    replyTo: {
      type: 'string',
      required: false,
      description: 'Reply-to email address',
    },
    subject: {
      type: 'string',
      required: true,
      description: 'Email subject line',
    },
    body: {
      type: 'string',
      required: true,
      description: 'Email body content',
    },
    isHtml: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Whether the body content is HTML',
    },
  },

  outputs: {
    messageId: {
      type: 'string',
      description: 'Message ID assigned by the SMTP server',
    },
    accepted: {
      type: 'array',
      description: 'List of accepted recipient addresses',
    },
    rejected: {
      type: 'array',
      description: 'List of rejected recipient addresses',
    },
    status: {
      type: 'string',
      description: 'SMTP server response status',
    },
    error: {
      type: 'string',
      description: 'Error message if sending failed',
      optional: true,
    },
  },

  request: {
    url: '/api/tools/smtp',
    method: 'POST',
    headers: (params: SMTPSendParams) => ({
      'Content-Type': 'application/json',
    }),
    body: (params: SMTPSendParams) => ({
      ...params,
    }),
  },

  transformResponse: async (response: Response, params?: SMTPSendParams): Promise<SMTPResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: {
            error: `HTTP ${response.status}: ${response.statusText}`,
          },
        }
      }

      const result = await response.json()
      return result as SMTPResponse
    } catch (error) {
      return {
        success: false,
        output: {
          error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }
    }
  },
}
