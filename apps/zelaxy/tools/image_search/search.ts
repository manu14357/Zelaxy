/**
 * Image Search Tool - Search Operation
 */

import type { ImageSearchResponse } from '@/tools/image_search/types'
import type { ToolConfig } from '@/tools/types'

export const imageSearchTool: ToolConfig<any, ImageSearchResponse> = {
  id: 'image_search_search',
  name: 'Image Search',
  description:
    'Search for images and drawings using keyword, visual similarity, hybrid, or spatial search modes',
  version: '1.0.0',

  params: {
    catalogId: {
      type: 'string',
      required: true,
      description: 'ID of the image catalog to search in',
    },
    query: {
      type: 'string',
      required: false,
      description: 'Text search query',
    },
    imageUrl: {
      type: 'string',
      required: false,
      description: 'URL of reference image for visual similarity search',
    },
    mode: {
      type: 'string',
      required: false,
      description: 'Search mode: keyword, visual, hybrid, spatial',
    },
    topK: {
      type: 'number',
      required: false,
      description: 'Number of results to return (1-100)',
    },
    tagFilters: {
      type: 'any',
      required: false,
      description: 'Tag filters as JSON array of {tagName, tagValue}',
    },
    spatialLayer: {
      type: 'string',
      required: false,
      description: 'Filter by CAD layer name',
    },
    spatialBlock: {
      type: 'string',
      required: false,
      description: 'Filter by CAD block name',
    },
  },

  request: {
    url: () => '/api/image-search',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      // Parse tag filters
      const filters: Record<string, string> = {}
      if (params.tagFilters) {
        let tagFilters = params.tagFilters
        if (typeof tagFilters === 'string') {
          try {
            tagFilters = JSON.parse(tagFilters)
          } catch {
            tagFilters = []
          }
        }
        if (Array.isArray(tagFilters)) {
          for (const filter of tagFilters) {
            if (filter.tagName && filter.tagValue) {
              filters[filter.tagName] = filter.tagValue
            }
          }
        }
      }

      // Build spatial filters
      const spatialFilters: Record<string, any> = {}
      if (params.spatialLayer) spatialFilters.layers = [params.spatialLayer]
      if (params.spatialBlock) spatialFilters.blocks = [params.spatialBlock]

      return {
        action: 'search',
        catalogIds: [params.catalogId],
        query: params.query,
        imageUrl: params.imageUrl,
        mode: params.mode || 'hybrid',
        topK: params.topK ? Math.max(1, Math.min(100, Number(params.topK))) : 10,
        ...(Object.keys(filters).length > 0 && { filters }),
        ...(Object.keys(spatialFilters).length > 0 && { spatialFilters }),
        apiKey: params._context?.credential,
      }
    },
  },

  transformResponse: async (response): Promise<ImageSearchResponse> => {
    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        output: { results: [], mode: 'hybrid', totalResults: 0 },
        error: result.error,
      }
    }

    return {
      success: true,
      output: {
        results: result.output?.results || [],
        query: result.output?.query,
        mode: result.output?.mode || 'hybrid',
        totalResults: result.output?.totalResults || 0,
      },
    }
  },

  outputs: {
    results: {
      type: 'array',
      description: 'Search results with file paths and extracted text',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          filePath: { type: 'string' },
          content: { type: 'string' },
          similarity: { type: 'number' },
          metadata: { type: 'object' },
        },
      },
    },
    query: {
      type: 'string',
      description: 'The search query that was executed',
    },
    mode: {
      type: 'string',
      description: 'Search mode used',
    },
    totalResults: {
      type: 'number',
      description: 'Total number of results found',
    },
  },
}
