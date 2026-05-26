import { AgentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const A2ABlock: BlockConfig = {
  type: 'a2a',
  name: 'A2A',
  description: 'Send messages and manage tasks with Agent-to-Agent protocol',
  longDescription:
    'Interact with AI agents using the A2A (Agent-to-Agent) protocol. Send messages, retrieve task status, cancel tasks, and manage push notifications.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4151B5',
  icon: AgentIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send Message', id: 'a2a_send_message' },
        { label: 'Get Task', id: 'a2a_get_task' },
        { label: 'Cancel Task', id: 'a2a_cancel_task' },
        { label: 'Get Agent Card', id: 'a2a_get_agent_card' },
        { label: 'Resubscribe', id: 'a2a_resubscribe' },
        { label: 'Set Push Notification', id: 'a2a_set_push_notification' },
      ],
      required: true,
    },
    {
      id: 'agentUrl',
      title: 'Agent URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://agent.example.com',
      required: true,
    },
    {
      id: 'message',
      title: 'Message',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter message to send to the agent',
      condition: { field: 'operation', value: ['a2a_send_message', 'a2a_resubscribe'] },
    },
    {
      id: 'taskId',
      title: 'Task ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'task-id',
      condition: {
        field: 'operation',
        value: ['a2a_get_task', 'a2a_cancel_task', 'a2a_set_push_notification'],
      },
    },
  ],
  tools: {
    access: [
      'a2a_send_message',
      'a2a_get_task',
      'a2a_cancel_task',
      'a2a_get_agent_card',
      'a2a_resubscribe',
      'a2a_set_push_notification',
    ],
    config: {
      tool: (params) => params.operation || 'a2a_send_message',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    agentUrl: { type: 'string', description: 'Agent URL' },
    message: { type: 'string', description: 'Message to send' },
    taskId: { type: 'string', description: 'Task ID' },
  },
  outputs: {
    content: { type: 'string', description: 'Response content' },
    taskId: { type: 'string', description: 'Task ID' },
    contextId: { type: 'string', description: 'Context ID' },
    state: { type: 'string', description: 'Task state' },
    artifacts: { type: 'json', description: 'Task artifacts' },
  },
}
