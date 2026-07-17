import type {
  JiraSmListObjectSchemasParams,
  JiraSmListObjectSchemasResponse,
} from '@/tools/jira_service_management/types'
import { buildJsmQuery, executeAssetsRequest } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementListObjectSchemasTool: ToolConfig<
  JiraSmListObjectSchemasParams,
  JiraSmListObjectSchemasResponse
> = {
  id: 'jira_service_management_list_object_schemas',
  name: 'Jira Service Management List Asset Schemas',
  description: 'List Assets (Insight/CMDB) object schemas in Jira Service Management',
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
    startAt: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination start index (e.g., 0, 50)',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum schemas to return (e.g., 25, 50)',
    },
    includeCounts: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Include object and object-type counts per schema',
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
      url: `${baseUrl}/objectschema/list${buildJsmQuery({
        startAt: params.startAt,
        maxResults: params.maxResults,
        includeCounts:
          params.includeCounts === undefined ? undefined : String(params.includeCounts),
      })}`,
      method: 'GET',
    }))

    if (!result.ok) {
      return {
        success: false,
        output: { ts: new Date().toISOString(), schemas: [], total: 0, isLast: true },
        error: result.error,
      }
    }

    const data = result.data
    const schemas = data?.values ?? []

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        schemas,
        total: data?.total ?? schemas.length,
        isLast: data?.isLast ?? data?.last ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    schemas: {
      type: 'array',
      description: 'List of Assets object schemas',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Schema ID' },
          name: { type: 'string', description: 'Schema name' },
          objectSchemaKey: { type: 'string', description: 'Schema key' },
          status: { type: 'string', description: 'Schema status' },
          description: { type: 'string', description: 'Schema description', optional: true },
          objectCount: { type: 'number', description: 'Number of objects', optional: true },
          objectTypeCount: {
            type: 'number',
            description: 'Number of object types',
            optional: true,
          },
        },
      },
    },
    total: { type: 'number', description: 'Total number of schemas' },
    isLast: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
