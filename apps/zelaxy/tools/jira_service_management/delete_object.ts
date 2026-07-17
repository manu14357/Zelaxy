import type {
  JiraSmDeleteObjectParams,
  JiraSmDeleteObjectResponse,
} from '@/tools/jira_service_management/types'
import { executeAssetsRequest } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementDeleteObjectTool: ToolConfig<
  JiraSmDeleteObjectParams,
  JiraSmDeleteObjectResponse
> = {
  id: 'jira_service_management_delete_object',
  name: 'Jira Service Management Delete Asset Object',
  description: 'Delete an Assets (Insight/CMDB) object by ID',
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
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Your Jira domain (e.g., yourcompany.atlassian.net)',
    },
    cloudId: {
      type: 'string',
      required: false,
      visibility: 'hidden',
      description: 'Jira Cloud ID for the instance (resolved from the domain when omitted)',
    },
    workspaceId: {
      type: 'string',
      required: false,
      visibility: 'hidden',
      description: 'Assets workspace ID (resolved automatically when omitted)',
    },
    objectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Assets object ID to delete',
    },
  },

  // Assets tools resolve their cloudId/workspaceId asynchronously, so they run through
  // directExecution; this request config is an unused placeholder.
  request: {
    url: 'https://api.atlassian.com',
    method: 'DELETE',
    headers: () => ({}),
  },

  directExecution: async (params) => {
    const objectId = params.objectId.trim()

    const result = await executeAssetsRequest(params, (baseUrl) => ({
      url: `${baseUrl}/object/${encodeURIComponent(objectId)}`,
      method: 'DELETE',
    }))

    if (!result.ok) {
      return {
        success: false,
        output: { ts: new Date().toISOString(), objectId, deleted: false },
        error: result.error,
      }
    }

    return {
      success: true,
      output: { ts: new Date().toISOString(), objectId, deleted: true },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    objectId: { type: 'string', description: 'The deleted object ID' },
    deleted: { type: 'boolean', description: 'Whether the object was deleted' },
  },
}
