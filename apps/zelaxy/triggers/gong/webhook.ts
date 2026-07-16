import { GongIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const gongWebhookTrigger: TriggerConfig = {
  id: 'gong_webhook',
  name: 'Gong Webhook',
  provider: 'gong',
  description:
    'Trigger workflow from Gong events like calls being processed and transcripts becoming ready',
  version: '1.0.0',
  icon: GongIcon,

  configFields: {
    authToken: {
      type: 'string',
      label: 'Authorization Token (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'A token you set on the Gong automation rule. Zelaxy requires it verbatim in the Authorization header.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's gong case
  outputs: {
    event_type: { type: 'string', description: 'Event type sent by the Gong rule' },
    call_id: { type: 'string', description: 'Gong call ID' },
    call_title: { type: 'string', description: 'Call title' },
    call_url: { type: 'string', description: 'Link to the call in Gong' },
    started: { type: 'string', description: 'When the call started' },
    duration: { type: 'number', description: 'Call duration in seconds' },
    participants: { type: 'array', description: 'Call participants' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Gong > Company Settings > Automation Rules.',
    'Create a rule with an <strong>HTTP request</strong> action.',
    'Paste the <strong>Webhook URL</strong> (from above) as the target URL and choose POST.',
    'Add an <code>Authorization</code> header whose value matches the token you enter above.',
    'Save and activate the rule.',
  ],

  samplePayload: {
    eventType: 'call.processed',
    callId: '7839105754849271',
    title: 'Acme intro call',
    url: 'https://app.gong.io/call?id=7839105754849271',
    started: '2024-01-15T13:00:00Z',
    duration: 1800,
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: '<your-token>',
    },
  },
}
