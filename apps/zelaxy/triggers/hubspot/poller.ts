import { HubspotIcon } from '@/components/icons'
import type { TriggerConfig } from '@/triggers/types'

export const hubspotPollingTrigger: TriggerConfig = {
  id: 'hubspot_poller',
  name: 'HubSpot Trigger',
  provider: 'hubspot',
  description:
    'Triggers when contacts, companies, deals, or tickets are created or updated in HubSpot (requires HubSpot credentials)',
  version: '1.0.0',
  icon: HubspotIcon,

  requiresCredentials: true,
  credentialProvider: 'hubspot',

  configFields: {
    objectType: {
      type: 'select',
      label: 'Object Type',
      placeholder: 'Select HubSpot object type',
      description: 'The type of HubSpot object to monitor for changes.',
      required: false,
      options: ['contacts', 'companies', 'deals', 'tickets', 'quotes'],
    },
    eventType: {
      type: 'select',
      label: 'Event Type',
      placeholder: 'Select event type',
      description: 'Whether to trigger on newly created records, updated records, or both.',
      required: false,
      options: ['created', 'updated', 'all'],
    },
  },

  outputs: {
    object: {
      id: {
        type: 'string',
        description: 'HubSpot object ID',
      },
      objectType: {
        type: 'string',
        description: 'Type of HubSpot object (contacts, companies, deals, tickets, quotes)',
      },
      eventType: {
        type: 'string',
        description: 'Type of change event (created or updated)',
      },
      properties: {
        firstname: {
          type: 'string',
          description: 'Contact first name (contacts only)',
        },
        lastname: {
          type: 'string',
          description: 'Contact last name (contacts only)',
        },
        email: {
          type: 'string',
          description: 'Contact email address (contacts only)',
        },
        phone: {
          type: 'string',
          description: 'Contact or company phone number',
        },
        company: {
          type: 'string',
          description: 'Associated company name (contacts only)',
        },
        name: {
          type: 'string',
          description: 'Company or deal name',
        },
        dealstage: {
          type: 'string',
          description: 'Deal stage (deals only)',
        },
        amount: {
          type: 'string',
          description: 'Deal amount (deals only)',
        },
        closedate: {
          type: 'string',
          description: 'Expected close date (deals only)',
        },
        hs_pipeline_stage: {
          type: 'string',
          description: 'Pipeline stage (tickets only)',
        },
        subject: {
          type: 'string',
          description: 'Ticket subject (tickets only)',
        },
        hs_ticket_priority: {
          type: 'string',
          description: 'Ticket priority (tickets only)',
        },
        createdate: {
          type: 'string',
          description: 'Record creation date (ISO 8601)',
        },
        hs_lastmodifieddate: {
          type: 'string',
          description: 'Record last modification date (ISO 8601)',
        },
      },
      createdAt: {
        type: 'string',
        description: 'Record creation timestamp (ISO 8601)',
      },
      updatedAt: {
        type: 'string',
        description: 'Record last update timestamp (ISO 8601)',
      },
    },
  },

  instructions: [
    'Click <strong>Connect HubSpot</strong> to authorize access to your HubSpot account.',
    'Select the <strong>Object Type</strong> to monitor (Contacts, Companies, Deals, or Tickets).',
    'Choose the <strong>Event Type</strong>: trigger on newly created records, updated records, or both.',
    'The trigger will poll HubSpot for new or changed records on a regular schedule.',
  ],

  samplePayload: {
    id: '123456789',
    objectType: 'contacts',
    eventType: 'created',
    properties: {
      firstname: 'John',
      lastname: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0100',
      company: 'Acme Corp',
      createdate: '2024-01-15T10:30:00.000Z',
      hs_lastmodifieddate: '2024-01-15T10:30:00.000Z',
    },
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
