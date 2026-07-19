import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  decodePayloads,
  encodePayloads,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalQueryWorkflowTool: ToolConfig = {
  id: 'temporal_query_workflow',
  name: 'Temporal Query Workflow',
  description: 'Run a synchronous query against a Temporal workflow execution.',
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
      description: 'Temporal namespace',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Temporal API key (Bearer token)',
    },
    workflowId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Workflow ID to query',
    },
    runId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional run ID to target a specific run',
    },
    queryType: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the registered query handler',
    },
    input: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Query arguments as JSON (array for positional args)',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}/query/${encodeURIComponent(params.queryType)}`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => {
      const body: Record<string, any> = {
        execution: {
          workflowId: params.workflowId,
          ...(params.runId ? { runId: params.runId } : {}),
        },
        query: { queryType: params.queryType },
      }
      const args = encodePayloads(params.input)
      if (args) body.query.queryArgs = args
      return body
    },
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    const decoded = decodePayloads(data?.queryResult)
    return {
      success: true,
      output: {
        result: decoded.length === 1 ? decoded[0] : decoded,
        queryRejected: data?.queryRejected ?? null,
      },
    }
  },

  outputs: {
    result: { type: 'json', description: 'Decoded query result' },
    queryRejected: { type: 'json', description: 'Rejection info if the query was rejected' },
  },
}
