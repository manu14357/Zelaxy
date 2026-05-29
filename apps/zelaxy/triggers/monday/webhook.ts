import { CalendarIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const mondayWebhookTrigger: TriggerConfig = {
  id: 'monday_webhook',
  name: 'Monday.com Webhook',
  provider: 'monday',
  description: 'Trigger workflow from Monday.com board item and column events',
  version: '1.0.0',
  icon: CalendarIcon,

  configFields: {},

  outputs: {
    event: {
      event_type: {
        type: 'string',
        description:
          'Event type (e.g., create_pulse, change_column_value, delete_pulse, move_pulse_into_board)',
      },
      data: {
        boardId: {
          type: 'string',
          description: 'Board ID where the event occurred',
        },
        groupId: {
          type: 'string',
          description: 'Group ID within the board',
        },
        pulseId: {
          type: 'string',
          description: 'Item (pulse) ID',
        },
        pulseName: {
          type: 'string',
          description: 'Item (pulse) name',
        },
        columnId: {
          type: 'string',
          description: 'Column ID that changed (for column change events)',
        },
        columnType: {
          type: 'string',
          description: 'Column type (status, text, number, date, etc.)',
        },
        columnTitle: {
          type: 'string',
          description: 'Column title that changed',
        },
        value: {
          type: 'json',
          description: 'New column value after the change',
        },
        previousValue: {
          type: 'json',
          description: 'Previous column value before the change',
        },
        userId: {
          type: 'number',
          description: 'User ID who triggered the event',
        },
        triggerUuid: {
          type: 'string',
          description: 'Unique identifier for this trigger event',
        },
        createdAt: {
          type: 'string',
          description: 'Event creation timestamp',
        },
      },
    },
  },

  instructions: [
    'In Monday.com, open a <strong>board</strong> and click on <strong>Integrate</strong> in the top-right.',
    'Search for <strong>Webhooks</strong> and select it.',
    'Choose the event type you want to trigger on.',
    'Enter the Webhook URL (from above) as the webhook endpoint.',
    'Click <strong>Add to Board</strong>.',
    'Monday.com will immediately start sending events to your webhook URL when the configured action occurs.',
  ],

  samplePayload: {
    event: {
      userId: 12345678,
      originalTriggerUuid: null,
      boardId: 987654321,
      pulseId: 1122334455,
      pulseName: 'Quarterly Report',
      groupId: 'group_title',
      columnId: 'status',
      columnType: 'color',
      columnTitle: 'Status',
      value: {
        label: {
          index: 1,
          text: 'Done',
          style: { color: '#00C875', border: '#00B461' },
          is_done: true,
          id: '1',
        },
        post_id: null,
        update_id: null,
      },
      previousValue: {
        label: {
          index: 0,
          text: 'Working on it',
          style: { color: '#FDAB3D', border: '#E99729' },
          is_done: false,
          id: '0',
        },
        post_id: null,
        update_id: null,
      },
      changedAt: 1705312200.123456,
      isTopGroup: true,
      type: 'change_column_value',
      triggerUuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      createdAt: '2024-01-15T10:30:00.123Z',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
