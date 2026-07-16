import { TypeformIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const typeformWebhookTrigger: TriggerConfig = {
  id: 'typeform_webhook',
  name: 'Typeform Webhook',
  provider: 'typeform',
  description: 'Trigger workflow when a Typeform form receives a new submission',
  version: '1.0.0',
  icon: TypeformIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret (Recommended)',
      placeholder: 'Generate or enter a strong secret',
      description:
        'The secret you set on the Typeform webhook. Deliveries whose Typeform-Signature does not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Outputs are flattened by formatWebhookInput's typeform case, so they mirror that shape
  // rather than Typeform's nested `form_response` envelope.
  outputs: {
    event_id: {
      type: 'string',
      description: 'Unique identifier for this webhook event',
    },
    event_type: {
      type: 'string',
      description: 'Type of event (always form_response for submissions)',
    },
    form_id: {
      type: 'string',
      description: 'ID of the form that was submitted',
    },
    form_title: {
      type: 'string',
      description: 'Title of the form that was submitted',
    },
    token: {
      type: 'string',
      description: 'Unique token identifying this response',
    },
    submitted_at: {
      type: 'string',
      description: 'ISO timestamp of when the form was submitted',
    },
    landed_at: {
      type: 'string',
      description: 'ISO timestamp of when the respondent landed on the form',
    },
    answers: {
      type: 'array',
      description: 'Raw answers array as sent by Typeform (one entry per answered question)',
    },
    fields: {
      type: 'object',
      description:
        'Answers keyed by question title, with values already unwrapped to plain text, numbers, booleans, or choice labels',
    },
    hidden: {
      type: 'object',
      description: 'Hidden field values passed into the form (e.g., UTM parameters)',
    },
    definition: {
      type: 'object',
      description: 'Form definition including the questions that were asked',
    },
    variables: {
      type: 'array',
      description: 'Typeform variables (score, price, custom)',
    },
    calculated: {
      type: 'object',
      description: 'Calculated values from the form (e.g., score)',
    },
    ending: {
      type: 'object',
      description: 'Ending screen the respondent reached',
    },
    answer_count: {
      type: 'number',
      description: 'Number of questions the respondent answered',
    },
    raw: {
      type: 'object',
      description: 'Complete original webhook payload from Typeform',
    },
  },

  instructions: [
    'Open your form in Typeform and go to Connect > Webhooks.',
    'Click "Add a webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Endpoint" field.',
    'Enter the <strong>Webhook Secret</strong> (from above) into the "Secret" field if you\'ve configured one.',
    'Toggle the webhook on, then use "Test request" or "View deliveries" to confirm it reaches Zelaxy.',
    '<strong>Note:</strong> Typeform webhooks require a PRO or PRO+ account.',
  ],

  samplePayload: {
    event_id: '01HZ8X2Q9Y3M4N5P6R7S8T9V0W',
    event_type: 'form_response',
    form_response: {
      form_id: 'lT4Z3j',
      token: 'a3a12ec67a1365927098a606107fac15',
      landed_at: '2024-01-15T13:10:00Z',
      submitted_at: '2024-01-15T13:14:15Z',
      definition: {
        id: 'lT4Z3j',
        title: 'Customer Feedback',
        fields: [
          {
            id: 'DlXFaesGBpoF',
            ref: 'readable_ref_email',
            type: 'email',
            title: 'What is your email?',
          },
        ],
      },
      answers: [
        {
          type: 'email',
          email: 'ada@example.com',
          field: {
            id: 'DlXFaesGBpoF',
            ref: 'readable_ref_email',
            type: 'email',
          },
        },
      ],
      hidden: {},
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Typeform-Signature': 'sha256=<base64-hmac>',
    },
  },
}
