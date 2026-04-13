import type { ToolConfig } from '@/tools/types'
import type { ResendResponse, ResendSendParams } from './types'

export const resendSendTool: ToolConfig<ResendSendParams, ResendResponse> = {
  id: 'resend_send',
  name: 'Resend Send Email',
  description: 'Send an email using the Resend API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      description: 'Resend API key (starts with re_)',
    },
    from: {
      type: 'string',
      required: true,
      description: 'Sender email address (e.g. "Name <email@domain.com>")',
    },
    to: {
      type: 'string',
      required: true,
      description: 'Recipient email addresses (comma-separated, max 50)',
    },
    subject: {
      type: 'string',
      required: true,
      description: 'Email subject line',
    },
    html: {
      type: 'string',
      required: false,
      description: 'HTML email body',
    },
    text: {
      type: 'string',
      required: false,
      description: 'Plain text email body',
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
      description: 'Reply-to address(es) (comma-separated)',
    },
    scheduledAt: {
      type: 'string',
      required: false,
      description: 'Schedule delivery time (ISO 8601 or natural language)',
    },
    headers: {
      type: 'string',
      required: false,
      description: 'Custom email headers (JSON object)',
    },
    tags: {
      type: 'string',
      required: false,
      description: 'Email tags for tracking (JSON array of {name, value})',
    },
    attachments: {
      type: 'string',
      required: false,
      description: 'File attachments (JSON array of {filename, content})',
    },
  },

  outputs: {
    id: {
      type: 'string',
      description: 'Email ID returned by Resend',
    },
    error: {
      type: 'string',
      description: 'Error message if sending failed',
      optional: true,
    },
    status: {
      type: 'string',
      description: 'Status of the operation',
      optional: true,
    },
  },

  request: {
    url: '/api/tools/resend',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: ResendSendParams) => ({
      action: 'send',
      ...params,
    }),
  },

  transformResponse: async (response: Response): Promise<ResendResponse> => {
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
      return result as ResendResponse
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

export const resendBatchTool: ToolConfig = {
  id: 'resend_batch',
  name: 'Resend Batch Send',
  description: 'Send multiple emails in a single batch using Resend',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      description: 'Resend API key (starts with re_)',
    },
    emails: {
      type: 'string',
      required: true,
      description: 'JSON array of email objects (each with from, to, subject, html/text)',
    },
  },

  outputs: {
    ids: {
      type: 'array',
      description: 'Array of email IDs returned by Resend',
    },
    error: {
      type: 'string',
      description: 'Error message if batch send failed',
      optional: true,
    },
  },

  request: {
    url: '/api/tools/resend',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: any) => ({
      action: 'batch',
      ...params,
    }),
  },

  transformResponse: async (response: Response): Promise<ResendResponse> => {
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
      return result as ResendResponse
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

export const resendGetTool: ToolConfig = {
  id: 'resend_get',
  name: 'Resend Get Email',
  description: 'Retrieve email details by ID from Resend',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      description: 'Resend API key (starts with re_)',
    },
    emailId: {
      type: 'string',
      required: true,
      description: 'Email ID to retrieve',
    },
  },

  outputs: {
    email: {
      type: 'json',
      description: 'Full email details',
    },
    error: {
      type: 'string',
      description: 'Error message if retrieval failed',
      optional: true,
    },
  },

  request: {
    url: '/api/tools/resend',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: any) => ({
      action: 'get',
      ...params,
    }),
  },

  transformResponse: async (response: Response): Promise<ResendResponse> => {
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
      return result as ResendResponse
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

export const resendCancelTool: ToolConfig = {
  id: 'resend_cancel',
  name: 'Resend Cancel Email',
  description: 'Cancel a scheduled email by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      description: 'Resend API key (starts with re_)',
    },
    emailId: {
      type: 'string',
      required: true,
      description: 'Scheduled email ID to cancel',
    },
  },

  outputs: {
    status: {
      type: 'string',
      description: 'Cancellation status',
    },
    error: {
      type: 'string',
      description: 'Error message if cancellation failed',
      optional: true,
    },
  },

  request: {
    url: '/api/tools/resend',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: any) => ({
      action: 'cancel',
      ...params,
    }),
  },

  transformResponse: async (response: Response): Promise<ResendResponse> => {
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
      return result as ResendResponse
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
