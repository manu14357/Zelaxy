import { IncidentioIcon } from '@/components/icons/incidentio-icon'
import type { BlockConfig } from '@/blocks/types'
import type { IncidentioResponse } from '@/tools/incidentio/types'

export const IncidentioBlock: BlockConfig<IncidentioResponse> = {
  type: 'incidentio',
  name: 'incident.io',
  description: 'Manage incidents in incident.io',
  longDescription:
    'List and create incidents and retrieve a single incident through the incident.io v2 API. Authenticate with a Bearer API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F25533',
  icon: IncidentioIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List incidents', id: 'incidentio_list_incidents' },
        { label: 'Create incident', id: 'incidentio_create_incident' },
        { label: 'Get incident', id: 'incidentio_get_incident' },
      ],
      value: () => 'incidentio_list_incidents',
    },
    // List incidents
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: { field: 'operation', value: 'incidentio_list_incidents' },
    },
    // Create incident
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Checkout is failing for some users',
      condition: { field: 'operation', value: 'incidentio_create_incident' },
    },
    {
      id: 'idempotencyKey',
      title: 'Idempotency Key',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Optional unique key',
      condition: { field: 'operation', value: 'incidentio_create_incident' },
    },
    // Get incident
    {
      id: 'incidentId',
      title: 'Incident ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '01FCNDV6P870EA6S7TK1DSYDG0',
      condition: { field: 'operation', value: 'incidentio_get_incident' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'incident.io API key',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'incidentio',
      availableTriggers: ['incidentio_webhook'],
    },
  ],
  tools: {
    access: ['incidentio_list_incidents', 'incidentio_create_incident', 'incidentio_get_incident'],
    config: {
      tool: (params) => params.operation || 'incidentio_list_incidents',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'incident.io API key' },
    pageSize: { type: 'number', description: 'Results per page' },
    name: { type: 'string', description: 'Incident name' },
    idempotencyKey: { type: 'string', description: 'Idempotency key' },
    incidentId: { type: 'string', description: 'Incident ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from incident.io' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'incident.io event type (trigger events)' },
    incident_id: { type: 'string', description: 'Incident ID' },
    incident_name: { type: 'string', description: 'Incident name' },
    severity: { type: 'string', description: 'Incident severity' },
  },
  triggers: {
    enabled: true,
    available: ['incidentio_webhook'],
  },
}
