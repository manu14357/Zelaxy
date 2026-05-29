import { MicrosoftOneDriveIcon } from '@/components/icons'
import type { TriggerConfig } from '@/triggers/types'

export const oneDrivePollingTrigger: TriggerConfig = {
  id: 'onedrive_poller',
  name: 'OneDrive Trigger',
  provider: 'microsoft',
  description:
    'Triggers when files are created or updated in Microsoft OneDrive (requires Microsoft credentials)',
  version: '1.0.0',
  icon: MicrosoftOneDriveIcon,

  requiresCredentials: true,
  credentialProvider: 'microsoft',

  configFields: {
    folderId: {
      type: 'string',
      label: 'Folder Path or ID',
      placeholder: '/root or /Documents/Projects',
      description:
        'The OneDrive folder path to monitor (e.g., /root for all files, /Documents for a specific folder). Leave blank to monitor your entire OneDrive.',
      required: false,
    },
    eventTypes: {
      type: 'multiselect',
      label: 'Event Types',
      placeholder: 'Select event types to monitor',
      description: 'Types of file changes to trigger on.',
      required: false,
      options: ['created', 'updated', 'deleted', 'renamed'],
    },
  },

  outputs: {
    file: {
      id: {
        type: 'string',
        description: 'OneDrive file/item ID',
      },
      name: {
        type: 'string',
        description: 'File or folder name',
      },
      webUrl: {
        type: 'string',
        description: 'Link to view the item in a browser',
      },
      mimeType: {
        type: 'string',
        description: 'File MIME type',
      },
      size: {
        type: 'number',
        description: 'File size in bytes',
      },
      parentReference: {
        driveId: {
          type: 'string',
          description: 'ID of the drive containing the file',
        },
        path: {
          type: 'string',
          description: 'Path of the parent folder',
        },
        id: {
          type: 'string',
          description: 'ID of the parent folder',
        },
      },
      createdBy: {
        user: {
          displayName: {
            type: 'string',
            description: 'Display name of the file creator',
          },
          email: {
            type: 'string',
            description: 'Email of the file creator',
          },
        },
      },
      lastModifiedBy: {
        user: {
          displayName: {
            type: 'string',
            description: 'Display name of the user who last modified the file',
          },
          email: {
            type: 'string',
            description: 'Email of the user who last modified the file',
          },
        },
      },
      createdDateTime: {
        type: 'string',
        description: 'File creation timestamp (ISO 8601)',
      },
      lastModifiedDateTime: {
        type: 'string',
        description: 'File last modification timestamp (ISO 8601)',
      },
      isFolder: {
        type: 'boolean',
        description: 'Whether the item is a folder',
      },
      downloadUrl: {
        type: 'string',
        description: 'Temporary download URL for the file (expires after a short time)',
      },
    },
  },

  instructions: [
    'Click <strong>Connect Microsoft</strong> to authorize access to your OneDrive via your Microsoft account.',
    'Optionally enter a <strong>Folder Path or ID</strong> to monitor a specific folder (e.g., /Documents). Leave blank to monitor your entire OneDrive.',
    'Select the <strong>Event Types</strong> you want to trigger on: created, updated, deleted, or renamed.',
    'The trigger will poll OneDrive for file changes on a regular schedule.',
  ],

  samplePayload: {
    id: 'AABB1234CC5678DD',
    name: 'Project Report.docx',
    webUrl:
      'https://onedrive.live.com/?authkey=!AAAA&id=AABB1234CC5678DD',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 34512,
    parentReference: {
      driveId: 'b!abc123',
      path: '/root:/Documents',
      id: 'parentFolderID',
    },
    createdBy: {
      user: {
        displayName: 'John Smith',
        email: 'john@example.com',
      },
    },
    lastModifiedBy: {
      user: {
        displayName: 'Jane Doe',
        email: 'jane@example.com',
      },
    },
    createdDateTime: '2024-01-10T08:00:00Z',
    lastModifiedDateTime: '2024-01-15T10:30:00Z',
    isFolder: false,
    downloadUrl: 'https://public.dm.files.1drv.com/...',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
