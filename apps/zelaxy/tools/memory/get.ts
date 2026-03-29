import type { MemoryResponse } from '@/tools/memory/types'
import type { ToolConfig } from '@/tools/types'

export const memoryGetTool: ToolConfig<any, MemoryResponse> = {
  id: 'memory_get',
  name: 'Fetch Specific Record',
  description: 'Retrieve a specific memory record by its unique identifier',
  version: '1.0.0',

  params: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the record to retrieve',
    },
    limit: {
      type: 'number',
      required: false,
      description: 'Maximum number of messages to retrieve from the record (default: 10)',
    },
    sortOrder: {
      type: 'string',
      required: false,
      description: 'Sort order for retrieved records (asc/desc, default: desc)',
    },
  },

  request: {
    url: (params): any => {
      // Get workflowId from context (set by workflow execution)
      const workflowId = params._context?.workflowId

      if (!workflowId) {
        return {
          _errorResponse: {
            status: 400,
            data: {
              success: false,
              error: {
                message:
                  'Workflow identifier is required and must be provided in execution context',
              },
            },
          },
        }
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        workflowId: workflowId,
      })

      // Add limit if specified
      if (params.limit && Number.parseInt(params.limit) > 0) {
        queryParams.set('limit', params.limit.toString())
      }

      // Add sort order if specified
      if (params.sortOrder) {
        queryParams.set('sortOrder', params.sortOrder)
      }

      return `/api/memory/${encodeURIComponent(params.id)}?${queryParams.toString()}`
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response): Promise<MemoryResponse> => {
    const result = await response.json()
    const data = result.data || result

    return {
      success: true,
      output: {
        memories: data.memories || data.data || data,
        count: data.count || 1,
        totalCount: data.totalCount || data.count || 1,
        limit: data.limit,
        sortOrder: data.sortOrder,
        message: `Record retrieved successfully. Retrieved ${data.count || 1} memory entries${data.limit ? ` (limit: ${data.limit})` : ''}${data.totalCount && data.totalCount > (data.count || 1) ? ` out of ${data.totalCount} total` : ''}`,
        success: true,
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the record was retrieved successfully' },
    memories: {
      type: 'array',
      description: 'Array of record data for the requested identifier with applied limit',
    },
    count: {
      type: 'number',
      description: 'Number of memory entries retrieved within the specified limit',
    },
    totalCount: {
      type: 'number',
      description: 'Total number of memory entries available in the record',
    },
    limit: { type: 'number', description: 'The retrieval limit that was applied' },
    sortOrder: { type: 'string', description: 'The sort order that was applied (asc/desc)' },
    message: {
      type: 'string',
      description: 'Operation result message with limit and count information',
    },
    error: { type: 'string', description: 'Error details if retrieval failed' },
  },
}
