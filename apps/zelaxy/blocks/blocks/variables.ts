import { ComponentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface VariablesResponse {
  success: boolean
  output: {
    variables: Record<string, any>
    count: number
  }
}

export const VariablesBlock: BlockConfig<VariablesResponse> = {
  type: 'variables',
  name: 'Variables',
  description: 'Set or update workflow-scoped variables',
  longDescription:
    'Assign values to named variables that persist for the lifetime of the workflow run. These variables can be referenced in downstream blocks using the standard {{block_id.output.variables.varName}} syntax.',
  docsLink: '#',
  category: 'blocks',
  bgColor: '#10B981',
  icon: ComponentIcon,
  subBlocks: [
    {
      id: 'assignments',
      title: 'Variable Assignments',
      type: 'table',
      layout: 'full',
      columns: ['Name', 'Value'],
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    assignments: {
      type: 'json',
      description: 'Array of {name, value} pairs defining the variables to set',
    },
  },
  outputs: {
    variables: {
      type: 'json',
      description: 'Map of all variable names to their assigned values',
    },
    count: {
      type: 'number',
      description: 'Number of variables assigned',
    },
  },
}
