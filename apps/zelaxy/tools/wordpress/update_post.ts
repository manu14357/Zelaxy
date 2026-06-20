import type { ToolConfig } from '@/tools/types'
import type { UpdatePostParams, WordpressObjectResponse } from '@/tools/wordpress/types'
import { wordpressAuthHeader } from '@/tools/wordpress/types'

export const updatePostTool: ToolConfig<UpdatePostParams, WordpressObjectResponse> = {
  id: 'wordpress_update_post',
  name: 'WordPress Update Post',
  description: 'Update an existing post on a self-hosted WordPress site',
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
      description: 'ID of the post to update',
    },
    title: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Post title',
    },
    content: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Post content (HTML or plain text)',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Post status: publish, draft, pending, or private',
    },
  },

  request: {
    url: (params) => `${params.siteUrl}/wp-json/wp/v2/posts/${params.postId}`,
    method: 'POST',
    headers: (params) => ({
      Authorization: wordpressAuthHeader(params),
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.title) body.title = params.title
      if (params.content) body.content = params.content
      if (params.status) body.status = params.status
      return body
    },
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
    data: { type: 'json', description: 'The updated WordPress post object' },
    metadata: {
      type: 'json',
      description: 'Post identifiers',
      properties: {
        id: { type: 'string', description: 'Post ID' },
      },
    },
  },
}
