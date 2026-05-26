import type {
  CrowdStrikeGetSensorDetailsParams,
  CrowdStrikeGetSensorDetailsResponse,
} from '@/tools/crowdstrike/types'
import type { ToolConfig } from '@/tools/types'

export const crowdstrikeGetSensorDetailsTool: ToolConfig<
  CrowdStrikeGetSensorDetailsParams,
  CrowdStrikeGetSensorDetailsResponse
> = {
  id: 'crowdstrike_get_sensor_details',
  name: 'CrowdStrike Get Sensor Details',
  description: 'Get CrowdStrike Identity Protection sensor details for one or more device IDs',
  version: '1.0.0',

  params: {
    clientId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'CrowdStrike Falcon API client ID',
    },
    clientSecret: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'CrowdStrike Falcon API client secret',
    },
    cloud: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'CrowdStrike Falcon cloud region',
    },
    ids: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'JSON array of CrowdStrike sensor device IDs',
    },
  },

  request: {
    url: '/api/tools/crowdstrike/query',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      cloud: params.cloud,
      clientId: params.clientId,
      clientSecret: params.clientSecret,
      ids: params.ids,
      operation: 'crowdstrike_get_sensor_details',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok || data.success === false) {
      throw new Error(data.error || 'Failed to fetch CrowdStrike sensor details')
    }
    return { success: true, output: data.output }
  },

  outputs: {
    sensors: {
      type: 'array',
      description: 'CrowdStrike identity sensor detail records',
      items: { type: 'object', properties: {} },
    },
    count: { type: 'number', description: 'Number of sensors returned' },
    pagination: { type: 'json', description: 'Pagination metadata', optional: true },
  },
}
