import type { GetVolumeParams, GoogleBooksObjectResponse } from '@/tools/google_books/types'
import type { ToolConfig } from '@/tools/types'

export const getVolumeTool: ToolConfig<GetVolumeParams, GoogleBooksObjectResponse> = {
  id: 'google_books_get_volume',
  name: 'Google Books Get Volume',
  description: 'Get detailed information about a specific book volume',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Books API key',
    },
    volumeId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the volume to retrieve',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://www.googleapis.com/books/v1/volumes/${params.volumeId}`)
      url.searchParams.append('key', params.apiKey)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { id: data.id },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The volume object' },
    metadata: {
      type: 'json',
      description: 'Volume identifiers',
      properties: {
        id: { type: 'string', description: 'Volume ID' },
      },
    },
  },
}
