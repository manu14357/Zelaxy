import type {
  JiraSmCreateOrganizationParams,
  JiraSmCreateOrganizationResponse,
} from '@/tools/jira_service_management/types'
import { getJsmApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementCreateOrganizationTool: ToolConfig<
  JiraSmCreateOrganizationParams,
  JiraSmCreateOrganizationResponse
> = {
  id: 'jira_service_management_create_organization',
  name: 'Jira Service Management Create Organization',
  description: 'Create a new organization in Jira Service Management',
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
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the organization to create',
    },
  },

  request: {
    url: (params) => `${getJsmApiBaseUrl(params.cloudId)}/organization`,
    method: 'POST',
    headers: (params) => getJsmHeaders(params.accessToken),
    body: (params) => ({ name: params.name }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        organizationId: data.id,
        name: data.name,
        success: true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    organizationId: { type: 'string', description: 'ID of the created organization' },
    name: { type: 'string', description: 'Name of the created organization' },
    success: { type: 'boolean', description: 'Whether the operation succeeded' },
  },
}
