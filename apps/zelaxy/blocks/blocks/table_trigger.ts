import { TableIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const TableTriggerBlock: BlockConfig = {
  type: 'table_trigger',
  name: 'Table: New Row',
  description: 'Trigger when a new row is added to a Zelaxy table',
  longDescription:
    'React to rows being added to a user-defined Zelaxy table. Zelaxy scans the watched table on a schedule and runs this workflow once per new row. The first poll only records existing rows, so connecting the trigger never replays history. The table must live in the same workspace as this workflow.',
  category: 'triggers',
  icon: TableIcon,
  bgColor: '#10B981', // Green color for triggers

  subBlocks: [
    {
      id: 'triggerConfig',
      title: 'Table Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'table',
      availableTriggers: ['table_poller'],
    },
  ],

  tools: {
    access: [], // No external tools needed for triggers
  },

  inputs: {}, // No inputs - rows arrive from the table poller

  // Flattened by formatWebhookInput's `table` case
  outputs: {
    row_id: { type: 'string', description: 'ID of the newly added row' },
    table_id: { type: 'string', description: 'ID of the table the row was added to' },
    table_name: { type: 'string', description: 'Name of the table the row was added to' },
    data: { type: 'json', description: "The row's column values as a JSON object" },
    position: { type: 'number', description: 'Ordinal position of the row in the table' },
    created_at: { type: 'string', description: 'When the row was created (ISO)' },
  },

  triggers: {
    enabled: true,
    available: ['table_poller'],
  },
}
