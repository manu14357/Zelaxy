import {
  JIRA_SM_ASSET_OBJECT_PROPERTIES,
  type JiraSmGetObjectParams,
  type JiraSmGetObjectResponse,
} from '@/tools/jira_service_management/types'
import { executeAssetsRequest, mapAssetObject } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetObjectTool: ToolConfig<
  JiraSmGetObjectParams,
  JiraSmGetObjectResponse
> = {
  id: 'jira_service_management_get_object',
  name: 'Jira Service Management Get Asset Object',
  description: 'Get a single Assets (Insight/CMDB) object by ID, including its attribute values',
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
      description: 'The Assets object ID',
    },
  },

  // Assets tools resolve their cloudId/workspaceId asynchronously, so they run through
  // directExecution; this request config is an unused placeholder.
  request: {
    url: 'https://api.atlassian.com',
    method: 'GET',
    headers: () => ({}),
  },

  directExecution: async (params) => {
    const result = await executeAssetsRequest(params, (baseUrl) => ({
      url: `${baseUrl}/object/${encodeURIComponent(params.objectId.trim())}`,
      method: 'GET',
    }))

    if (!result.ok) {
      return {
        success: false,
        output: { ts: new Date().toISOString(), object: null },
        error: result.error,
      }
    }

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        object: result.data ? mapAssetObject(result.data) : null,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    object: {
      type: 'json',
      description: 'The Assets object',
      properties: JIRA_SM_ASSET_OBJECT_PROPERTIES,
    },
  },
}
