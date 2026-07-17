import type {
  JiraSmSubmitFormParams,
  JiraSmSubmitFormResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementSubmitFormTool: ToolConfig<
  JiraSmSubmitFormParams,
  JiraSmSubmitFormResponse
> = {
  id: 'jira_service_management_submit_form',
  name: 'Jira Service Management Submit Form',
  description: 'Submit a form on a Jira issue or JSM request, locking it from further edits',
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
      `${getJsmFormsApiBaseUrl(params.cloudId)}/issue/${encodeURIComponent(params.issueIdOrKey)}/form/${encodeURIComponent(params.formId)}/action/submit`,
    method: 'PUT',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response, params) => {
    // The action endpoints answer 204 with an empty body on success.
    const responseText = await response.text()
    const data = responseText ? JSON.parse(responseText) : {}

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        formId: params?.formId ?? '',
        status: data.status ?? 'submitted',
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    formId: { type: 'string', description: 'Form instance UUID' },
    status: {
      type: 'string',
      description: 'Form status after submission (open, submitted, locked)',
    },
  },
}
