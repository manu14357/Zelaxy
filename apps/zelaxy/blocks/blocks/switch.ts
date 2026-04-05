import { SwitchCaseIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface SwitchBlockOutput {
  success: boolean
  output: {
    matchedValue: string
    selectedCaseId: string
    selectedPath: {
      blockId: string
      blockType: string
      blockTitle: string
    }
    inputValue: string
  }
}

export const SwitchBlock: BlockConfig<SwitchBlockOutput> = {
  type: 'switch',
  name: 'Switch',
  description: 'Route by exact value matching',
  longDescription:
    "Deterministic multi-branch routing — like JavaScript's switch statement. Supports exact match, contains, starts/ends with, regex, and numeric comparisons. Use {{}} variable references in case values. Faster and cheaper than Router (no LLM needed).",
  docsLink: '/docs/blocks/switch',
  category: 'blocks',
  bgColor: '#8B5CF6',
  icon: SwitchCaseIcon,
  subBlocks: [
    {
      id: 'value',
      title: 'Switch Value',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Value to match against, e.g. {{agent1.status}}',
      required: true,
    },
    {
      id: 'matchMode',
      title: 'Match Mode',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Exact Match (===)', id: 'exact' },
        { label: 'Contains', id: 'contains' },
        { label: 'Starts With', id: 'startsWith' },
        { label: 'Ends With', id: 'endsWith' },
        { label: 'Regex', id: 'regex' },
        { label: 'Numeric (> < >= <= ==)', id: 'numeric' },
      ],
      value: () => 'exact',
    },
    {
      id: 'cases',
      title: 'Cases',
      type: 'switch-case-input',
      layout: 'full',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {
    matchedValue: { type: 'string', description: 'The value that was matched' },
    selectedCaseId: { type: 'string', description: 'ID of the matched case' },
    matchMode: { type: 'string', description: 'The match mode used' },
    selectedPath: { type: 'json', description: 'Selected execution path information' },
    inputValue: { type: 'string', description: 'The original input value' },
  },
}
