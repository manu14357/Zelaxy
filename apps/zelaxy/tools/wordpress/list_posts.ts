import type { ToolConfig } from '@/tools/types'
import type { ListPostsParams, WordpressListResponse } from '@/tools/wordpress/types'
import { wordpressAuthHeader } from '@/tools/wordpress/types'

export const listPostsTool: ToolConfig<ListPostsParams, WordpressListResponse> = {
  id: 'wordpress_list_posts',
  name: 'WordPress List Posts',
  description: 'List posts from a self-hosted WordPress site',
  version: '1.0.0',

  params: {
    siteUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'WordPress site URL (e.g. https://example.com)',
    },
    username: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'WordPress username',
    },
    appPassword: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'WordPress application password',
    },
    perPage: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of posts to return per page (default 10, max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`${params.siteUrl}/wp-json/wp/v2/posts`)
      if (params.perPage) url.searchParams.append('per_page', String(params.perPage))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: wordpressAuthHeader(params),
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const posts = Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        data: posts,
        metadata: { count: posts.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of WordPress post objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
