import { WebhookIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const intercomWebhookTrigger: TriggerConfig = {
  id: 'intercom_webhook',
  name: 'Intercom Webhook',
  provider: 'intercom',
  description: 'Trigger workflow from Intercom conversation and contact events',
  version: '1.0.0',
  icon: WebhookIcon,

  configFields: {
    clientSecret: {
      type: 'string',
      label: 'Client Secret',
      placeholder: 'Enter your Intercom app client secret',
      description:
        'The client secret from your Intercom app for HMAC signature verification.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      event_type: {
        type: 'string',
        description:
          'Event type (e.g., conversation.created, conversation.user.replied, contact.created)',
      },
      id: {
        type: 'string',
        description: 'Unique event ID',
      },
      created_at: {
        type: 'string',
        description: 'Event creation timestamp (Unix)',
      },
      topic: {
        type: 'string',
        description: 'Webhook topic/event name',
      },
      data: {
        item: {
          id: {
            type: 'string',
            description: 'ID of the affected object',
          },
          object_type: {
            type: 'string',
            description: 'Type of the affected object (conversation, contact, etc.)',
          },
          state: {
            type: 'string',
            description: 'State of the conversation (open, closed, snoozed)',
          },
        },
      },
      conversation: {
        id: {
          type: 'string',
          description: 'Conversation ID',
        },
        state: {
          type: 'string',
          description: 'Conversation state',
        },
      },
      contact: {
        id: {
          type: 'string',
          description: 'Contact ID',
        },
        email: {
          type: 'string',
          description: 'Contact email',
        },
        name: {
          type: 'string',
          description: 'Contact name',
        },
      },
    },
  },

  instructions: [
    'Go to your <a href="https://app.intercom.com/a/apps/_/developer-hub" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Intercom Developer Hub</a>.',
    'Create or select an app, then go to <strong>Configure → Webhooks</strong>.',
    'Add the Webhook URL (from above) as your endpoint URL.',
    'Select the topics (events) you want to receive.',
    'Copy the <strong>Client Secret</strong> from your app settings and paste it above.',
    'Save the webhook settings.',
  ],

  samplePayload: {
    type: 'notification_event',
    app_id: 'abc123',
    data: {
      type: 'notification_event_data',
      item: {
        type: 'conversation',
        id: '1',
        created_at: 1705312200,
        updated_at: 1705312200,
        source: {
          type: 'conversation',
          id: '3',
          delivered_as: 'user_initiated',
          subject: '',
          body: '<p>Hi there!</p>',
          author: {
            type: 'user',
            id: 'abc123',
            name: 'Joe Bloggs',
            email: 'joe@example.com',
          },
        },
        state: 'open',
      },
    },
    links: {},
    id: 'notif_00000000-0000-0000-0000-000000000000',
    topic: 'conversation.user.created',
    delivery_status: 'pending',
    delivery_attempts: 1,
    delivered_at: 0,
    first_sent_at: 1705312200,
    created_at: 1705312200,
    self: null,
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature': 'sha1=...',
    },
  },
}
