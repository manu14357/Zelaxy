import { DocumentIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const dropboxWebhookTrigger: TriggerConfig = {
  id: 'dropbox_webhook',
  name: 'Dropbox Webhook',
  provider: 'dropbox',
  description: 'Trigger workflow when files or folders change in Dropbox',
  version: '1.0.0',
  icon: DocumentIcon,

  configFields: {},

  outputs: {
    notification: {
      list_folder: {
        accounts: {
          type: 'json',
          description: 'Array of account IDs whose files changed',
        },
      },
      delta: {
        users: {
          type: 'json',
          description: 'Array of user IDs with delta changes',
        },
      },
    },
  },

  instructions: [
    'Go to <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Dropbox App Console</a> and create or select your app.',
    'Under your app settings, find the <strong>Webhooks</strong> section.',
    'Enter the Webhook URL (from above) as the webhook endpoint.',
    'Dropbox will send a verification GET request to the URL — this is handled automatically.',
    'Once verified, Dropbox will POST change notifications to your webhook URL whenever files are modified.',
    'To list the actual changed files, use the Dropbox <code>/files/list_folder/continue</code> API with the received cursor.',
  ],

  samplePayload: {
    list_folder: {
      accounts: ['dbid:AAHgR3BYyfyBb123abc456def789ghi0jkl'],
    },
    delta: {
      users: [12345678],
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
