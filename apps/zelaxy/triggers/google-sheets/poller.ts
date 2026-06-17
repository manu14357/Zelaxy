import { GoogleSheetsIcon } from '@/components/icons'
import type { TriggerConfig } from '@/triggers/types'

export const googleSheetsPollingTrigger: TriggerConfig = {
  id: 'google_sheets_poller',
  name: 'Google Sheets Trigger',
  provider: 'google-sheets',
  description:
    'Triggers when rows are added or data changes in a Google Sheets spreadsheet (requires Google credentials)',
  version: '1.0.0',
  icon: GoogleSheetsIcon,

  requiresCredentials: true,
  credentialProvider: 'google-sheets',

  configFields: {
    spreadsheetId: {
      type: 'string',
      label: 'Spreadsheet ID',
      placeholder: 'Enter the Google Sheets spreadsheet ID',
      description:
        'The ID of the spreadsheet to monitor. Found in the spreadsheet URL: docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit.',
      required: false,
    },
    sheetName: {
      type: 'string',
      label: 'Sheet Name',
      placeholder: 'Sheet1',
      description:
        'The name of the specific sheet (tab) to monitor. Leave blank to monitor all sheets.',
      required: false,
    },
  },

  outputs: {
    spreadsheet: {
      spreadsheetId: {
        type: 'string',
        description: 'Google Sheets spreadsheet ID',
      },
      spreadsheetTitle: {
        type: 'string',
        description: 'Title of the spreadsheet',
      },
      sheetName: {
        type: 'string',
        description: 'Name of the sheet (tab) that changed',
      },
      sheetId: {
        type: 'number',
        description: 'Numeric ID of the sheet',
      },
      newRow: {
        type: 'json',
        description: 'New row data as an object with column headers as keys',
      },
      updatedRange: {
        type: 'string',
        description: 'A1 notation of the updated cell range (e.g., Sheet1!A2:E2)',
      },
      updatedValues: {
        type: 'json',
        description: 'Array of updated rows, each row being an array of cell values',
      },
      updatedRowCount: {
        type: 'number',
        description: 'Number of rows that were updated',
      },
      updatedColumnCount: {
        type: 'number',
        description: 'Number of columns that were updated',
      },
      modifiedTime: {
        type: 'string',
        description: 'Spreadsheet last modification timestamp (ISO 8601)',
      },
      webViewLink: {
        type: 'string',
        description: 'Link to view the spreadsheet in a browser',
      },
    },
  },

  instructions: [
    'Click <strong>Connect Google Sheets</strong> to authorize access to your Google Sheets.',
    'Enter the <strong>Spreadsheet ID</strong> of the sheet to monitor. The ID is the long string in the spreadsheet URL.',
    'Optionally enter a <strong>Sheet Name</strong> (tab name) to monitor a specific sheet within the spreadsheet.',
    'The trigger will poll for new rows and data changes on a regular schedule.',
  ],

  samplePayload: {
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
    spreadsheetTitle: 'Customer Orders 2024',
    sheetName: 'Orders',
    sheetId: 0,
    newRow: {
      'Order ID': 'ORD-1234',
      'Customer Name': 'John Smith',
      Email: 'john@example.com',
      Product: 'Widget Pro',
      Quantity: '3',
      Total: '$149.97',
      'Order Date': '2024-01-15',
    },
    updatedRange: 'Orders!A42:G42',
    updatedValues: [
      ['ORD-1234', 'John Smith', 'john@example.com', 'Widget Pro', '3', '$149.97', '2024-01-15'],
    ],
    updatedRowCount: 1,
    updatedColumnCount: 7,
    modifiedTime: '2024-01-15T10:30:00.000Z',
    webViewLink:
      'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit?usp=drivesdk',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
