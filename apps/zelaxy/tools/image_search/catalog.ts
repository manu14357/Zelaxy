/**
 * Image Search Tool - Create Catalog Operation
 */

import type { ImageCatalogResponse } from '@/tools/image_search/types'
import type { ToolConfig } from '@/tools/types'

export const imageSearchCatalogTool: ToolConfig<any, ImageCatalogResponse> = {
  id: 'image_search_catalog',
  name: 'Image Search Create Catalog',
  description: 'Create a new image catalog for indexing and searching images and CAD drawings',
  version: '1.0.0',

  params: {
    name: {
      type: 'string',
      required: true,
      description: 'Name of the image catalog',
    },
    description: {
      type: 'string',
      required: false,
      description: 'Description of the image catalog',
    },
    dataSource: {
      type: 'string',
      required: false,
      description:
        'Default data source type: upload, network, s3, azure_blob, google_drive, postgresql, mssql, url',
    },
    processingMode: {
      type: 'string',
      required: false,
      description: 'Processing mode: batch or realtime',
    },
    extractionMethod: {
      type: 'string',
      required: false,
      description: 'Default extraction method: auto, oda, autodesk_aps, ai_vision, ocr',
    },
  },

  request: {
    url: () => '/api/image-search',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      action: 'create_catalog',
      name: params.name,
      description: params.description,
      dataSource: params.dataSource || 'upload',
      processingMode: params.processingMode || 'batch',
      extractionMethod: params.extractionMethod || 'auto',
      userId: params._context?.userId || 'system',
      workspaceId: params._context?.workspaceId,
    }),
  },

  transformResponse: async (response): Promise<ImageCatalogResponse> => {
    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        output: { catalogId: '', name: '', message: result.error || 'Failed to create catalog' },
        error: result.error,
      }
    }

    return {
      success: true,
      output: result.output,
    }
  },

  outputs: {
    catalogId: {
      type: 'string',
      description: 'The unique ID of the created catalog',
    },
    name: {
      type: 'string',
      description: 'Name of the created catalog',
    },
    message: {
      type: 'string',
      description: 'Confirmation message',
    },
  },
}
