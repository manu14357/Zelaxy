import type {
  JiraSmAttachFormParams,
  JiraSmAttachFormResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementAttachFormTool: ToolConfig<
  JiraSmAttachFormParams,
  JiraSmAttachFormResponse
> = {
  id: 'jira_service_management_attach_form',
  name: 'Jira Service Management Attach Form',
  description: 'Attach a form template to an existing Jira issue or JSM request',
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
      description: 'Issue ID or key to attach the form to (e.g., "SD-123")',
    },
    formTemplateId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Form template UUID (from Get Form Templates)',
    },
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/issue/${encodeURIComponent(params.issueIdOrKey)}/form`,
    method: 'POST',
    headers: (params) => getJsmHeaders(params.accessToken),
    body: (params) => ({ formTemplate: { id: params.formTemplateId } }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        id: data.id ?? null,
        name: data.name ?? null,
        updated: data.updated ?? null,
        submitted: data.submitted ?? false,
        lock: data.lock ?? false,
        internal: data.internal ?? null,
        formTemplateId: data.formTemplate?.id ?? null,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    id: { type: 'string', description: 'Attached form instance ID (UUID)' },
    name: { type: 'string', description: 'Form name' },
    updated: { type: 'string', description: 'Last updated timestamp', optional: true },
    submitted: { type: 'boolean', description: 'Whether the form has been submitted' },
    lock: { type: 'boolean', description: 'Whether the form is locked' },
    internal: { type: 'boolean', description: 'Whether the form is internal only', optional: true },
    formTemplateId: {
      type: 'string',
      description: 'Form template ID',
      optional: true,
    },
  },
}
