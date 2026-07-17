import type {
  JiraSmSaveFormAnswersParams,
  JiraSmSaveFormAnswersResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementSaveFormAnswersTool: ToolConfig<
  JiraSmSaveFormAnswersParams,
  JiraSmSaveFormAnswersResponse
> = {
  id: 'jira_service_management_save_form_answers',
  name: 'Jira Service Management Save Form Answers',
  description: 'Save answers to a form attached to a Jira issue or JSM request',
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
    answers: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Form answers using numeric question IDs as keys (e.g., {"1": {"text": "Title"}, "4": {"choices": ["5"]}})',
    },
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/issue/${encodeURIComponent(params.issueIdOrKey)}/form/${encodeURIComponent(params.formId)}`,
    method: 'PUT',
    headers: (params) => getJsmHeaders(params.accessToken),
    body: (params) => ({ answers: params.answers }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        formId: params?.formId ?? '',
        state: data.state ?? null,
        updated: data.updated ?? null,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    formId: { type: 'string', description: 'Form instance UUID' },
    state: {
      type: 'json',
      description: 'Form state with status (open, submitted, locked)',
      optional: true,
    },
    updated: { type: 'string', description: 'Last updated timestamp', optional: true },
  },
}
