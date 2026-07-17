import type {
  JiraSmCopyFormsParams,
  JiraSmCopyFormsResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementCopyFormsTool: ToolConfig<
  JiraSmCopyFormsParams,
  JiraSmCopyFormsResponse
> = {
  id: 'jira_service_management_copy_forms',
  name: 'Jira Service Management Copy Forms',
  description: 'Copy forms from one Jira issue to another',
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
    sourceIssueIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Source issue ID or key to copy forms from (e.g., "SD-123")',
    },
    targetIssueIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Target issue ID or key to copy forms to (e.g., "SD-456")',
    },
    formIds: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Optional JSON array of form UUIDs to copy (e.g., ["uuid1", "uuid2"]). If omitted, copies all forms.',
    },
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/issue/${encodeURIComponent(params.sourceIssueIdOrKey)}/form/copy/${encodeURIComponent(params.targetIssueIdOrKey)}`,
    method: 'POST',
    headers: (params) => getJsmHeaders(params.accessToken),
    // An empty body copies every form on the source issue; `ids` narrows it to a subset.
    body: (params) =>
      Array.isArray(params.formIds) && params.formIds.length > 0 ? { ids: params.formIds } : {},
  },

  transformResponse: async (response, params) => {
    const data = await response.json()

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        sourceIssueIdOrKey: params?.sourceIssueIdOrKey ?? '',
        targetIssueIdOrKey: params?.targetIssueIdOrKey ?? '',
        copiedForms: data.copiedForms ?? [],
        errors: data.errors ?? [],
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    sourceIssueIdOrKey: { type: 'string', description: 'Source issue ID or key' },
    targetIssueIdOrKey: { type: 'string', description: 'Target issue ID or key' },
    copiedForms: { type: 'json', description: 'Array of successfully copied forms' },
    errors: { type: 'json', description: 'Array of errors encountered during copy' },
  },
}
