import type {
  JiraSmGetFormStructureParams,
  JiraSmGetFormStructureResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetFormStructureTool: ToolConfig<
  JiraSmGetFormStructureParams,
  JiraSmGetFormStructureResponse
> = {
  id: 'jira_service_management_get_form_structure',
  name: 'Jira Service Management Get Form Structure',
  description:
    'Get the full structure of a ProForma/JSM form including all questions, field types, choices, layout, and conditions',
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
    projectIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Jira project ID or key (e.g., "10001" or "SD")',
    },
    formId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Form ID (UUID from Get Form Templates)',
    },
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/project/${encodeURIComponent(params.projectIdOrKey)}/form/${encodeURIComponent(params.formId)}`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        projectIdOrKey: params?.projectIdOrKey ?? '',
        formId: params?.formId ?? '',
        design: data.design ?? null,
        updated: data.updated ?? null,
        publish: data.publish ?? null,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    projectIdOrKey: { type: 'string', description: 'Project ID or key' },
    formId: { type: 'string', description: 'Form ID' },
    design: {
      type: 'json',
      description:
        'Full form design with questions (field types, labels, choices, validation), layout (field ordering), and conditions',
    },
    updated: { type: 'string', description: 'Last updated timestamp', optional: true },
    publish: {
      type: 'json',
      description: 'Publishing and request type configuration',
      optional: true,
    },
  },
}
