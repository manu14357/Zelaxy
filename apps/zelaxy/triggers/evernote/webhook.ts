import { DocumentIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const evernoteWebhookTrigger: TriggerConfig = {
  id: 'evernote_webhook',
  name: 'Evernote Webhook',
  provider: 'evernote',
  description: 'Trigger workflow when notes or notebooks are created or updated in Evernote',
  version: '1.0.0',
  icon: DocumentIcon,

  configFields: {},

  outputs: {
    notification: {
      userId: {
        type: 'string',
        description: 'Evernote user ID',
      },
      reason: {
        type: 'string',
        description:
          'Reason for notification (create, update, delete, business_create, business_update, business_delete)',
      },
      noteGuid: {
        type: 'string',
        description: 'GUID of the affected note (if applicable)',
      },
      notebookGuid: {
        type: 'string',
        description: 'GUID of the affected notebook (if applicable)',
      },
      resourceGuid: {
        type: 'string',
        description: 'GUID of the affected resource/attachment (if applicable)',
      },
      expiration: {
        type: 'string',
        description: 'Timestamp when the change token expires',
      },
    },
  },

  instructions: [
    'Go to <a href="https://www.evernote.com/api/DeveloperToken.action" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Evernote Developer Tokens</a> and generate an API key.',
    'Use the Evernote API to register a webhook by calling the <code>NoteStore.setWebhook()</code> method with the Webhook URL (from above).',
    'Alternatively, use the Evernote API Client SDK to register webhooks programmatically.',
    'Evernote will send a GET request to your URL with query parameters when events occur.',
    'Handle the incoming GET request in your workflow using the parameters provided.',
  ],

  samplePayload: {
    userId: '12345678',
    reason: 'update',
    noteGuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    notebookGuid: 'ffffffff-0000-1111-2222-333333333333',
    resourceGuid: '',
    expiration: '1705312800000',
  },

  webhook: {
    method: 'GET',
    headers: {},
  },
}
