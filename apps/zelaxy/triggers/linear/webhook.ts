import { LinearIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const linearWebhookTrigger: TriggerConfig = {
  id: 'linear_webhook',
  name: 'Linear Webhook',
  provider: 'linear',
  description: 'Trigger workflow from Linear issue, comment, and project events',
  version: '1.0.0',
  icon: LinearIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret',
      placeholder: 'Enter the webhook signing secret',
      description:
        'The signing secret from your Linear webhook settings to validate incoming requests.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      action: {
        type: 'string',
        description: 'Action type (create, update, remove)',
      },
      resource_type: {
        type: 'string',
        description: 'Resource type (Issue, Comment, Project, Cycle, Label, etc.)',
      },
      createdAt: {
        type: 'string',
        description: 'Event creation timestamp (ISO 8601)',
      },
      organizationId: {
        type: 'string',
        description: 'Linear organization ID',
      },
      data: {
        id: {
          type: 'string',
          description: 'ID of the affected resource',
        },
        title: {
          type: 'string',
          description: 'Title of the issue or project',
        },
        issue_description: {
          type: 'string',
          description: 'Description of the issue or project',
        },
        state: {
          name: {
            type: 'string',
            description: 'Current state name (e.g., In Progress, Done)',
          },
          state_type: {
            type: 'string',
            description: 'State type (backlog, unstarted, started, completed, cancelled)',
          },
        },
        priority: {
          type: 'number',
          description:
            'Issue priority (0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low)',
        },
        assignee: {
          id: {
            type: 'string',
            description: 'Assignee user ID',
          },
          name: {
            type: 'string',
            description: 'Assignee display name',
          },
          email: {
            type: 'string',
            description: 'Assignee email',
          },
        },
        team: {
          id: {
            type: 'string',
            description: 'Team ID',
          },
          key: {
            type: 'string',
            description: 'Team key',
          },
          name: {
            type: 'string',
            description: 'Team name',
          },
        },
        url: {
          type: 'string',
          description: 'Direct URL to the issue',
        },
        identifier: {
          type: 'string',
          description: 'Issue identifier (e.g., ENG-123)',
        },
        number: {
          type: 'number',
          description: 'Issue number within the team',
        },
        labelIds: {
          type: 'json',
          description: 'Array of label IDs assigned to the issue',
        },
      },
      updatedFrom: {
        type: 'json',
        description: 'Previous values for updated fields',
      },
    },
  },

  instructions: [
    'Go to your <a href="https://linear.app/settings/api" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Linear API Settings</a>.',
    'Scroll to the <strong>Webhooks</strong> section and click <strong>New webhook</strong>.',
    'Enter the Webhook URL (from above) as the URL.',
    'Choose the resource types and actions you want to receive events for.',
    'Copy the generated <strong>Signing secret</strong> and paste it above.',
    'Click <strong>Create webhook</strong>.',
  ],

  samplePayload: {
    action: 'update',
    actor: {
      id: 'user123',
      name: 'Jane Doe',
      email: 'jane@example.com',
    },
    createdAt: '2024-01-15T10:30:00.000Z',
    data: {
      id: 'issue456',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
      number: 42,
      title: 'Fix authentication bug',
      description: 'Users are unable to log in with SSO',
      priority: 1,
      state: {
        id: 'state789',
        name: 'In Progress',
        type: 'started',
      },
      team: {
        id: 'team001',
        key: 'ENG',
        name: 'Engineering',
      },
      assignee: {
        id: 'user123',
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      identifier: 'ENG-42',
      url: 'https://linear.app/myorg/issue/ENG-42',
    },
    type: 'Issue',
    organizationId: 'org123',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Linear-Delivery': 'unique-delivery-id',
      'Linear-Event': 'Issue',
      'Linear-Signature': 'sha256=...',
    },
  },
}
