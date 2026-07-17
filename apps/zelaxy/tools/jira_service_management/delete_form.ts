import type {
  JiraSmDeleteFormParams,
  JiraSmDeleteFormResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementDeleteFormTool: ToolConfig<
  JiraSmDeleteFormParams,
  JiraSmDeleteFormResponse
> = {
  id: 'jira_service_management_delete_form',
  name: 'Jira Service Management Delete Form',
  description: 'Remove a form from a Jira issue or JSM request',
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
      description: 'Form instance UUID to delete',
    },
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/issue/${encodeURIComponent(params.issueIdOrKey)}/form/${encodeURIComponent(params.formId)}`,
    method: 'DELETE',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response, params) => {
    // DELETE answers 204 with an empty body; drain it rather than parsing.
    await response.text()

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        formId: params?.formId ?? '',
        deleted: true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    formId: { type: 'string', description: 'Deleted form instance UUID' },
    deleted: { type: 'boolean', description: 'Whether the form was successfully deleted' },
  },
}
