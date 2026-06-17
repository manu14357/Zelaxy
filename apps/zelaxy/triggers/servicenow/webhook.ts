import { WebhookIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const servicenowWebhookTrigger: TriggerConfig = {
  id: 'servicenow_webhook',
  name: 'ServiceNow Webhook',
  provider: 'servicenow',
  description: 'Trigger workflow from ServiceNow incident, change request, and ticket events',
  version: '1.0.0',
  icon: WebhookIcon,

  configFields: {
    instanceUrl: {
      type: 'string',
      label: 'ServiceNow Instance URL',
      placeholder: 'https://yourinstance.service-now.com',
      description: 'The base URL of your ServiceNow instance.',
      required: false,
    },
  },

  outputs: {
    event: {
      table: {
        type: 'string',
        description: 'ServiceNow table name (incident, change_request, sc_request, etc.)',
      },
      action: {
        type: 'string',
        description: 'Action that triggered the event (insert, update, delete)',
      },
      record: {
        sys_id: {
          type: 'string',
          description: 'Unique system identifier of the record',
        },
        number: {
          type: 'string',
          description: 'Record number (e.g., INC0001234)',
        },
        short_description: {
          type: 'string',
          description: 'Brief description of the ticket',
        },
        state: {
          type: 'string',
          description: 'Current state of the record',
        },
        priority: {
          type: 'string',
          description: 'Priority level (1 = Critical, 2 = High, 3 = Moderate, 4 = Low)',
        },
        category: {
          type: 'string',
          description: 'Category of the ticket',
        },
        assigned_to: {
          type: 'string',
          description: 'Name or sys_id of the assignee',
        },
        caller_id: {
          type: 'string',
          description: 'Name or sys_id of the person who reported the issue',
        },
        sys_created_on: {
          type: 'string',
          description: 'Record creation date/time',
        },
        sys_updated_on: {
          type: 'string',
          description: 'Record last update date/time',
        },
      },
      changed_fields: {
        type: 'json',
        description: 'Fields that changed with old and new values',
      },
    },
  },

  instructions: [
    'In ServiceNow, navigate to <strong>System Web Services → Outbound → REST Message</strong> or use <strong>Business Rules</strong>.',
    'Create a new <strong>Business Rule</strong> on the desired table (e.g., Incident).',
    'Set the rule to run <strong>After</strong> insert/update/delete events.',
    'In the Script field, use <code>gs.makeHttpRequest()</code> to POST JSON to the Webhook URL (from above).',
    'Alternatively, use <strong>Flow Designer → Actions → REST → POST</strong> to send webhook notifications.',
    'Activate your Business Rule or Flow to start receiving events.',
  ],

  samplePayload: {
    table: 'incident',
    action: 'insert',
    record: {
      sys_id: 'abcdef1234567890abcdef1234567890',
      number: 'INC0001234',
      short_description: 'Unable to access email service',
      state: '1',
      priority: '2',
      category: 'network',
      assigned_to: 'John Smith',
      caller_id: 'Jane Doe',
      sys_created_on: '2024-01-15 10:30:00',
      sys_updated_on: '2024-01-15 10:30:00',
    },
    changed_fields: {},
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
