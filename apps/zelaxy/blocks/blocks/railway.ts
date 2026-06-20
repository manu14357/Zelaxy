import { RailwayIcon } from '@/components/icons/railway-icon'
import type { BlockConfig } from '@/blocks/types'
import type { RailwayResponse } from '@/tools/railway/types'

export const RailwayBlock: BlockConfig<RailwayResponse> = {
  type: 'railway',
  name: 'Railway',
  description: 'Manage Railway projects and deployments',
  longDescription:
    'List projects, fetch project details with services and environments, and list deployments through the Railway GraphQL API. Authenticate with a Railway API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0B0D0E',
  icon: RailwayIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List projects', id: 'railway_list_projects' },
        { label: 'Get project', id: 'railway_get_project' },
        { label: 'List deployments', id: 'railway_list_deployments' },
      ],
      value: () => 'railway_list_projects',
    },
    // Get project / List deployments
    {
      id: 'projectId',
      title: 'Project ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Railway project ID',
      condition: {
        field: 'operation',
        value: ['railway_get_project', 'railway_list_deployments'],
      },
    },
    // List deployments
    {
      id: 'serviceId',
      title: 'Service ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Railway service ID',
      condition: { field: 'operation', value: 'railway_list_deployments' },
    },
    {
      id: 'environmentId',
      title: 'Environment ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Railway environment ID',
      condition: { field: 'operation', value: 'railway_list_deployments' },
    },
    {
      id: 'first',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: {
        field: 'operation',
        value: ['railway_list_projects', 'railway_list_deployments'],
      },
    },
    {
      id: 'apiKey',
      title: 'Railway API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Railway API token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['railway_list_projects', 'railway_get_project', 'railway_list_deployments'],
    config: {
      tool: (params) => params.operation || 'railway_list_projects',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Railway API token' },
    projectId: { type: 'string', description: 'Project ID' },
    serviceId: { type: 'string', description: 'Service ID' },
    environmentId: { type: 'string', description: 'Environment ID' },
    first: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Railway' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
