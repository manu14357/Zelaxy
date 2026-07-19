import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalDescribeNamespaceTool: ToolConfig = {
  id: 'temporal_describe_namespace',
  name: 'Temporal Describe Namespace',
  description: 'Fetch configuration and status for a Temporal namespace.',
  version: '1.0.0',

  params: {
    serverUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Temporal server base URL',
    },
    namespace: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Temporal namespace to describe',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Temporal API key (Bearer token)',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(params.serverUrl, `/namespaces/${encodeURIComponent(params.namespace)}`),
    method: 'GET',
    headers: (params) => buildTemporalHeaders(params),
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    return {
      success: true,
      output: {
        namespaceInfo: data?.namespaceInfo ?? null,
        config: data?.config ?? null,
        replicationConfig: data?.replicationConfig ?? null,
        isGlobalNamespace: data?.isGlobalNamespace ?? false,
      },
    }
  },

  outputs: {
    namespaceInfo: { type: 'json', description: 'Namespace name, state, description, owner' },
    config: { type: 'json', description: 'Namespace configuration (retention, etc.)' },
    replicationConfig: { type: 'json', description: 'Multi-cluster replication config' },
    isGlobalNamespace: { type: 'boolean', description: 'Whether the namespace is global' },
  },
}
