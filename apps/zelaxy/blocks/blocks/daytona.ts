import { DaytonaIcon } from '@/components/icons/daytona-icon'
import type { BlockConfig } from '@/blocks/types'
import type { DaytonaResponse } from '@/tools/daytona/types'

export const DaytonaBlock: BlockConfig<DaytonaResponse> = {
  type: 'daytona',
  name: 'Daytona',
  description: 'Manage Daytona workspaces',
  longDescription:
    'List workspaces, fetch workspace details, and create new workspaces through the Daytona API. Authenticate with a Daytona API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1F6FEB',
  icon: DaytonaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List workspaces', id: 'daytona_list_workspaces' },
        { label: 'Get workspace', id: 'daytona_get_workspace' },
        { label: 'Create workspace', id: 'daytona_create_workspace' },
      ],
      value: () => 'daytona_list_workspaces',
    },
    // Get workspace
    {
      id: 'workspaceId',
      title: 'Workspace ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Workspace ID',
      condition: { field: 'operation', value: 'daytona_get_workspace' },
    },
    // Create workspace
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-workspace',
      condition: { field: 'operation', value: 'daytona_create_workspace' },
    },
    {
      id: 'target',
      title: 'Target Region',
      type: 'short-input',
      layout: 'half',
      placeholder: 'us',
      condition: { field: 'operation', value: 'daytona_create_workspace' },
    },
    // List workspaces
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: { field: 'operation', value: 'daytona_list_workspaces' },
    },
    {
      id: 'apiKey',
      title: 'Daytona API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Daytona API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['daytona_list_workspaces', 'daytona_get_workspace', 'daytona_create_workspace'],
    config: {
      tool: (params) => params.operation || 'daytona_list_workspaces',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Daytona API key' },
    workspaceId: { type: 'string', description: 'Workspace ID' },
    name: { type: 'string', description: 'Workspace name' },
    target: { type: 'string', description: 'Target region' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Daytona' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
