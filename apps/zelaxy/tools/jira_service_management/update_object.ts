import {
  JIRA_SM_ASSET_OBJECT_PROPERTIES,
  type JiraSmUpdateObjectParams,
  type JiraSmUpdateObjectResponse,
} from '@/tools/jira_service_management/types'
import { executeAssetsRequest, mapAssetObject } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementUpdateObjectTool: ToolConfig<
  JiraSmUpdateObjectParams,
  JiraSmUpdateObjectResponse
> = {
  id: 'jira_service_management_update_object',
  name: 'Jira Service Management Update Asset Object',
  description:
    'Update an existing Assets (Insight/CMDB) object. Provide the attributes to change using their objectTypeAttributeId values.',
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
      description: 'The Assets object ID to update',
    },
    attributes: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Array of attributes to set: [{ objectTypeAttributeId, objectAttributeValues: [{ value }] }]',
    },
    objectTypeId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional object type ID (only if changing the type)',
    },
  },

  // Assets tools resolve their cloudId/workspaceId asynchronously, so they run through
  // directExecution; this request config is an unused placeholder.
  request: {
    url: 'https://api.atlassian.com',
    method: 'PUT',
    headers: () => ({}),
  },

  directExecution: async (params) => {
    const result = await executeAssetsRequest(params, (baseUrl) => {
      const body: Record<string, unknown> = { attributes: params.attributes }
      if (params.objectTypeId) body.objectTypeId = params.objectTypeId.trim()

      return {
        url: `${baseUrl}/object/${encodeURIComponent(params.objectId.trim())}`,
        method: 'PUT',
        body,
      }
    })

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
      description: 'The updated Assets object',
      properties: JIRA_SM_ASSET_OBJECT_PROPERTIES,
    },
  },
}
