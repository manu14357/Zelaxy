import { GoogleTasksIcon } from '@/components/icons/google-tasks-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleTasksResponse } from '@/tools/google_tasks/types'

export const GoogleTasksBlock: BlockConfig<GoogleTasksResponse> = {
  type: 'google_tasks',
  name: 'Google Tasks',
  description: 'Manage task lists and tasks in Google Tasks',
  longDescription:
    'List task lists, list tasks, create tasks, and mark tasks as completed through the Google Tasks API. Authenticate with a Google OAuth access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#2684FC',
  icon: GoogleTasksIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List task lists', id: 'google_tasks_list_tasklists' },
        { label: 'List tasks', id: 'google_tasks_list_tasks' },
        { label: 'Create task', id: 'google_tasks_create_task' },
        { label: 'Complete task', id: 'google_tasks_complete_task' },
      ],
      value: () => 'google_tasks_list_tasklists',
    },
    {
      id: 'tasklist',
      title: 'Task List ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '@default',
      condition: {
        field: 'operation',
        value: [
          'google_tasks_list_tasks',
          'google_tasks_create_task',
          'google_tasks_complete_task',
        ],
      },
    },
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'My task',
      condition: { field: 'operation', value: 'google_tasks_create_task' },
    },
    {
      id: 'notes',
      title: 'Notes',
      type: 'long-input',
      layout: 'full',
      condition: { field: 'operation', value: 'google_tasks_create_task' },
    },
    {
      id: 'due',
      title: 'Due Date',
      type: 'short-input',
      layout: 'half',
      placeholder: '2025-06-03T00:00:00.000Z',
      condition: { field: 'operation', value: 'google_tasks_create_task' },
    },
    {
      id: 'task',
      title: 'Task ID',
      type: 'short-input',
      layout: 'full',
      condition: { field: 'operation', value: 'google_tasks_complete_task' },
    },
    {
      id: 'maxResults',
      title: 'Max Results',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: {
        field: 'operation',
        value: ['google_tasks_list_tasklists', 'google_tasks_list_tasks'],
      },
    },
    {
      id: 'showCompleted',
      title: 'Show Completed',
      type: 'short-input',
      layout: 'half',
      placeholder: 'true',
      condition: { field: 'operation', value: 'google_tasks_list_tasks' },
    },
    {
      id: 'accessToken',
      title: 'Google Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'ya29....',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'google_tasks_list_tasklists',
      'google_tasks_list_tasks',
      'google_tasks_create_task',
      'google_tasks_complete_task',
    ],
    config: {
      tool: (params) => params.operation || 'google_tasks_list_tasklists',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'Google OAuth access token' },
    tasklist: { type: 'string', description: 'Task list ID' },
    title: { type: 'string', description: 'Task title' },
    notes: { type: 'string', description: 'Task notes' },
    due: { type: 'string', description: 'Due date (RFC 3339)' },
    task: { type: 'string', description: 'Task ID' },
    maxResults: { type: 'number', description: 'Maximum results to return' },
    showCompleted: { type: 'boolean', description: 'Include completed tasks' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Google Tasks' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
