import { signAwsV4 } from '@/lib/aws/sigv4'
import type { SesResponse, SesSendEmailParams } from '@/tools/ses/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: SesSendEmailParams) => ({
  FromEmailAddress: p.fromEmail,
  Destination: { ToAddresses: [p.toEmail] },
  Content: {
    Simple: {
      Subject: { Data: p.subject },
      Body: { Text: { Data: p.body } },
    },
  },
})

export const sendEmailTool: ToolConfig<SesSendEmailParams, SesResponse> = {
  id: 'ses_send_email',
  name: 'SES Send Email',
  description: 'Send an email through Amazon SES v2',
  version: '1.0.0',

  params: {
    awsRegion: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS region (e.g. us-east-1)',
    },
    awsAccessKeyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS access key ID',
    },
    awsSecretAccessKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS secret access key',
    },
    fromEmail: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Verified sender email address',
    },
    toEmail: {
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
    body: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email body (plain text)',
    },
  },

  request: {
    url: (p) => `https://email.${p.awsRegion}.amazonaws.com/v2/email/outbound-emails`,
    method: 'POST',
    headers: (p) =>
      signAwsV4({
        method: 'POST',
        url: `https://email.${p.awsRegion}.amazonaws.com/v2/email/outbound-emails`,
        region: p.awsRegion,
        service: 'ses',
        accessKeyId: p.awsAccessKeyId,
        secretAccessKey: p.awsSecretAccessKey,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(p)),
      }),
    body: (p) => buildPayload(p),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: { data } }
  },

  outputs: {
    data: { type: 'json', description: 'SES SendEmail result (MessageId)' },
  },
}
