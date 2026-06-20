import { WorkdayIcon } from '@/components/icons/workday-icon'
import type { BlockConfig } from '@/blocks/types'
import type { WorkdayResponse } from '@/tools/workday/types'

export const WorkdayBlock: BlockConfig<WorkdayResponse> = {
  type: 'workday',
  name: 'Workday',
  description: 'Retrieve worker data from Workday',
  longDescription:
    'List workers and retrieve a single worker by ID through the Workday Staffing REST API. Authenticate with your tenant API base URL and an OAuth bearer access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F58220',
  icon: WorkdayIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get workers', id: 'workday_get_workers' },
        { label: 'Get worker', id: 'workday_get_worker' },
      ],
      value: () => 'workday_get_workers',
    },
    {
      id: 'workerId',
      title: 'Worker ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '3aa5550b7fe348b98d7b5741afc65534',
      condition: { field: 'operation', value: 'workday_get_worker' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: { field: 'operation', value: 'workday_get_workers' },
    },
    {
      id: 'offset',
      title: 'Offset',
      type: 'short-input',
      layout: 'half',
      placeholder: '0',
      condition: { field: 'operation', value: 'workday_get_workers' },
    },
    {
      id: 'tenantUrl',
      title: 'Tenant API URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://wd5-impl-services1.workday.com/ccx/api/staffing/v6/your_tenant',
      required: true,
    },
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['workday_get_workers', 'workday_get_worker'],
    config: {
      tool: (params) => params.operation || 'workday_get_workers',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    tenantUrl: { type: 'string', description: 'Workday tenant API base URL' },
    accessToken: { type: 'string', description: 'Workday OAuth bearer token' },
    workerId: { type: 'string', description: 'Worker ID' },
    limit: { type: 'number', description: 'Result limit' },
    offset: { type: 'number', description: 'Pagination offset' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Workday' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
