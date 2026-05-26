import { ShieldCheckIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const CrowdStrikeBlock: BlockConfig = {
  type: 'crowdstrike',
  name: 'CrowdStrike',
  description: 'Query sensors and host data in CrowdStrike Falcon',
  longDescription:
    'Integrate CrowdStrike endpoint security into your workflows. Query sensors, retrieve host details, and get aggregate statistics.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E01F3D',
  icon: ShieldCheckIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Query Sensors', id: 'crowdstrike_query_sensors' },
        { label: 'Get Sensor Details', id: 'crowdstrike_get_sensor_details' },
        { label: 'Get Sensor Aggregates', id: 'crowdstrike_get_sensor_aggregates' },
      ],
      required: true,
    },
    {
      id: 'clientId',
      title: 'Client ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Your CrowdStrike client ID',
      required: true,
    },
    {
      id: 'clientSecret',
      title: 'Client Secret',
      type: 'short-input',
      layout: 'half',
      password: true,
      placeholder: 'Your CrowdStrike client secret',
      required: true,
    },
    {
      id: 'cloud',
      title: 'Cloud Region',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'US-1', id: 'us-1' },
        { label: 'US-2', id: 'us-2' },
        { label: 'EU-1', id: 'eu-1' },
        { label: 'US-GOV-1', id: 'us-gov-1' },
      ],
    },
    {
      id: 'filter',
      title: 'FQL Filter',
      type: 'short-input',
      layout: 'half',
      placeholder: 'platform_name:"Windows"',
      condition: { field: 'operation', value: ['crowdstrike_query_sensors'] },
    },
  ],
  tools: {
    access: [
      'crowdstrike_query_sensors',
      'crowdstrike_get_sensor_details',
      'crowdstrike_get_sensor_aggregates',
    ],
    config: {
      tool: (params) => params.operation || 'crowdstrike_query_sensors',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    clientId: { type: 'string', description: 'Client ID' },
    clientSecret: { type: 'string', description: 'Client secret' },
    cloud: { type: 'string', description: 'Cloud region' },
    filter: { type: 'string', description: 'FQL filter' },
  },
  outputs: {
    sensors: { type: 'json', description: 'Sensor list' },
    sensorDetails: { type: 'json', description: 'Sensor details' },
  },
}
