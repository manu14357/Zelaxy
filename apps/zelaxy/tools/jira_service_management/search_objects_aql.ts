import type {
  JiraSmSearchObjectsAqlParams,
  JiraSmSearchObjectsAqlResponse,
} from '@/tools/jira_service_management/types'
import { executeAssetsRequest, mapAssetObject } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementSearchObjectsAqlTool: ToolConfig<
  JiraSmSearchObjectsAqlParams,
  JiraSmSearchObjectsAqlResponse
> = {
  id: 'jira_service_management_search_objects_aql',
  name: 'Jira Service Management Search Assets (AQL)',
  description:
    'Search Assets (Insight/CMDB) objects using AQL (Assets Query Language), e.g. objectType = "Host" AND Status = "Running". Supports pagination.',
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
    qlQuery: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'AQL query string (e.g., objectType = "Host" AND "Operating System" = "Ubuntu")',
    },
    page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number (1-based, defaults to 1)',
    },
    resultsPerPage: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Results per page (e.g., 25, 50)',
    },
    includeAttributes: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Include resolved attribute values on each object (defaults to true)',
    },
    objectTypeId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optionally scope the search to a single object type ID',
    },
    objectSchemaId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optionally scope the search to a single object schema ID',
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
    const emptyOutput = {
      ts: new Date().toISOString(),
      objects: [],
      total: 0,
      pageNumber: 0,
      pageSize: 0,
    }

    const result = await executeAssetsRequest(params, (baseUrl) => {
      const body: Record<string, unknown> = {
        qlQuery: params.qlQuery,
        page: toNumber(params.page, 1),
        resultsPerPage: toNumber(params.resultsPerPage, 25),
        includeAttributes: params.includeAttributes ?? true,
      }
      if (params.objectTypeId) body.objectTypeId = params.objectTypeId
      if (params.objectSchemaId) body.objectSchemaId = params.objectSchemaId

      return { url: `${baseUrl}/object/aql`, method: 'POST', body }
    })

    if (!result.ok) {
      return { success: false, output: emptyOutput, error: result.error }
    }

    const data = result.data
    const objectEntries = Array.isArray(data?.objectEntries) ? data.objectEntries : []

    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        objects: objectEntries.map(mapAssetObject),
        total: data?.totalFilterCount ?? objectEntries.length,
        pageNumber: data?.pageNumber ?? 1,
        pageSize: data?.pageSize ?? objectEntries.length,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    objects: {
      type: 'array',
      description: 'Matching Assets objects',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Object ID' },
          label: { type: 'string', description: 'Object label', optional: true },
          objectKey: { type: 'string', description: 'Object key (e.g., HOST-123)', optional: true },
          objectType: { type: 'json', description: 'Object type metadata', optional: true },
          attributes: { type: 'json', description: 'Resolved attribute values', optional: true },
        },
      },
    },
    total: { type: 'number', description: 'Total number of matching objects (totalFilterCount)' },
    pageNumber: { type: 'number', description: 'Current page number' },
    pageSize: { type: 'number', description: 'Number of objects on this page' },
  },
}

/** Coerce a param into a number, falling back when unset or unparseable. */
function toNumber(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
