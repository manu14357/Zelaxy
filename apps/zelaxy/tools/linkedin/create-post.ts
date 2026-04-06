import type { ToolConfig } from '@/tools/types'
import type { LinkedInCreatePostParams, LinkedInCreatePostResponse } from './types'

export const linkedinCreatePostTool: ToolConfig<
  LinkedInCreatePostParams,
  LinkedInCreatePostResponse
> = {
  id: 'linkedin_create_post',
  name: 'LinkedIn Create Post',
  description: 'Create a new post on LinkedIn (personal or company page)',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'linkedin',
    additionalScopes: ['w_member_social', 'r_liteprofile'],
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'LinkedIn OAuth access token',
    },
    text: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The text content of the post',
    },
    visibility: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Post visibility: PUBLIC or CONNECTIONS',
    },
    mediaUrl: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'URL of an article or link to share',
    },
    mediaTitle: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Title for the shared link',
    },
    mediaDescription: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Description for the shared link',
    },
    organizationId: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Organization ID to post on behalf of a company page',
    },
  },

  request: {
    url: 'https://api.linkedin.com/v2/ugcPosts',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401',
    }),
    body: (params) => {
      const author = params.organizationId
        ? `urn:li:organization:${params.organizationId}`
        : 'urn:li:person:{owner}'

      const body: any = {
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: params.text,
            },
            shareMediaCategory: params.mediaUrl ? 'ARTICLE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility':
            params.visibility === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC',
        },
      }

      if (params.mediaUrl) {
        body.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            originalUrl: params.mediaUrl,
            title: params.mediaTitle ? { text: params.mediaTitle } : undefined,
            description: params.mediaDescription
              ? { text: params.mediaDescription }
              : undefined,
          },
        ]
      }

      return body
    },
  },

  transformResponse: async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `LinkedIn API error: ${errorData.message || errorData.serviceErrorCode || response.statusText}`
      )
    }

    const data = await response.json()
    return {
      success: true,
      output: {
        post: {
          id: data.id || data.value || '',
          status: 'PUBLISHED',
        },
      },
    }
  },

  outputs: {
    post: {
      type: 'object',
      description: 'The newly created LinkedIn post',
      properties: {
        id: { type: 'string', description: 'Post URN ID' },
        status: { type: 'string', description: 'Post lifecycle state' },
      },
    },
  },
}
