import { NotionIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const notionWebhookTrigger: TriggerConfig = {
  id: 'notion_webhook',
  name: 'Notion Webhook',
  provider: 'notion',
  description: 'Trigger workflow from Notion page, database, and comment events',
  version: '1.0.0',
  icon: NotionIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Verification Token',
      placeholder: 'Enter the Notion webhook verification token',
      description:
        'The verification token from your Notion integration to validate webhook requests.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      id: {
        type: 'string',
        description: 'Unique event ID',
      },
      event_type: {
        type: 'string',
        description:
          'Event type (e.g., page.created, page.updated, database.created, comment.created)',
      },
      created_time: {
        type: 'string',
        description: 'Event creation timestamp (ISO 8601)',
      },
      workspace_id: {
        type: 'string',
        description: 'Notion workspace ID',
      },
      workspace_name: {
        type: 'string',
        description: 'Notion workspace name',
      },
      entity: {
        id: {
          type: 'string',
          description: 'ID of the affected entity (page, database, comment)',
        },
        entity_type: {
          type: 'string',
          description: 'Entity type (page, database, comment)',
        },
      },
      authors: {
        type: 'json',
        description: 'Array of user objects who triggered the event',
      },
      updated_blocks: {
        type: 'json',
        description: 'Array of block IDs that were updated',
      },
      parent: {
        parent_type: {
          type: 'string',
          description: 'Parent type (workspace, page_id, database_id)',
        },
        id: {
          type: 'string',
          description: 'Parent ID',
        },
      },
    },
  },

  instructions: [
    'Go to <a href="https://www.notion.so/profile/integrations" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Notion Integrations</a> and create or select an integration.',
    'Navigate to the <strong>Webhooks</strong> section within your integration settings.',
    'Click <strong>Add Webhook</strong> and enter the Webhook URL (from above).',
    'Select the events you want to subscribe to (page created/updated, database changes, comments, etc.).',
    'Copy the <strong>Verification Token</strong> and paste it above.',
    'Share your Notion pages or databases with the integration so it has access.',
  ],

  samplePayload: {
    id: 'event-uuid-1234',
    created_time: '2024-01-15T10:30:00.000Z',
    type: 'page.updated',
    workspace_id: 'workspace-uuid-5678',
    workspace_name: 'My Workspace',
    entity: {
      id: 'page-uuid-9012',
      type: 'page',
    },
    authors: [
      {
        id: 'user-uuid-3456',
        object: 'user',
        name: 'Jane Smith',
        type: 'person',
      },
    ],
    parent: {
      type: 'database_id',
      id: 'database-uuid-7890',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Notion-Signature': 'v0=...',
    },
  },
}
