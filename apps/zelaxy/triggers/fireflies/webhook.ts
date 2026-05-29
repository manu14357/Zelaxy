import { WebhookIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const firefliesWebhookTrigger: TriggerConfig = {
  id: 'fireflies_webhook',
  name: 'Fireflies.ai Webhook',
  provider: 'fireflies',
  description:
    'Trigger workflow when Fireflies.ai meeting transcripts and summaries are ready',
  version: '1.0.0',
  icon: WebhookIcon,

  configFields: {
    apiKey: {
      type: 'string',
      label: 'Fireflies API Key',
      placeholder: 'Enter your Fireflies.ai API key',
      description: 'Your Fireflies.ai API key for verifying webhook requests.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    transcript: {
      id: {
        type: 'string',
        description: 'Transcript ID',
      },
      title: {
        type: 'string',
        description: 'Meeting title',
      },
      date: {
        type: 'string',
        description: 'Meeting date (ISO 8601)',
      },
      duration: {
        type: 'number',
        description: 'Meeting duration in seconds',
      },
      meeting_link: {
        type: 'string',
        description: 'Link to the meeting recording/transcript',
      },
      organizer_email: {
        type: 'string',
        description: 'Email of the meeting organizer',
      },
      participants: {
        type: 'json',
        description: 'Array of participant emails',
      },
      summary: {
        overview: {
          type: 'string',
          description: 'AI-generated meeting overview/summary',
        },
        action_items: {
          type: 'json',
          description: 'Array of action items identified from the meeting',
        },
        keywords: {
          type: 'json',
          description: 'Array of key topics/keywords from the meeting',
        },
      },
      transcript_url: {
        type: 'string',
        description: 'URL to the full transcript',
      },
    },
  },

  instructions: [
    'Go to <a href="https://app.fireflies.ai/settings" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Fireflies.ai Settings</a> and navigate to <strong>Integrations → Webhooks</strong>.',
    'Click <strong>Add Webhook</strong>.',
    'Enter the Webhook URL (from above) as the endpoint URL.',
    'Select the events to trigger on (e.g., "Transcript Ready", "Summary Ready").',
    'Save the webhook configuration.',
    'Optionally copy your API key from the <strong>API</strong> section and paste it above for request validation.',
  ],

  samplePayload: {
    meetingId: 'tr_abc123def456',
    eventType: 'Transcription completed',
    clientReferenceId: 'my-meeting-ref',
    transcript: {
      id: 'tr_abc123def456',
      title: 'Product Planning Meeting',
      date: '2024-01-15T10:00:00.000Z',
      duration: 3600,
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      organizer_email: 'organizer@example.com',
      participants: ['participant1@example.com', 'participant2@example.com'],
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
