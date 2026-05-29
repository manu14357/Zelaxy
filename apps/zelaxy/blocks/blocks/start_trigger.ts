import { StartIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const StartTriggerBlock: BlockConfig = {
  type: 'start_trigger',
  name: 'Start',
  description: 'Unified workflow entry point for chat, manual and API runs',
  longDescription:
    'Collect structured inputs and power manual runs, API executions, and deployed chat experiences from a single start block.',
  category: 'triggers',
  bgColor: '#34B5FF',
  icon: StartIcon,
  hideFromToolbar: false,
  subBlocks: [
    {
      id: 'inputFormat',
      title: 'Inputs',
      type: 'input-format',
      description: 'Add custom fields beyond the built-in input, conversationId, and files fields.',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {},
  triggers: {
    enabled: true,
    available: ['chat', 'manual', 'api'],
  },
}
