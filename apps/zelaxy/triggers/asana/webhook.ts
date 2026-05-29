import { WorkIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const asanaWebhookTrigger: TriggerConfig = {
  id: 'asana_webhook',
  name: 'Asana Webhook',
  provider: 'asana',
  description: 'Trigger workflow from Asana task and project events',
  version: '1.0.0',
  icon: WorkIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret',
      placeholder: 'Enter the webhook secret from Asana',
      description:
        'The secret Asana sends in the X-Hook-Secret header to validate webhook authenticity.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      action: {
        type: 'string',
        description: 'Type of action (added, changed, removed, deleted)',
      },
      resource: {
        gid: {
          type: 'string',
          description: 'Global ID of the affected resource',
        },
        resource_type: {
          type: 'string',
          description: 'Type of resource (task, project, story, etc.)',
        },
        name: {
          type: 'string',
          description: 'Name of the affected resource',
        },
      },
      parent: {
        gid: {
          type: 'string',
          description: 'GID of the parent resource',
        },
        resource_type: {
          type: 'string',
          description: 'Type of the parent resource',
        },
      },
      created_at: {
        type: 'string',
        description: 'Timestamp of the event (ISO 8601)',
      },
      user: {
        gid: {
          type: 'string',
          description: 'GID of the user who triggered the event',
        },
        resource_type: {
          type: 'string',
          description: 'Resource type (user)',
        },
      },
    },
  },

  instructions: [
    'Go to <a href="https://app.asana.com/0/my-apps" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Asana Developer Console</a> and create a new app.',
    'Under your app settings, navigate to the "Webhooks" section.',
    'Add the Webhook URL (from above) as a webhook endpoint.',
    'Asana will send a handshake request with an X-Hook-Secret header. Copy this value and paste it above.',
    'Select the resource and event types you want to monitor.',
    'Save your webhook configuration.',
  ],

  samplePayload: {
    events: [
      {
        action: 'changed',
        resource: {
          gid: '12345678901234',
          resource_type: 'task',
          name: 'Example Task',
        },
        parent: {
          gid: '98765432109876',
          resource_type: 'project',
        },
        created_at: '2024-01-15T10:30:00.000Z',
        user: {
          gid: '11223344556677',
          resource_type: 'user',
        },
      },
    ],
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
