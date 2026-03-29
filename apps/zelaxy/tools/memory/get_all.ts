import type { MemoryResponse } from '@/tools/memory/types'
import type { ToolConfig } from '@/tools/types'

export const memoryGetAllTool: ToolConfig<any, MemoryResponse> = {
  id: 'memory_get_all',
  name: 'Retrieve All Records',
  description: 'Retrieve all memory records with filtering and sorting options',
  version: '1.0.0',

  params: {
    limit: {
      type: 'number',
      required: false,
      description: 'Maximum number of messages to retrieve per record (default: all messages)',
    },
    sortOrder: {
      type: 'string',
      required: false,
      description: 'Sort direction: "asc" for oldest first, "desc" for newest first',
    },
    filterType: {
      type: 'string',
      required: false,
      description: 'Filter by message role: "user", "assistant", "system", or "all"',
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

      // Add optional parameters
      if (params.limit && Number.parseInt(params.limit) > 0) {
        queryParams.append('limit', params.limit.toString())
      }

      if (params.sortOrder && ['asc', 'desc'].includes(params.sortOrder)) {
        queryParams.append('sortOrder', params.sortOrder)
      }

      if (params.filterType && params.filterType !== 'all') {
        queryParams.append('filterType', params.filterType)
      }

      return `/api/memory?${queryParams.toString()}`
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response): Promise<MemoryResponse> => {
    const result = await response.json()

    // Extract memories from the response
    const data = result.data || result
    const rawMemories = data.memories || data || []

    // Transform records to return them with enhanced metadata
    const memories = rawMemories.map((memory: any) => ({
      key: memory.key,
      type: memory.type,
      data: memory.data,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    }))

    return {
      success: true,
      output: {
        memories,
        count: data.count || memories.length,
        total: data.total || memories.length,
        message: 'Records retrieved successfully',
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether all records were retrieved successfully' },
    memories: {
      type: 'array',
      description: 'Array of memory records with metadata and timestamps',
    },
    count: { type: 'number', description: 'Number of records returned after filtering' },
    total: { type: 'number', description: 'Total number of records before filtering' },
    message: { type: 'string', description: 'Operation result message' },
    error: { type: 'string', description: 'Error details if operation failed' },
  },
}
