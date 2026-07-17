import {
  JIRA_SM_ASSET_OBJECT_PROPERTIES,
  type JiraSmCreateObjectParams,
  type JiraSmCreateObjectResponse,
} from '@/tools/jira_service_management/types'
import { executeAssetsRequest, mapAssetObject } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementCreateObjectTool: ToolConfig<
  JiraSmCreateObjectParams,
  JiraSmCreateObjectResponse
> = {
  id: 'jira_service_management_create_object',
  name: 'Jira Service Management Create Asset Object',
  description:
    'Create an Assets (Insight/CMDB) object of a given object type. Attributes use objectTypeAttributeId values from the object type definition.',
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
    objectTypeId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The object type ID to create the object under',
    },
    attributes: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Array of attributes: [{ objectTypeAttributeId, objectAttributeValues: [{ value }] }]',
    },
  },

  // Assets tools resolve their cloudId/workspaceId asynchronously, so they run through
  // directExecution; this request config is an unused placeholder.
  request: {
    url: 'https://api.atlassian.com',
    method: 'POST',
    headers: () => ({}),
  },

  directExecution: async (params) => {
    const result = await executeAssetsRequest(params, (baseUrl) => ({
      url: `${baseUrl}/object/create`,
      method: 'POST',
      body: {
        objectTypeId: params.objectTypeId.trim(),
        attributes: params.attributes,
      },
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
      description: 'The created Assets object',
      properties: JIRA_SM_ASSET_OBJECT_PROPERTIES,
    },
  },
}
