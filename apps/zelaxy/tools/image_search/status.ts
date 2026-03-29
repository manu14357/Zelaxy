/**
 * Image Search Tool - Status Operation
 */

import type { ImageStatusResponse } from '@/tools/image_search/types'
import type { ToolConfig } from '@/tools/types'

export const imageSearchStatusTool: ToolConfig<any, ImageStatusResponse> = {
  id: 'image_search_status',
  name: 'Image Search Status',
  description: 'Check the status and progress of an image catalog, including indexing progress',
  version: '1.0.0',

  params: {
    catalogId: {
      type: 'string',
      required: true,
      description: 'ID of the image catalog to check status for',
    },
  },

  request: {
    url: () => '/api/image-search',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      action: 'status',
      catalogId: params.catalogId,
    }),
  },

  transformResponse: async (response): Promise<ImageStatusResponse> => {
    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        output: {
          catalogId: '',
          name: '',
          status: 'error',
          fileCount: 0,
          documentCount: 0,
          indexingProgress: 0,
          lastIndexedAt: null,
          indexingError: result.error || null,
          dataSource: '',
          processingMode: '',
        },
        error: result.error,
      }
    }

    return {
      success: true,
      output: result.output,
    }
  },

  outputs: {
    catalogId: { type: 'string', description: 'Catalog ID' },
    name: { type: 'string', description: 'Catalog name' },
    status: { type: 'string', description: 'Current status: active, indexing, error' },
    fileCount: { type: 'number', description: 'Number of indexed files' },
    documentCount: { type: 'number', description: 'Number of document records' },
    indexingProgress: { type: 'number', description: 'Indexing progress percentage (0-100)' },
    lastIndexedAt: { type: 'string', description: 'Last indexing timestamp' },
    indexingError: { type: 'string', description: 'Error message if status is error' },
  },
}
