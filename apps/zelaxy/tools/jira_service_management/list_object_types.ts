import type {
  JiraSmListObjectTypesParams,
  JiraSmListObjectTypesResponse,
} from '@/tools/jira_service_management/types'
import { buildJsmQuery, executeAssetsRequest } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementListObjectTypesTool: ToolConfig<
  JiraSmListObjectTypesParams,
  JiraSmListObjectTypesResponse
> = {
  id: 'jira_service_management_list_object_types',
  name: 'Jira Service Management List Asset Object Types',
  description: 'List object types within an Assets (Insight/CMDB) object schema',
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
    schemaId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Assets object schema ID to list object types for',
    },
    excludeAbstract: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Exclude abstract object types from the result',
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
      url: `${baseUrl}/objectschema/${encodeURIComponent(params.schemaId.trim())}/objecttypes${buildJsmQuery(
        {
          excludeAbstract:
            params.excludeAbstract === undefined ? undefined : String(params.excludeAbstract),
        }
      )}`,
      method: 'GET',
    }))

    if (!result.ok) {
      return {
        success: false,
        output: { ts: new Date().toISOString(), objectTypes: [], total: 0 },
        error: result.error,
      }
    }

    const data = result.data
    const objectTypes = Array.isArray(data) ? data : (data?.values ?? [])

    return {
      success: true,
      output: { ts: new Date().toISOString(), objectTypes, total: objectTypes.length },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    objectTypes: {
      type: 'array',
      description: 'List of object types in the schema',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Object type ID' },
          name: { type: 'string', description: 'Object type name' },
          description: { type: 'string', description: 'Object type description', optional: true },
          objectSchemaId: { type: 'string', description: 'Parent schema ID' },
          objectCount: { type: 'number', description: 'Number of objects', optional: true },
          abstractObjectType: {
            type: 'boolean',
            description: 'Whether the type is abstract',
            optional: true,
          },
          inherited: {
            type: 'boolean',
            description: 'Whether the type inherits attributes',
            optional: true,
          },
        },
      },
    },
    total: { type: 'number', description: 'Total number of object types' },
  },
}
