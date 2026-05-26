import { CodeIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const CursorBlock: BlockConfig = {
  type: 'cursor',
  name: 'Cursor (Legacy)',
  description: 'Launch and manage AI coding agents in Cursor',
  longDescription:
    'Integrate Cursor AI coding assistant into your workflows. Launch agents, add follow-ups, retrieve agent status, and download artifacts.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1E1E1E',
  icon: CodeIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Launch Agent', id: 'cursor_launch_agent' },
        { label: 'Add Followup', id: 'cursor_add_followup' },
        { label: 'Get Agent', id: 'cursor_get_agent' },
        { label: 'Get Conversation', id: 'cursor_get_conversation' },
        { label: 'List Agents', id: 'cursor_list_agents' },
        { label: 'Stop Agent', id: 'cursor_stop_agent' },
      ],
      required: true,
    },
    {
      id: 'repository',
      title: 'Repository',
      type: 'short-input',
      layout: 'half',
      placeholder: 'org/repo',
      condition: { field: 'operation', value: ['cursor_launch_agent'] },
    },
    {
      id: 'ref',
      title: 'Branch/Ref',
      type: 'short-input',
      layout: 'half',
      placeholder: 'main',
      condition: { field: 'operation', value: ['cursor_launch_agent'] },
    },
    {
      id: 'promptText',
      title: 'Prompt',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Describe the task for the agent...',
      condition: { field: 'operation', value: ['cursor_launch_agent', 'cursor_add_followup'] },
    },
    {
      id: 'agentId',
      title: 'Agent ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'agent-id',
      condition: {
        field: 'operation',
        value: [
          'cursor_add_followup',
          'cursor_get_agent',
          'cursor_get_conversation',
          'cursor_stop_agent',
        ],
      },
    },
    {
      id: 'model',
      title: 'Model',
      type: 'short-input',
      layout: 'full',
      placeholder: 'claude-4-5',
      condition: { field: 'operation', value: ['cursor_launch_agent'] },
    },
  ],
  tools: {
    access: [
      'cursor_launch_agent',
      'cursor_add_followup',
      'cursor_get_agent',
      'cursor_get_conversation',
      'cursor_list_agents',
      'cursor_stop_agent',
    ],
    config: {
      tool: (params) => params.operation || 'cursor_launch_agent',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    repository: { type: 'string', description: 'Repository slug' },
    ref: { type: 'string', description: 'Branch or ref' },
    promptText: { type: 'string', description: 'Agent prompt' },
    agentId: { type: 'string', description: 'Agent ID' },
    model: { type: 'string', description: 'Model name' },
  },
  outputs: {
    agentId: { type: 'string', description: 'Agent ID' },
    status: { type: 'string', description: 'Agent status' },
    conversation: { type: 'json', description: 'Conversation history' },
  },
}
