import type {
  DuckDuckGoImagesSearchParams,
  DuckDuckGoImagesSearchResponse,
} from '@/tools/duckduckgo/types'
import type { ToolConfig } from '@/tools/types'

export const imagesSearchTool: ToolConfig<
  DuckDuckGoImagesSearchParams,
  DuckDuckGoImagesSearchResponse
> = {
  id: 'duckduckgo_images_search',
  name: 'DuckDuckGo Images Search',
  description:
    'Search for images using DuckDuckGo. Returns image results with titles, URLs, thumbnails, and dimensions.',
  version: '1.0.0',

  params: {
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The image search query to execute',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-only',
      description: 'Maximum number of results to return (default: 10)',
    },
    region: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Region code for localized results (e.g., wt-wt, us-en)',
    },
  },

  request: {
    url: (params) => {
      const searchParams = new URLSearchParams({
        q: params.query,
        format: 'json',
        ia: 'images',
        iax: 'images',
      })
      if (params.region) searchParams.append('kl', params.region)
      return `https://api.duckduckgo.com/?${searchParams.toString()}`
    },
    method: 'GET',
    headers: () => ({
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    const maxResults = 10

    const results = (data.Results || data.RelatedTopics || [])
      .slice(0, maxResults)
      .map((item: any) => ({
        title: item.Text || item.Result || '',
        url: item.FirstURL || '',
        thumbnail: item.Icon?.URL || '',
        source: '',
        width: 0,
        height: 0,
      }))

    return {
      success: true,
      output: { results },
    }
  },

  outputs: {
    results: {
      type: 'array',
      description: 'Array of image results',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Image title' },
          url: { type: 'string', description: 'URL to the image' },
          thumbnail: { type: 'string', description: 'URL to the thumbnail' },
          source: { type: 'string', description: 'Image source website' },
          width: { type: 'number', description: 'Image width in pixels' },
          height: { type: 'number', description: 'Image height in pixels' },
        },
      },
    },
  },
}
