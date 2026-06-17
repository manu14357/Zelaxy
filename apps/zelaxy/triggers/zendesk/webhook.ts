import { WebhookIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const zendeskWebhookTrigger: TriggerConfig = {
  id: 'zendesk_webhook',
  name: 'Zendesk Webhook',
  provider: 'zendesk',
  description: 'Trigger workflow from Zendesk ticket, user, and organization events',
  version: '1.0.0',
  icon: WebhookIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Signing Secret',
      placeholder: 'Enter the Zendesk webhook signing secret',
      description:
        'The signing secret from your Zendesk webhook settings to validate incoming requests.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      event_type: {
        type: 'string',
        description: 'Event type (e.g., ticket.created, ticket.updated, user.created)',
      },
      account_id: {
        type: 'number',
        description: 'Zendesk account ID',
      },
      ticket: {
        id: {
          type: 'number',
          description: 'Ticket ID',
        },
        subject: {
          type: 'string',
          description: 'Ticket subject',
        },
        ticket_description: {
          type: 'string',
          description: 'Ticket description/first comment',
        },
        status: {
          type: 'string',
          description: 'Ticket status (new, open, pending, hold, solved, closed)',
        },
        priority: {
          type: 'string',
          description: 'Ticket priority (low, normal, high, urgent)',
        },
        ticket_type: {
          type: 'string',
          description: 'Ticket type (question, incident, problem, task)',
        },
        assignee_id: {
          type: 'number',
          description: 'Assignee agent ID',
        },
        requester_id: {
          type: 'number',
          description: 'Requester user ID',
        },
        organization_id: {
          type: 'number',
          description: 'Organization ID',
        },
        tags: {
          type: 'json',
          description: 'Array of ticket tags',
        },
        created_at: {
          type: 'string',
          description: 'Ticket creation timestamp (ISO 8601)',
        },
        updated_at: {
          type: 'string',
          description: 'Ticket last update timestamp (ISO 8601)',
        },
        url: {
          type: 'string',
          description: 'API URL of the ticket',
        },
      },
    },
  },

  instructions: [
    'Go to your Zendesk Admin Center and navigate to <strong>Apps and Integrations → Webhooks</strong>.',
    'Click <strong>Create Webhook</strong>.',
    'Enter a name and paste the Webhook URL (from above) as the Endpoint URL.',
    'Set the request format to <strong>JSON</strong> and method to <strong>POST</strong>.',
    'Copy the <strong>Signing Secret</strong> and paste it above.',
    'Go to <strong>Business Rules → Triggers</strong> (or Automations) to connect the webhook to specific events.',
    'Create or edit a trigger, add the <strong>Notify by webhook</strong> action, and select your webhook.',
  ],

  samplePayload: {
    type: 'ticket.created',
    account_id: 12345678,
    ticket: {
      id: 42,
      subject: 'My printer is on fire!',
      description: 'My printer is on fire and I need help immediately.',
      status: 'new',
      priority: 'urgent',
      type: 'incident',
      assignee_id: null,
      requester_id: 987654321,
      organization_id: 111222333,
      tags: ['fire', 'hardware', 'urgent'],
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      url: 'https://yoursubdomain.zendesk.com/api/v2/tickets/42.json',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Zendesk-Webhook-Signature': '...',
    },
  },
}
