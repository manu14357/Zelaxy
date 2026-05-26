import { DelayIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface WaitResponse {
  success: boolean
  output: {
    waitedMs: number
    resumedAt: string
    mode: 'sync' | 'async'
  }
}

export const WaitBlock: BlockConfig<WaitResponse> = {
  type: 'wait',
  name: 'Wait',
  description: 'Pause workflow execution for a specified duration',
  longDescription:
    'Suspend workflow execution for a fixed duration. Durations up to 5 minutes run synchronously. Longer durations are handled asynchronously and the workflow resumes automatically when the timer expires.',
  docsLink: '#',
  category: 'blocks',
  bgColor: '#6366F1',
  icon: DelayIcon,
  subBlocks: [
    {
      id: 'duration',
      title: 'Duration',
      type: 'short-input',
      layout: 'half',
      placeholder: '5',
      required: true,
      description: 'How long to wait',
    },
    {
      id: 'unit',
      title: 'Unit',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Seconds', id: 'seconds' },
        { label: 'Minutes', id: 'minutes' },
        { label: 'Hours', id: 'hours' },
        { label: 'Days', id: 'days' },
      ],
      value: () => 'seconds',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    duration: {
      type: 'number',
      description: 'Wait duration value',
    },
    unit: {
      type: 'string',
      description: 'Wait duration unit: seconds, minutes, hours, or days',
    },
  },
  outputs: {
    waitedMs: {
      type: 'number',
      description: 'Actual time waited in milliseconds',
    },
    resumedAt: {
      type: 'string',
      description: 'ISO timestamp when the workflow resumed',
    },
    mode: {
      type: 'string',
      description: 'Whether the wait was synchronous (≤5 min) or asynchronous',
    },
  },
}
