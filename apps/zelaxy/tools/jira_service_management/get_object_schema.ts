import type {
  JiraSmGetObjectSchemaParams,
  JiraSmGetObjectSchemaResponse,
} from '@/tools/jira_service_management/types'
import { executeAssetsRequest } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetObjectSchemaTool: ToolConfig<
  JiraSmGetObjectSchemaParams,
  JiraSmGetObjectSchemaResponse
> = {
  id: 'jira_service_management_get_object_schema',
  name: 'Jira Service Management Get Asset Schema',
  description: 'Get a single Assets (Insight/CMDB) object schema by ID',
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
      description: 'The Assets object schema ID',
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
      url: `${baseUrl}/objectschema/${encodeURIComponent(params.schemaId.trim())}`,
      method: 'GET',
    }))

    if (!result.ok) {
      return {
        success: false,
        output: { ts: new Date().toISOString(), schema: null },
        error: result.error,
      }
    }

    return {
      success: true,
      output: { ts: new Date().toISOString(), schema: result.data ?? null },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    schema: {
      type: 'json',
      description: 'The Assets object schema',
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
}
