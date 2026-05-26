import { ApiIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const ApiTriggerBlock: BlockConfig = {
  type: 'api_trigger',
  name: 'API (Legacy)',
  description: 'Trigger workflows via a REST API endpoint (legacy format)',
  longDescription:
    'Expose your workflow as a REST API endpoint. Incoming requests will trigger the workflow and pass data through the input format configured.',
  docsLink: '#',
  category: 'triggers',
  bgColor: '#2F55FF',
  icon: ApiIcon,
  subBlocks: [
    {
      id: 'inputFormat',
      title: 'Input Format',
      type: 'input-format',
      layout: 'full',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {
    input: { type: 'json', description: 'Incoming request data' },
  },
  triggers: {
    enabled: true,
    available: ['api'],
  },
}
