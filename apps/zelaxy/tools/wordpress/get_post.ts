import type { ToolConfig } from '@/tools/types'
import type { GetPostParams, WordpressObjectResponse } from '@/tools/wordpress/types'
import { wordpressAuthHeader } from '@/tools/wordpress/types'

export const getPostTool: ToolConfig<GetPostParams, WordpressObjectResponse> = {
  id: 'wordpress_get_post',
  name: 'WordPress Get Post',
  description: 'Get a single post by ID from a self-hosted WordPress site',
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
    postId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the post to retrieve',
    },
  },

  request: {
    url: (params) => `${params.siteUrl}/wp-json/wp/v2/posts/${params.postId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: wordpressAuthHeader(params),
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { id: String(data.id ?? '') },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The WordPress post object' },
    metadata: {
      type: 'json',
      description: 'Post identifiers',
      properties: {
        id: { type: 'string', description: 'Post ID' },
      },
    },
  },
}
