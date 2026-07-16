import { GreenhouseIcon } from '@/components/icons/greenhouse-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GreenhouseResponse } from '@/tools/greenhouse/types'

export const GreenhouseBlock: BlockConfig<GreenhouseResponse> = {
  type: 'greenhouse',
  name: 'Greenhouse',
  description: 'Manage candidates, jobs, and applications in Greenhouse',
  longDescription:
    'List candidates, jobs, and applications, and fetch candidate details through the Greenhouse Harvest API. Authenticate with a Greenhouse Harvest API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#24A47C',
  icon: GreenhouseIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List candidates', id: 'greenhouse_list_candidates' },
        { label: 'Get candidate', id: 'greenhouse_get_candidate' },
        { label: 'List jobs', id: 'greenhouse_list_jobs' },
        { label: 'List applications', id: 'greenhouse_list_applications' },
      ],
      value: () => 'greenhouse_list_candidates',
    },
    // Get candidate
    {
      id: 'id',
      title: 'Candidate ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '123456',
      condition: { field: 'operation', value: 'greenhouse_get_candidate' },
    },
    // List candidates
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'candidate@example.com',
      condition: { field: 'operation', value: 'greenhouse_list_candidates' },
    },
    // Shared job_id (candidates + applications)
    {
      id: 'job_id',
      title: 'Job ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '654321',
      condition: {
        field: 'operation',
        value: ['greenhouse_list_candidates', 'greenhouse_list_applications'],
      },
    },
    // Shared status (jobs + applications)
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'active',
      condition: {
        field: 'operation',
        value: ['greenhouse_list_jobs', 'greenhouse_list_applications'],
      },
    },
    // Shared pagination (all list ops)
    {
      id: 'per_page',
      title: 'Per Page',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: {
        field: 'operation',
        value: [
          'greenhouse_list_candidates',
          'greenhouse_list_jobs',
          'greenhouse_list_applications',
        ],
      },
    },
    {
      id: 'page',
      title: 'Page',
      type: 'short-input',
      layout: 'half',
      placeholder: '1',
      condition: {
        field: 'operation',
        value: [
          'greenhouse_list_candidates',
          'greenhouse_list_jobs',
          'greenhouse_list_applications',
        ],
      },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Greenhouse Harvest API key',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'greenhouse',
      availableTriggers: ['greenhouse_webhook'],
    },
  ],
  tools: {
    access: [
      'greenhouse_list_candidates',
      'greenhouse_get_candidate',
      'greenhouse_list_jobs',
      'greenhouse_list_applications',
    ],
    config: {
      tool: (params) => params.operation || 'greenhouse_list_candidates',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Greenhouse Harvest API key' },
    id: { type: 'string', description: 'Candidate ID' },
    email: { type: 'string', description: 'Candidate email' },
    job_id: { type: 'string', description: 'Job ID filter' },
    status: { type: 'string', description: 'Status filter' },
    per_page: { type: 'number', description: 'Results per page' },
    page: { type: 'number', description: 'Page number' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Greenhouse' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'Greenhouse event type (trigger events)' },
    candidate_name: { type: 'string', description: 'Candidate full name' },
    candidate_email: { type: 'string', description: 'Candidate email' },
    stage: { type: 'string', description: 'Current stage' },
  },
  triggers: {
    enabled: true,
    available: ['greenhouse_webhook'],
  },
}
