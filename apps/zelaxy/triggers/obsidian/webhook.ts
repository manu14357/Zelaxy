import { DocumentIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const obsidianWebhookTrigger: TriggerConfig = {
  id: 'obsidian_webhook',
  name: 'Obsidian Webhook',
  provider: 'obsidian',
  description:
    'Trigger workflow from Obsidian note events via the Local REST API or Obsidian webhooks plugin',
  version: '1.0.0',
  icon: DocumentIcon,

  configFields: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      placeholder: 'Enter your Obsidian Local REST API key',
      description: 'API key from the Obsidian Local REST API plugin to authenticate requests.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    note: {
      path: {
        type: 'string',
        description: 'File path of the note relative to the vault root',
      },
      content: {
        type: 'string',
        description: 'Full content of the note (Markdown)',
      },
      frontmatter: {
        type: 'json',
        description: 'YAML frontmatter properties of the note as a JSON object',
      },
      tags: {
        type: 'json',
        description: 'Array of tags applied to the note',
      },
      stat: {
        ctime: {
          type: 'number',
          description: 'Creation time (Unix timestamp in milliseconds)',
        },
        mtime: {
          type: 'number',
          description: 'Last modification time (Unix timestamp in milliseconds)',
        },
        size: {
          type: 'number',
          description: 'File size in bytes',
        },
      },
      event: {
        type: 'string',
        description: 'Event type (created, modified, deleted, renamed)',
      },
    },
  },

  instructions: [
    "Install the <strong>Obsidian Webhooks</strong> community plugin from Obsidian's community plugin store.",
    'Enable the plugin and open its settings.',
    'Add the Webhook URL (from above) as a webhook endpoint.',
    'Configure which file events trigger the webhook (create, modify, delete, rename).',
    'Optionally configure glob patterns to filter which files trigger events.',
    'Save the plugin settings. Events will now be sent to your webhook URL.',
  ],

  samplePayload: {
    event: 'modified',
    path: 'Daily Notes/2024-01-15.md',
    vault: 'MyVault',
    content: '# Daily Note\n\n- Task 1\n- Task 2\n',
    frontmatter: {
      date: '2024-01-15',
      tags: ['daily', 'work'],
    },
    tags: ['daily', 'work'],
    stat: {
      ctime: 1705312200000,
      mtime: 1705312800000,
      size: 1024,
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
