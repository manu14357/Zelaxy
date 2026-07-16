import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Mic } from 'lucide-react'
import type { TriggerConfig } from '../types'

// The Grain block builds its icon inline the same way; mirror it rather than invent one
const GrainIcon = (props: SVGProps<SVGSVGElement>) => createElement(Mic, props)

export const grainWebhookTrigger: TriggerConfig = {
  id: 'grain_webhook',
  name: 'Grain Webhook',
  provider: 'grain',
  description:
    'Trigger workflow from Grain events like recordings completing and highlights being created',
  version: '1.0.0',
  icon: GrainIcon,

  configFields: {},

  // Flattened by formatWebhookInput's grain case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (recording.completed, highlight.created)',
    },
    recording_id: { type: 'string', description: 'Recording ID' },
    recording_title: { type: 'string', description: 'Recording title' },
    recording_url: { type: 'string', description: 'Link to the recording in Grain' },
    highlight_id: { type: 'string', description: 'Highlight ID (highlight events)' },
    highlight_text: { type: 'string', description: 'Highlight text' },
    start_datetime: { type: 'string', description: 'When the recording started' },
    end_datetime: { type: 'string', description: 'When the recording ended' },
    participants: { type: 'array', description: 'Recording participants' },
    data: { type: 'object', description: 'Full data object as sent by Grain' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Grain > Settings > Integrations and create a webhook.',
    'Paste the <strong>Webhook URL</strong> (from above) as the target.',
    'Select the events you want (e.g. recording completed).',
    'Grain does not sign webhooks - treat the URL as the secret and do not share it.',
  ],

  samplePayload: {
    type: 'recording.completed',
    data: {
      id: 'rec_1',
      title: 'Acme intro call',
      url: 'https://grain.com/share/recording/rec_1',
      start_datetime: '2024-01-15T13:00:00Z',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
