import { DollarIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const attioWebhookTrigger: TriggerConfig = {
  id: 'attio_webhook',
  name: 'Attio Webhook',
  provider: 'attio',
  description: 'Trigger workflow from Attio events like records, notes, tasks, and lists changing',
  version: '1.0.0',
  icon: DollarIcon,

  configFields: {},

  // Flattened by formatWebhookInput's attio case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (record.created, record.updated, note.created, task.created)',
    },
    webhook_id: { type: 'string', description: 'ID of the Attio webhook subscription' },
    record_id: { type: 'string', description: 'ID of the affected record' },
    object_id: { type: 'string', description: 'ID of the Attio object the record belongs to' },
    actor_type: {
      type: 'string',
      description: 'Who performed the change (workspace-member, api-token, system)',
    },
    actor_id: { type: 'string', description: 'ID of the actor' },
    events: { type: 'array', description: 'All events in the delivery - Attio batches them' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Attio > Workspace settings > Developers > Webhooks.',
    'Click "Create webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Target URL" field.',
    'Subscribe to the events you want (e.g. record.created, record.updated).',
    'Attio batches events, so the delivery may contain several - use the events array to read them all.',
  ],

  samplePayload: {
    webhook_id: '0e7a1f2b',
    events: [
      {
        event_type: 'record.created',
        id: {
          object_id: 'obj_people',
          record_id: 'rec_123',
        },
        actor: {
          type: 'workspace-member',
          id: 'mem_1',
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
