import { BrainIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const DSPyBlock: BlockConfig = {
  type: 'dspy',
  name: 'DSPy',
  description: 'Run DSPy AI programs and optimize prompts',
  longDescription:
    'Integrate DSPy language model programming into your workflows. Execute DSPy programs, optimize prompt chains, and run structured AI tasks.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E0E0E0',
  icon: BrainIcon,
  subBlocks: [
    {
      id: 'program',
      title: 'DSPy Program (Code)',
      type: 'code',
      layout: 'full',
      placeholder: 'import dspy\n# Define your DSPy program here',
      required: true,
    },
    {
      id: 'input',
      title: 'Input',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Input for the DSPy program',
    },
  ],
  tools: {
    access: ['dspy_run'],
    config: {
      tool: () => 'dspy_run',
    },
  },
  inputs: {
    program: { type: 'string', description: 'DSPy program code' },
    input: { type: 'string', description: 'Program input' },
  },
  outputs: {
    output: { type: 'string', description: 'Program output' },
    prediction: { type: 'json', description: 'Prediction object' },
  },
}
