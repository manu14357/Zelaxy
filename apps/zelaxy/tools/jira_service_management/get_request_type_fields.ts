import {
  JSM_REQUEST_TYPE_FIELD_PROPERTIES,
  type JsmGetRequestTypeFieldsParams,
  type JsmGetRequestTypeFieldsResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetRequestTypeFieldsTool: ToolConfig<
  JsmGetRequestTypeFieldsParams,
  JsmGetRequestTypeFieldsResponse
> = {
  id: 'jira_service_management_get_request_type_fields',
  name: 'Jira Service Management Get Request Type Fields',
  description:
    'Get the fields required to create a request of a specific type in Jira Service Management',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'jira',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Jira Service Management',
    },
    cloudId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Jira Cloud ID for the instance',
    },
    serviceDeskId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Service Desk ID (e.g., "1", "2")',
    },
    requestTypeId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Request Type ID (e.g., "10", "15")',
    },
  },

  request: {
    url: (params) =>
      `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/servicedesk/${encodeURIComponent(params.serviceDeskId)}/requesttype/${encodeURIComponent(params.requestTypeId)}/field`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-ExperimentalApi': 'opt-in',
    }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        serviceDeskId: params?.serviceDeskId ?? '',
        requestTypeId: params?.requestTypeId ?? '',
        canAddRequestParticipants: data.canAddRequestParticipants ?? false,
        canRaiseOnBehalfOf: data.canRaiseOnBehalfOf ?? false,
        requestTypeFields: (data.requestTypeFields ?? []).map((field: Record<string, unknown>) => ({
          fieldId: field.fieldId ?? null,
          name: field.name ?? null,
          description: field.description ?? null,
          required: field.required ?? false,
          visible: field.visible ?? true,
          validValues: field.validValues ?? [],
          presetValues: field.presetValues ?? [],
          defaultValues: field.defaultValues ?? [],
          jiraSchema: field.jiraSchema ?? null,
        })),
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    serviceDeskId: { type: 'string', description: 'Service desk ID' },
    requestTypeId: { type: 'string', description: 'Request type ID' },
    canAddRequestParticipants: {
      type: 'boolean',
      description: 'Whether participants can be added to requests of this type',
    },
    canRaiseOnBehalfOf: {
      type: 'boolean',
      description: 'Whether requests can be raised on behalf of another user',
    },
    requestTypeFields: {
      type: 'array',
      description: 'List of fields for this request type',
      items: {
        type: 'object',
        properties: JSM_REQUEST_TYPE_FIELD_PROPERTIES,
      },
    },
  },
}
