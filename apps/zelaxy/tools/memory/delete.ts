import type { MemoryResponse } from '@/tools/memory/types'
import type { ToolConfig } from '@/tools/types'

export const memoryDeleteTool: ToolConfig<any, MemoryResponse> = {
  id: 'memory_delete',
  name: 'Remove Record',
  description: 'Permanently remove a specific memory record by its identifier',
  version: '1.0.0',

  params: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the record to remove',
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

      // Append workflowId as query parameter
      return `/api/memory/${encodeURIComponent(params.id)}?workflowId=${encodeURIComponent(workflowId)}`
    },
    method: 'DELETE',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },
  transformResponse: async (response): Promise<MemoryResponse> => {
    const result = await response.json()

    return {
      success: true,
      output: {
        message: 'Record removed successfully.',
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the record was removed successfully' },
    message: { type: 'string', description: 'Operation result confirmation' },
    error: { type: 'string', description: 'Error details if removal failed' },
  },
}
