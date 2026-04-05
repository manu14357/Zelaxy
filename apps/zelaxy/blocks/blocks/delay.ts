import { DelayIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { DelayToolResponse } from '@/tools/delay/types'

export const DelayBlock: BlockConfig<DelayToolResponse> = {
  type: 'delay',
  name: 'Wait / Delay',
  description: 'Pause workflow execution for a specified duration',
  longDescription:
    'Pauses workflow execution for a configurable amount of time. Use it to add delays between API calls for rate limiting, wait for external processes, create timed sequences, or add cooldowns between steps.',
  category: 'blocks',
  bgColor: '#6366F1',
  icon: DelayIcon,
  docsLink: '/docs/blocks/delay',

  subBlocks: [
    {
      id: 'duration',
      title: 'Duration',
      type: 'short-input',
      layout: 'half',
      placeholder: 'e.g. 5',
      required: true,
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
      ],
      value: () => 'seconds',
    },
  ],

  tools: {
    access: ['delay_wait'],
    config: {
      tool: () => 'delay_wait',
      params: (params) => ({
        duration: Number(params.duration),
        unit: params.unit,
      }),
    },
  },

  inputs: {
    duration: { type: 'number', description: 'How long to wait' },
    unit: { type: 'string', description: 'Time unit (seconds, minutes, or hours)' },
  },

  outputs: {
    delayed: { type: 'boolean', description: 'Whether the delay completed' },
    duration: { type: 'number', description: 'Requested delay duration' },
    unit: { type: 'string', description: 'Time unit used' },
    delayMs: { type: 'number', description: 'Actual delay in milliseconds' },
    startedAt: { type: 'string', description: 'ISO timestamp when delay started' },
    completedAt: { type: 'string', description: 'ISO timestamp when delay completed' },
  },
}
