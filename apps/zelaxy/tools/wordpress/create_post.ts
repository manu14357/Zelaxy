import type { ToolConfig } from '@/tools/types'
import type { CreatePostParams, WordpressObjectResponse } from '@/tools/wordpress/types'
import { wordpressAuthHeader } from '@/tools/wordpress/types'

export const createPostTool: ToolConfig<CreatePostParams, WordpressObjectResponse> = {
  id: 'wordpress_create_post',
  name: 'WordPress Create Post',
  description: 'Create a new post on a self-hosted WordPress site',
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
    title: {
      type: 'string',
      required: true,
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
    url: (params) => `${params.siteUrl}/wp-json/wp/v2/posts`,
    method: 'POST',
    headers: (params) => ({
      Authorization: wordpressAuthHeader(params),
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { title: params.title }
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
    data: { type: 'json', description: 'The created WordPress post object' },
    metadata: {
      type: 'json',
      description: 'Post identifiers',
      properties: {
        id: { type: 'string', description: 'Post ID' },
      },
    },
  },
}
