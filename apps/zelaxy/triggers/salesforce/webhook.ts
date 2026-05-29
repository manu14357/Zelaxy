import { SalesforceIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const salesforceWebhookTrigger: TriggerConfig = {
  id: 'salesforce_webhook',
  name: 'Salesforce Webhook',
  provider: 'salesforce',
  description:
    'Trigger workflow from Salesforce record events (leads, contacts, opportunities, cases)',
  version: '1.0.0',
  icon: SalesforceIcon,

  configFields: {},

  outputs: {
    event: {
      object_type: {
        type: 'string',
        description: 'Salesforce object type (Lead, Contact, Opportunity, Case, Account, etc.)',
      },
      event_type: {
        type: 'string',
        description: 'Event type (created, updated, deleted)',
      },
      record: {
        Id: {
          type: 'string',
          description: 'Salesforce record ID (18-character)',
        },
        Name: {
          type: 'string',
          description: 'Record name',
        },
        CreatedDate: {
          type: 'string',
          description: 'Record creation date (ISO 8601)',
        },
        LastModifiedDate: {
          type: 'string',
          description: 'Last modification date (ISO 8601)',
        },
        OwnerId: {
          type: 'string',
          description: 'Owner user ID',
        },
      },
      changed_fields: {
        type: 'json',
        description: 'Map of field names to their new values for updated records',
      },
      old_values: {
        type: 'json',
        description: 'Map of field names to their old values (before update)',
      },
    },
  },

  instructions: [
    'In Salesforce, go to <strong>Setup → Process Automation → Flows</strong> and create an Autolaunched Flow.',
    'Add a trigger element set to <strong>Record-Triggered Flow</strong> for the object and event type you want.',
    'Add an <strong>Action</strong> element of type <strong>HTTP Callout</strong>.',
    'Set the HTTP method to <strong>POST</strong> and the URL to the Webhook URL (from above).',
    'Map the record fields to the request body as JSON.',
    'Alternatively, use <strong>Apex Triggers</strong> with a <strong>@future(callout=true)</strong> method to send HTTP requests.',
    'Save and activate your Flow or Apex Trigger.',
  ],

  samplePayload: {
    object_type: 'Lead',
    event_type: 'created',
    record: {
      Id: '00Q000000000000AAA',
      FirstName: 'John',
      LastName: 'Smith',
      Email: 'john.smith@example.com',
      Company: 'Acme Corp',
      Status: 'New',
      OwnerId: '005000000000000AAA',
      CreatedDate: '2024-01-15T10:30:00.000Z',
      LastModifiedDate: '2024-01-15T10:30:00.000Z',
      LeadSource: 'Web',
    },
    changed_fields: {},
    old_values: {},
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
