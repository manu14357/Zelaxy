import {
  JIRA_SM_ISSUE_FORM_PROPERTIES,
  type JiraSmGetIssueFormsParams,
  type JiraSmGetIssueFormsResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetIssueFormsTool: ToolConfig<
  JiraSmGetIssueFormsParams,
  JiraSmGetIssueFormsResponse
> = {
  id: 'jira_service_management_get_issue_forms',
  name: 'Jira Service Management Get Issue Forms',
  description:
    'List forms (ProForma/JSM Forms) attached to a Jira issue with metadata (name, submitted status, lock)',
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
      description: 'Issue ID or key (e.g., "SD-123", "10001")',
    },
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/issue/${encodeURIComponent(params.issueIdOrKey)}/form`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    const forms = Array.isArray(data) ? data : (data.values ?? data.forms ?? [])

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        forms: forms.map((form: Record<string, any>) => ({
          id: form.id ?? null,
          name: form.name ?? null,
          updated: form.updated ?? null,
          submitted: form.submitted ?? false,
          lock: form.lock ?? false,
          internal: form.internal ?? null,
          formTemplateId: form.formTemplate?.id ?? null,
        })),
        total: forms.length,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    forms: {
      type: 'array',
      description: 'List of forms attached to the issue',
      items: {
        type: 'object',
        properties: JIRA_SM_ISSUE_FORM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of forms' },
  },
}
