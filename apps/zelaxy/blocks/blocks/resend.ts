import { ResendIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ResendResponse } from '@/tools/resend/types'

export const ResendBlock: BlockConfig<ResendResponse> = {
  type: 'resend',
  name: 'Resend',
  description: 'Send emails using the Resend API',
  longDescription:
    'Send transactional and marketing emails using the Resend API. Supports HTML and plain text content, CC/BCC, reply-to, scheduled delivery, tags for tracking, attachments, batch sending, and email retrieval/cancellation.',
  category: 'tools',
  bgColor: '#000000',
  icon: ResendIcon,
  subBlocks: [
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 're_xxxxxxxxx...',
      password: true,
      required: true,
      description: 'Your Resend API key (starts with re_)',
    },
    {
      id: 'action',
      title: 'Action',
      type: 'dropdown',
      layout: 'full',
      required: true,
      options: [
        { label: '📧 Send Email', id: 'send' },
        { label: '📦 Batch Send', id: 'batch' },
        { label: '🔍 Get Email', id: 'get' },
        { label: '❌ Cancel Scheduled Email', id: 'cancel' },
      ],
      value: () => 'send',
    },
    // ── Send Email Fields ──
    {
      id: 'from',
      title: 'From',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Name <you@yourdomain.com>',
      required: true,
      condition: { field: 'action', value: 'send' },
      description: 'Sender email address. Must use a verified domain.',
    },
    {
      id: 'to',
      title: 'To',
      type: 'short-input',
      layout: 'full',
      placeholder: 'recipient@example.com (comma-separated for multiple)',
      required: true,
      condition: { field: 'action', value: 'send' },
      description: 'Recipient email addresses (max 50, comma-separated)',
    },
    {
      id: 'subject',
      title: 'Subject',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Email subject line',
      required: true,
      condition: { field: 'action', value: 'send' },
    },
    {
      id: 'html',
      title: 'HTML Body',
      type: 'long-input',
      layout: 'full',
      placeholder: '<h1>Hello</h1><p>Your email content here...</p>',
      condition: { field: 'action', value: 'send' },
      description: 'HTML email body content',
    },
    {
      id: 'text',
      title: 'Plain Text Body',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Plain text version of your email...',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
      description: 'Plain text fallback (auto-generated from HTML if omitted)',
    },
    {
      id: 'cc',
      title: 'CC',
      type: 'short-input',
      layout: 'half',
      placeholder: 'cc@example.com',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
    },
    {
      id: 'bcc',
      title: 'BCC',
      type: 'short-input',
      layout: 'half',
      placeholder: 'bcc@example.com',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
    },
    {
      id: 'replyTo',
      title: 'Reply-To',
      type: 'short-input',
      layout: 'full',
      placeholder: 'reply@example.com',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
      description: 'Reply-to address(es)',
    },
    {
      id: 'scheduledAt',
      title: 'Schedule At',
      type: 'short-input',
      layout: 'full',
      placeholder: '2026-12-25T09:00:00Z or "in 1 hour"',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
      description: 'Schedule delivery (ISO 8601 or natural language, up to 30 days)',
    },
    {
      id: 'tags',
      title: 'Tags',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '[{"name": "category", "value": "welcome"}]',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
      description: 'Tags for tracking (JSON array of {name, value})',
    },
    {
      id: 'headers',
      title: 'Custom Headers',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{"X-Custom-Header": "value"}',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
      description: 'Custom email headers (JSON object)',
    },
    {
      id: 'attachments',
      title: 'Attachments',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '[{"filename": "report.pdf", "content": "base64..."}]',
      condition: { field: 'action', value: 'send' },
      mode: 'advanced',
      description: 'File attachments (JSON array, max 40MB total)',
    },
    // ── Batch Send Fields ──
    {
      id: 'emails',
      title: 'Emails (Batch)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder:
        '[{"from": "you@domain.com", "to": "a@example.com", "subject": "Hello", "html": "<p>Hi</p>"}]',
      required: true,
      condition: { field: 'action', value: 'batch' },
      description: 'JSON array of email objects for batch sending',
      wandConfig: {
        enabled: true,
        prompt: `Generate a JSON array of email objects for Resend batch send.

Each email object should have:
- from: sender email (verified domain)
- to: recipient(s)
- subject: email subject
- html: HTML body (or text for plain text)

Optional per-email: cc, bcc, replyTo, tags, headers

You can reference other block outputs like {{agent2.content}} or workflow variables like {{variable.userId}}.

Current data: {context}

Generate only valid JSON without explanations.`,
        generationType: 'json-object',
        placeholder: 'Describe the batch emails you want to send...',
      },
    },
    // ── Get / Cancel Email Fields ──
    {
      id: 'emailId',
      title: 'Email ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '49a3999c-0ce8-4b2a-...',
      required: true,
      condition: { field: 'action', value: ['get', 'cancel'] },
      description: 'The email ID returned from a previous send',
    },
  ],
  tools: {
    access: ['resend_send', 'resend_batch', 'resend_get', 'resend_cancel'],
    config: {
      tool: (params) => {
        switch (params.action) {
          case 'batch':
            return 'resend_batch'
          case 'get':
            return 'resend_get'
          case 'cancel':
            return 'resend_cancel'
          default:
            return 'resend_send'
        }
      },
    },
  },
  inputs: {
    apiKey: { type: 'string', description: 'Resend API key' },
    action: { type: 'string', description: 'Operation to perform' },
    from: { type: 'string', description: 'Sender email address' },
    to: { type: 'string', description: 'Recipient email addresses' },
    subject: { type: 'string', description: 'Email subject' },
    html: { type: 'string', description: 'HTML body content' },
    text: { type: 'string', description: 'Plain text body content' },
    cc: { type: 'string', description: 'CC recipients' },
    bcc: { type: 'string', description: 'BCC recipients' },
    replyTo: { type: 'string', description: 'Reply-to address' },
    scheduledAt: { type: 'string', description: 'Scheduled delivery time' },
    headers: { type: 'string', description: 'Custom email headers (JSON)' },
    tags: { type: 'string', description: 'Email tags (JSON)' },
    attachments: { type: 'string', description: 'File attachments (JSON)' },
    emails: { type: 'string', description: 'Batch email objects (JSON)' },
    emailId: { type: 'string', description: 'Email ID for get/cancel' },
  },
  outputs: {
    id: {
      type: 'string',
      description: 'Email ID returned by Resend',
    },
    ids: {
      type: 'json',
      description: 'Array of email IDs (batch send)',
    },
    email: {
      type: 'json',
      description: 'Full email details (get action)',
    },
    status: {
      type: 'string',
      description: 'Operation status',
    },
    error: {
      type: 'string',
      description: 'Error message if operation failed',
    },
  },
}
