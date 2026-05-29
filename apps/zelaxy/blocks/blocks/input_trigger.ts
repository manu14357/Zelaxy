import type { SVGProps } from 'react'
import { createElement } from 'react'
import { FormInput } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const InputTriggerIcon = (props: SVGProps<SVGSVGElement>) => createElement(FormInput, props)

export const InputTriggerBlock: BlockConfig = {
  type: 'input_trigger',
  name: 'Input Form (Legacy)',
  description: 'Legacy manual start block with structured input. Prefer Start block.',
  longDescription:
    'Manually trigger the workflow from the editor with a structured input schema. This enables typed inputs for parent workflows to map into.',
  category: 'triggers',
  hideFromToolbar: true,
  bgColor: '#3B82F6',
  icon: InputTriggerIcon,
  subBlocks: [
    {
      id: 'inputFormat',
      title: 'Input Format',
      type: 'input-format',
      description: 'Define the JSON input schema for this workflow when run manually.',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {},
  triggers: {
    enabled: true,
    available: ['manual'],
  },
}
