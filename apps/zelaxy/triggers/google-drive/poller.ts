import { GoogleDriveIcon } from '@/components/icons'
import type { TriggerConfig } from '@/triggers/types'

export const googleDrivePollingTrigger: TriggerConfig = {
  id: 'google_drive_poller',
  name: 'Google Drive Trigger',
  provider: 'google-drive',
  description:
    'Triggers when files are created, updated, or deleted in Google Drive (requires Google credentials)',
  version: '1.0.0',
  icon: GoogleDriveIcon,

  requiresCredentials: true,
  credentialProvider: 'google-drive',

  configFields: {
    folderId: {
      type: 'string',
      label: 'Folder ID',
      placeholder: 'Enter folder ID or leave blank to monitor all files',
      description:
        'Monitor only files within a specific folder. Leave blank to monitor all files in your Drive. The Folder ID is in the folder URL.',
      required: false,
    },
    fileTypes: {
      type: 'multiselect',
      label: 'File Types',
      placeholder: 'All file types',
      description: 'Filter by specific file types (e.g., documents, spreadsheets).',
      required: false,
      options: [
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.presentation',
        'application/pdf',
      ],
    },
    eventTypes: {
      type: 'multiselect',
      label: 'Event Types',
      placeholder: 'Select event types to monitor',
      description: 'Types of file changes to trigger on.',
      required: false,
      options: ['created', 'updated', 'deleted'],
    },
  },

  outputs: {
    file: {
      id: {
        type: 'string',
        description: 'Google Drive file ID',
      },
      name: {
        type: 'string',
        description: 'File name',
      },
      mimeType: {
        type: 'string',
        description: 'File MIME type',
      },
      size: {
        type: 'string',
        description: 'File size in bytes (not set for Google Docs native formats)',
      },
      webViewLink: {
        type: 'string',
        description: 'Link to view the file in a browser',
      },
      webContentLink: {
        type: 'string',
        description: 'Link to download the file (for non-native formats)',
      },
      parents: {
        type: 'json',
        description: 'Array of parent folder IDs',
      },
      owners: {
        type: 'json',
        description: 'Array of file owners with displayName and emailAddress',
      },
      lastModifyingUser: {
        displayName: {
          type: 'string',
          description: 'Display name of the user who last modified the file',
        },
        emailAddress: {
          type: 'string',
          description: 'Email of the user who last modified the file',
        },
      },
      createdTime: {
        type: 'string',
        description: 'File creation timestamp (ISO 8601)',
      },
      modifiedTime: {
        type: 'string',
        description: 'File last modification timestamp (ISO 8601)',
      },
      trashed: {
        type: 'boolean',
        description: 'Whether the file has been moved to trash',
      },
    },
  },

  instructions: [
    'Click <strong>Connect Google Drive</strong> to authorize access to your Google Drive.',
    'Optionally enter a <strong>Folder ID</strong> to limit monitoring to a specific folder. The Folder ID appears in the folder URL: drive.google.com/drive/folders/<strong>FOLDER_ID</strong>.',
    'Select the <strong>File Types</strong> and <strong>Event Types</strong> you want to trigger on.',
    'The trigger will poll your Drive for file changes on a regular schedule.',
  ],

  samplePayload: {
    kind: 'drive#file',
    id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
    name: 'Q1 Report.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: '45678',
    webViewLink:
      'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/view?usp=drivesdk',
    parents: ['0AKjFoqp5q1xzUk9PVA'],
    owners: [{ displayName: 'John Smith', emailAddress: 'john@example.com' }],
    lastModifyingUser: {
      displayName: 'Jane Doe',
      emailAddress: 'jane@example.com',
    },
    createdTime: '2024-01-10T08:00:00.000Z',
    modifiedTime: '2024-01-15T10:30:00.000Z',
    trashed: false,
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
