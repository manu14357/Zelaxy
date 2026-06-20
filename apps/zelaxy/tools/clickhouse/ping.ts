import type { ClickhousePingParams, ClickhousePingResponse } from '@/tools/clickhouse/types'
import type { ToolConfig } from '@/tools/types'

export const pingTool: ToolConfig<ClickhousePingParams, ClickhousePingResponse> = {
  id: 'clickhouse_ping',
  name: 'ClickHouse Ping',
  description: 'Check whether a ClickHouse instance is reachable',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description:
        'Full base URL of the ClickHouse instance, e.g. https://xxx.clickhouse.cloud:8443',
    },
    username: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ClickHouse username',
    },
    password: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ClickHouse password',
    },
  },

  request: {
    url: (params) => `${params.host}/ping`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.username}:${params.password}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const text = await response.text()
    return {
      success: true,
      output: {
        data: { response: text },
        metadata: { ok: response.ok },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The raw ping response text' },
    metadata: {
      type: 'json',
      description: 'Ping metadata',
      properties: {
        ok: { type: 'boolean', description: 'Whether the instance responded successfully' },
      },
    },
  },
}
