import { VercelIcon } from '@/components/icons/vercel-icon'
import type { BlockConfig } from '@/blocks/types'
import type { VercelResponse } from '@/tools/vercel/types'

export const VercelBlock: BlockConfig<VercelResponse> = {
  type: 'vercel',
  name: 'Vercel',
  description: 'Manage Vercel projects and deployments',
  longDescription:
    'List projects and deployments, fetch deployment details, and create new deployments through the Vercel API. Authenticate with a Vercel access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#000000',
  icon: VercelIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List projects', id: 'vercel_list_projects' },
        { label: 'List deployments', id: 'vercel_list_deployments' },
        { label: 'Get deployment', id: 'vercel_get_deployment' },
        { label: 'Create deployment', id: 'vercel_create_deployment' },
      ],
      value: () => 'vercel_list_projects',
    },
    // List projects
    {
      id: 'search',
      title: 'Search',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-app',
      condition: { field: 'operation', value: 'vercel_list_projects' },
    },
    // List deployments
    {
      id: 'projectId',
      title: 'Project ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'prj_...',
      condition: { field: 'operation', value: 'vercel_list_deployments' },
    },
    {
      id: 'state',
      title: 'State',
      type: 'short-input',
      layout: 'half',
      placeholder: 'READY',
      condition: { field: 'operation', value: 'vercel_list_deployments' },
    },
    // Get deployment
    {
      id: 'deploymentId',
      title: 'Deployment ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'dpl_... or deployment URL',
      condition: { field: 'operation', value: 'vercel_get_deployment' },
    },
    // Create deployment
    {
      id: 'name',
      title: 'Project Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-app',
      condition: { field: 'operation', value: 'vercel_create_deployment' },
    },
    {
      id: 'project',
      title: 'Project ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'prj_...',
      condition: { field: 'operation', value: 'vercel_create_deployment' },
    },
    {
      id: 'gitSource',
      title: 'Git Source',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"type":"github","repo":"owner/repo","ref":"main"}',
      condition: { field: 'operation', value: 'vercel_create_deployment' },
    },
    {
      id: 'target',
      title: 'Target',
      type: 'short-input',
      layout: 'half',
      placeholder: 'production',
      condition: {
        field: 'operation',
        value: ['vercel_list_deployments', 'vercel_create_deployment'],
      },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: {
        field: 'operation',
        value: ['vercel_list_projects', 'vercel_list_deployments'],
      },
    },
    {
      id: 'teamId',
      title: 'Team ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'team_...',
    },
    {
      id: 'apiKey',
      title: 'Vercel Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Vercel access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'vercel_list_projects',
      'vercel_list_deployments',
      'vercel_get_deployment',
      'vercel_create_deployment',
    ],
    config: {
      tool: (params) => params.operation || 'vercel_list_projects',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Vercel access token' },
    search: { type: 'string', description: 'Project name search' },
    projectId: { type: 'string', description: 'Project ID filter' },
    state: { type: 'string', description: 'Deployment state filter' },
    deploymentId: { type: 'string', description: 'Deployment ID or URL' },
    name: { type: 'string', description: 'Project name' },
    project: { type: 'string', description: 'Project ID' },
    gitSource: { type: 'json', description: 'Git source object' },
    target: { type: 'string', description: 'Target environment' },
    teamId: { type: 'string', description: 'Team ID' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Vercel' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
