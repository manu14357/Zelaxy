import { TableIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const tableRowPollingTrigger: TriggerConfig = {
  id: 'table_poller',
  name: 'Table: New Row',
  provider: 'table',
  description: 'Trigger a workflow when a new row is added to a Zelaxy table',
  version: '1.0.0',
  icon: TableIcon,

  configFields: {
    tableId: {
      type: 'string',
      label: 'Table ID',
      placeholder: 'tbl_abc123',
      description:
        'ID of the table to watch. New rows added to this table start a run. The table must live in the same workspace as this workflow.',
      required: true,
    },
  },

  // Flattened by formatWebhookInput's `table` case
  outputs: {
    row_id: { type: 'string', description: 'ID of the newly added row' },
    table_id: { type: 'string', description: 'ID of the table the row was added to' },
    table_name: { type: 'string', description: 'Name of the table the row was added to' },
    data: { type: 'object', description: "The row's column values as a JSON object" },
    position: { type: 'number', description: 'Ordinal position of the row in the table' },
    created_at: { type: 'string', description: 'When the row was created (ISO)' },
    row: { type: 'object', description: 'The full row record' },
    raw: { type: 'object', description: 'Complete payload as delivered by the poller' },
  },

  instructions: [
    'Enter the <strong>Table ID</strong> of the table you want to watch. Copy it from the table view or a Table block.',
    'This trigger has no webhook URL to register: Zelaxy scans the table for new rows on a schedule and runs this workflow once per new row.',
    'The table must live in the <strong>same workspace</strong> as this workflow — rows in tables from other workspaces are ignored.',
    '<strong>Connecting does not replay history:</strong> the first poll records the existing rows and triggers nothing. Only rows added afterwards can start a run.',
    "Reference the new row's fields directly, e.g. <code>{{Table: New Row 1.data}}</code> for the column values or <code>{{Table: New Row 1.row_id}}</code> for the row ID.",
  ],

  samplePayload: {
    event: {
      row_id: 'row_abc123',
      table_id: 'tbl_abc123',
      table_name: 'Signups',
      data: { email: 'john@example.com', name: 'John', plan: 'pro' },
      position: 42,
      created_at: '2024-01-15T13:14:15.000Z',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
