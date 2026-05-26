import { WorkIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AsanaBlock: BlockConfig = {
  type: 'asana',
  name: 'Asana',
  description: 'Manage tasks, projects, and comments in Asana',
  longDescription:
    'Integrate Asana project management into your workflows. Create, update, and retrieve tasks, manage projects, and add comments.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E0E0E0',
  icon: WorkIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get Task', id: 'asana_get_task' },
        { label: 'Create Task', id: 'asana_create_task' },
        { label: 'Update Task', id: 'asana_update_task' },
        { label: 'Delete Task', id: 'asana_delete_task' },
        { label: 'Get Projects', id: 'asana_get_projects' },
        { label: 'Search Tasks', id: 'asana_search_tasks' },
        { label: 'Add Comment', id: 'asana_add_comment' },
      ],
      required: true,
    },
    {
      id: 'credential',
      title: 'Asana Account',
      type: 'oauth-input',
      layout: 'full',
      provider: 'asana',
    },
    {
      id: 'taskGid',
      title: 'Task GID',
      type: 'short-input',
      layout: 'full',
      placeholder: '1234567890',
      condition: {
        field: 'operation',
        value: ['asana_get_task', 'asana_update_task', 'asana_delete_task', 'asana_add_comment'],
      },
    },
    {
      id: 'projectGid',
      title: 'Project GID',
      type: 'short-input',
      layout: 'full',
      placeholder: '1234567890',
      condition: { field: 'operation', value: ['asana_create_task', 'asana_search_tasks'] },
    },
    {
      id: 'taskName',
      title: 'Task Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'New task',
      condition: { field: 'operation', value: ['asana_create_task', 'asana_update_task'] },
    },
    {
      id: 'notes',
      title: 'Notes',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Task description',
      condition: {
        field: 'operation',
        value: ['asana_create_task', 'asana_update_task', 'asana_add_comment'],
      },
    },
    {
      id: 'query',
      title: 'Search Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'task name or keyword',
      condition: { field: 'operation', value: ['asana_search_tasks'] },
    },
  ],
  tools: {
    access: [
      'asana_get_task',
      'asana_create_task',
      'asana_update_task',
      'asana_delete_task',
      'asana_get_projects',
      'asana_search_tasks',
      'asana_add_comment',
    ],
    config: {
      tool: (params) => params.operation || 'asana_get_task',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    oauthCredential: { type: 'string', description: 'OAuth credential' },
    taskGid: { type: 'string', description: 'Task GID' },
    projectGid: { type: 'string', description: 'Project GID' },
    taskName: { type: 'string', description: 'Task name' },
    notes: { type: 'string', description: 'Task notes' },
    query: { type: 'string', description: 'Search query' },
  },
  outputs: {
    task: { type: 'json', description: 'Task data' },
    tasks: { type: 'json', description: 'Task list' },
    comment: { type: 'json', description: 'Comment data' },
  },
}
