import type {
  JiraSmGetObjectTypeAttributesParams,
  JiraSmGetObjectTypeAttributesResponse,
} from '@/tools/jira_service_management/types'
import { buildJsmQuery, executeAssetsRequest } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetObjectTypeAttributesTool: ToolConfig<
  JiraSmGetObjectTypeAttributesParams,
  JiraSmGetObjectTypeAttributesResponse
> = {
  id: 'jira_service_management_get_object_type_attributes',
  name: 'Jira Service Management Get Asset Object Type Attributes',
  description:
    'Get the attribute definitions for an Assets (Insight/CMDB) object type. Use the returned attribute IDs to build create/update payloads or map columns.',
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
      description: 'The Assets object type ID',
    },
    onlyValueEditable: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Return only attributes whose values can be edited',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter attributes by a search query',
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
      url: `${baseUrl}/objecttype/${encodeURIComponent(params.objectTypeId.trim())}/attributes${buildJsmQuery(
        {
          onlyValueEditable:
            params.onlyValueEditable === undefined ? undefined : String(params.onlyValueEditable),
          query: params.query,
        }
      )}`,
      method: 'GET',
    }))

    if (!result.ok) {
      return {
        success: false,
        output: { ts: new Date().toISOString(), attributes: [], total: 0 },
        error: result.error,
      }
    }

    const data = result.data
    const attributes = Array.isArray(data) ? data : (data?.values ?? [])

    return {
      success: true,
      output: { ts: new Date().toISOString(), attributes, total: attributes.length },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    attributes: {
      type: 'array',
      description: 'Attribute definitions for the object type',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Attribute definition ID — use as objectTypeAttributeId in create/update',
          },
          name: { type: 'string', description: 'Attribute name' },
          label: { type: 'boolean', description: 'Whether this attribute is the object label' },
          type: { type: 'number', description: 'Data type discriminator (integer enum)' },
          defaultType: {
            type: 'json',
            description: 'Default data type { id, name }',
            optional: true,
          },
          editable: { type: 'boolean', description: 'Whether the value is editable' },
          minimumCardinality: {
            type: 'number',
            description: 'Minimum number of values (>= 1 means required)',
          },
          maximumCardinality: { type: 'number', description: 'Maximum number of values' },
          uniqueAttribute: {
            type: 'boolean',
            description: 'Whether values must be unique',
            optional: true,
          },
        },
      },
    },
    total: { type: 'number', description: 'Total number of attributes' },
  },
}
