import { GoogleFormsIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const googleFormsWebhookTrigger: TriggerConfig = {
  id: 'google_forms_webhook',
  name: 'Google Forms Webhook',
  provider: 'google_forms',
  description: 'Trigger workflow when a Google Form receives a new response',
  version: '1.0.0',
  icon: GoogleFormsIcon,

  configFields: {
    token: {
      type: 'string',
      label: 'Shared Secret (Recommended)',
      placeholder: 'Generate or enter a strong secret',
      description:
        'The Apps Script sends this as a Bearer token. Deliveries that do not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's google_forms case
  outputs: {
    form_id: { type: 'string', description: 'Google Form ID' },
    response_id: { type: 'string', description: 'Unique response identifier' },
    create_time: { type: 'string', description: 'When the response was created' },
    last_submitted_time: { type: 'string', description: 'When the response was last submitted' },
    answers: {
      type: 'object',
      description: 'Answers keyed by question title, e.g. answers["What is your email?"]',
    },
    answer_count: { type: 'number', description: 'Number of questions answered' },
    raw: { type: 'object', description: 'Complete original payload' },
  },

  instructions: [
    'Google Forms has no native webhooks — you connect it with a short Apps Script that runs on submit.',
    'Open your form, click the three-dot menu > <strong>Apps Script</strong>.',
    'Paste the script from the <a href="/docs/triggers/webhook#google-forms" target="_blank" rel="noopener noreferrer">Google Forms trigger docs</a>, replacing the URL and secret with the <strong>Webhook URL</strong> and <strong>Shared Secret</strong> above.',
    'In the Apps Script editor, open <strong>Triggers</strong> (the clock icon) and add a trigger: choose <code>onFormSubmit</code>, event source <strong>From form</strong>, event type <strong>On form submit</strong>.',
    'Authorise the script when prompted, then submit a test response to confirm it reaches Zelaxy.',
  ],

  samplePayload: {
    provider: 'google_forms',
    formId: '1FAIpQLSc-EXAMPLE',
    responseId: '2_ABaOnucEXAMPLE',
    createTime: '2024-01-15T13:14:15.000Z',
    lastSubmittedTime: '2024-01-15T13:14:15.000Z',
    answers: {
      'What is your email?': 'ada@example.com',
      'How did you hear about us?': 'A friend',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <your-shared-secret>',
    },
  },
}
