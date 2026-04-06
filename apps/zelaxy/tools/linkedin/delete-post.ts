import type { ToolConfig } from '@/tools/types'
import type { LinkedInDeletePostParams, LinkedInDeletePostResponse } from './types'

export const linkedinDeletePostTool: ToolConfig<
  LinkedInDeletePostParams,
  LinkedInDeletePostResponse
> = {
  id: 'linkedin_delete_post',
  name: 'LinkedIn Delete Post',
  description: 'Delete a post from LinkedIn',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'linkedin',
    additionalScopes: ['w_member_social'],
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'LinkedIn OAuth access token',
    },
    postId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The URN or ID of the post to delete (e.g., urn:li:share:123456)',
    },
  },

  request: {
    url: (params) => {
      const postId = encodeURIComponent(params.postId)
      return `https://api.linkedin.com/rest/posts/${postId}`
    },
    method: 'DELETE',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401',
    }),
  },

  transformResponse: async (response, params) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `LinkedIn API error: ${errorData.message || errorData.serviceErrorCode || response.statusText}`
      )
    }

    return {
      success: true,
      output: {
        deleted: true,
        postId: params?.postId || '',
      },
    }
  },

  outputs: {
    deleted: {
      type: 'boolean',
      description: 'Whether the post was successfully deleted',
    },
    postId: {
      type: 'string',
      description: 'The ID of the deleted post',
    },
  },
}
