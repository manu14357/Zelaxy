import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  encodePayloads,
  newRequestId,
  parseMaybeJson,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalCreateScheduleTool: ToolConfig = {
  id: 'temporal_create_schedule',
  name: 'Temporal Create Schedule',
  description: 'Create a Temporal schedule that periodically starts a workflow.',
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
    scheduleId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Unique identifier for the schedule',
    },
    schedule: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Full Schedule object as JSON. If provided, the convenience params below are ignored.',
    },
    cronExpression: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Cron expression for the schedule spec (e.g., "0 12 * * *")',
    },
    workflowId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Workflow ID to start on each scheduled action',
    },
    workflowType: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Registered workflow type / name to start',
    },
    taskQueue: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Task queue the workflow should run on',
    },
    input: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Workflow arguments as JSON (array for positional args)',
    },
    paused: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether the schedule should start paused',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/schedules/${encodeURIComponent(
          params.scheduleId
        )}`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => {
      let schedule = parseMaybeJson(params.schedule)
      if (!schedule || typeof schedule !== 'object') {
        const startWorkflow: Record<string, any> = {
          workflowId: params.workflowId,
          workflowType: { name: params.workflowType },
          taskQueue: { name: params.taskQueue },
        }
        const input = encodePayloads(params.input)
        if (input) startWorkflow.input = input
        schedule = {
          spec: params.cronExpression ? { cronString: [params.cronExpression] } : {},
          action: { startWorkflow },
          state: { paused: Boolean(params.paused) },
        }
      }
      return {
        scheduleId: params.scheduleId,
        schedule,
        requestId: newRequestId(),
      }
    },
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    return {
      success: true,
      output: {
        created: true,
        scheduleId: params?.scheduleId ?? '',
        conflictToken: data?.conflictToken ?? null,
      },
    }
  },

  outputs: {
    created: { type: 'boolean', description: 'Whether the schedule was created' },
    scheduleId: { type: 'string', description: 'ID of the created schedule' },
    conflictToken: { type: 'string', description: 'Optimistic-concurrency conflict token' },
  },
}
