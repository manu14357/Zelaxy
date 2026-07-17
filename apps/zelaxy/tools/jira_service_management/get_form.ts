import type {
  JiraSmGetFormParams,
  JiraSmGetFormResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetFormTool: ToolConfig<
  JiraSmGetFormParams,
  JiraSmGetFormResponse
> = {
  id: 'jira_service_management_get_form',
  name: 'Jira Service Management Get Form',
  description: 'Get a single form with full design, state, and answers from a Jira issue',
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
    issueIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Issue ID or key (e.g., "SD-123")',
    },
    formId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Form instance UUID (from Attach Form or Get Issue Forms)',
    },
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/issue/${encodeURIComponent(params.issueIdOrKey)}/form/${encodeURIComponent(params.formId)}`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        formId: params?.formId ?? '',
        design: data.design ?? null,
        state: data.state ?? null,
        updated: data.updated ?? null,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    formId: { type: 'string', description: 'Form instance UUID' },
    design: {
      type: 'json',
      description: 'Full form design with questions, layout, conditions, sections, settings',
      optional: true,
    },
    state: {
      type: 'json',
      description:
        'Form state with answers map, status (o=open, s=submitted, l=locked), visibility (i=internal, e=external)',
      optional: true,
    },
    updated: {
      type: 'string',
      description: 'Last updated timestamp',
      optional: true,
    },
  },
}
