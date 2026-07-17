import {
  JIRA_SM_FORM_TEMPLATE_PROPERTIES,
  type JiraSmGetFormTemplatesParams,
  type JiraSmGetFormTemplatesResponse,
} from '@/tools/jira_service_management/types'
import { getJsmFormsApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetFormTemplatesTool: ToolConfig<
  JiraSmGetFormTemplatesParams,
  JiraSmGetFormTemplatesResponse
> = {
  id: 'jira_service_management_get_form_templates',
  name: 'Jira Service Management Get Form Templates',
  description:
    'List forms (ProForma/JSM Forms) in a Jira project to discover form IDs for request types',
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
  },

  request: {
    url: (params) =>
      `${getJsmFormsApiBaseUrl(params.cloudId)}/project/${encodeURIComponent(params.projectIdOrKey)}/form`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    const templates = Array.isArray(data) ? data : (data.values ?? [])

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        projectIdOrKey: params?.projectIdOrKey ?? '',
        templates: templates.map((template: Record<string, any>) => ({
          id: template.id ?? null,
          name: template.name ?? null,
          updated: template.updated ?? null,
          issueCreateIssueTypeIds: template.issueCreateIssueTypeIds ?? [],
          issueCreateRequestTypeIds: template.issueCreateRequestTypeIds ?? [],
          portalRequestTypeIds: template.portalRequestTypeIds ?? [],
          recommendedIssueRequestTypeIds: template.recommendedIssueRequestTypeIds ?? [],
        })),
        total: templates.length,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    projectIdOrKey: { type: 'string', description: 'Project ID or key' },
    templates: {
      type: 'array',
      description: 'List of forms in the project',
      items: {
        type: 'object',
        properties: JIRA_SM_FORM_TEMPLATE_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of forms' },
  },
}
