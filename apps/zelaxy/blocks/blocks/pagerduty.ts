import { PagerDutyIcon } from '@/components/icons/pagerduty-icon'
import type { BlockConfig } from '@/blocks/types'
import type { PagerDutyResponse } from '@/tools/pagerduty/types'

export const PagerDutyBlock: BlockConfig<PagerDutyResponse> = {
  type: 'pagerduty',
  name: 'PagerDuty',
  description: 'Manage incidents and services in PagerDuty',
  longDescription:
    'List and create incidents, retrieve a single incident, and list services through the PagerDuty REST API. Authenticate with a REST API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#06AC38',
  icon: PagerDutyIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List incidents', id: 'pagerduty_list_incidents' },
        { label: 'Create incident', id: 'pagerduty_create_incident' },
        { label: 'Get incident', id: 'pagerduty_get_incident' },
        { label: 'List services', id: 'pagerduty_list_services' },
      ],
      value: () => 'pagerduty_list_incidents',
    },
    // List incidents
    {
      id: 'statuses',
      title: 'Statuses',
      type: 'short-input',
      layout: 'half',
      placeholder: 'triggered,acknowledged',
      condition: { field: 'operation', value: 'pagerduty_list_incidents' },
    },
    // Create incident
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Database connection failures',
      condition: { field: 'operation', value: 'pagerduty_create_incident' },
    },
    {
      id: 'serviceId',
      title: 'Service ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'PXXXXXX',
      condition: { field: 'operation', value: 'pagerduty_create_incident' },
    },
    {
      id: 'email',
      title: 'From Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'you@example.com',
      condition: { field: 'operation', value: 'pagerduty_create_incident' },
    },
    // Get incident
    {
      id: 'incidentId',
      title: 'Incident ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'PXXXXXX',
      condition: { field: 'operation', value: 'pagerduty_get_incident' },
    },
    // List limit
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: {
        field: 'operation',
        value: ['pagerduty_list_incidents', 'pagerduty_list_services'],
      },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'PagerDuty REST API key',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'pagerduty',
      availableTriggers: ['pagerduty_webhook'],
    },
  ],
  tools: {
    access: [
      'pagerduty_list_incidents',
      'pagerduty_create_incident',
      'pagerduty_get_incident',
      'pagerduty_list_services',
    ],
    config: {
      tool: (params) => params.operation || 'pagerduty_list_incidents',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'PagerDuty REST API key' },
    statuses: { type: 'string', description: 'Comma-separated statuses filter' },
    title: { type: 'string', description: 'Incident title' },
    serviceId: { type: 'string', description: 'Service ID' },
    email: { type: 'string', description: 'From email for incident creation' },
    incidentId: { type: 'string', description: 'Incident ID' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from PagerDuty' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'PagerDuty event type (trigger events)' },
    incident_id: { type: 'string', description: 'Incident ID' },
    title: { type: 'string', description: 'Incident title' },
    status: { type: 'string', description: 'Incident status' },
  },
  triggers: {
    enabled: true,
    available: ['pagerduty_webhook'],
  },
}
