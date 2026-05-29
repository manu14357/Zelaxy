import { GoogleDocsIcon } from '@/components/icons'
import type { TriggerConfig } from '@/triggers/types'

export const googleDocsPollingTrigger: TriggerConfig = {
  id: 'google_docs_poller',
  name: 'Google Docs Trigger',
  provider: 'google-docs',
  description:
    'Triggers when a Google Doc is created or updated (requires Google credentials)',
  version: '1.0.0',
  icon: GoogleDocsIcon,

  requiresCredentials: true,
  credentialProvider: 'google-docs',

  configFields: {
    documentId: {
      type: 'string',
      label: 'Document ID',
      placeholder: 'Enter Google Doc ID or leave blank to monitor all docs',
      description:
        'The ID of the specific Google Doc to monitor. Found in the document URL. Leave blank to monitor all accessible documents.',
      required: false,
    },
  },

  outputs: {
    document: {
      documentId: {
        type: 'string',
        description: 'Google Doc document ID',
      },
      title: {
        type: 'string',
        description: 'Document title',
      },
      body: {
        type: 'string',
        description: 'Plain text content of the document',
      },
      revisionId: {
        type: 'string',
        description: 'Current revision ID of the document',
      },
      lastModifyingUser: {
        displayName: {
          type: 'string',
          description: 'Display name of the last user who modified the document',
        },
        emailAddress: {
          type: 'string',
          description: 'Email address of the last user who modified the document',
        },
      },
      createdTime: {
        type: 'string',
        description: 'Document creation timestamp (ISO 8601)',
      },
      modifiedTime: {
        type: 'string',
        description: 'Document last modification timestamp (ISO 8601)',
      },
      webViewLink: {
        type: 'string',
        description: 'Link to view the document in a browser',
      },
      mimeType: {
        type: 'string',
        description: 'MIME type of the document',
      },
      owners: {
        type: 'json',
        description: 'Array of document owners with displayName and emailAddress',
      },
    },
  },

  instructions: [
    'Click <strong>Connect Google Docs</strong> to authorize access to your Google Docs.',
    'Optionally enter a <strong>Document ID</strong> to monitor a specific document. Leave blank to monitor all documents.',
    'The Document ID is the long string in the Google Doc URL: docs.google.com/document/d/<strong>DOCUMENT_ID</strong>/edit.',
    'The trigger will poll for document changes on a regular schedule.',
  ],

  samplePayload: {
    documentId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
    title: 'Project Proposal Q1 2024',
    body: 'Introduction\n\nThis document outlines our Q1 goals and initiatives...',
    revisionId: 'ABCDEFGhijklmnop1234',
    lastModifyingUser: {
      displayName: 'John Smith',
      emailAddress: 'john.smith@example.com',
    },
    createdTime: '2024-01-10T08:00:00.000Z',
    modifiedTime: '2024-01-15T10:30:00.000Z',
    webViewLink:
      'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit?usp=drivesdk',
    mimeType: 'application/vnd.google-apps.document',
    owners: [{ displayName: 'Jane Doe', emailAddress: 'jane.doe@example.com' }],
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
