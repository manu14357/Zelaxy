import type { ToolConfig } from '@/tools/types'
import type { LinkedInGetProfileParams, LinkedInGetProfileResponse } from './types'

export const linkedinGetProfileTool: ToolConfig<
  LinkedInGetProfileParams,
  LinkedInGetProfileResponse
> = {
  id: 'linkedin_get_profile',
  name: 'LinkedIn Get Profile',
  description: 'Get the authenticated user profile information from LinkedIn',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'linkedin',
    additionalScopes: ['openid', 'profile', 'email'],
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'LinkedIn OAuth access token',
    },
  },

  request: {
    url: 'https://api.linkedin.com/v2/userinfo',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
    }),
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
        profile: {
          id: data.sub || '',
          localizedFirstName: data.given_name || '',
          localizedLastName: data.family_name || '',
          localizedHeadline: data.name || '',
          vanityName: data.email || '',
          profilePicture: data.picture || '',
        },
      },
    }
  },

  outputs: {
    profile: {
      type: 'object',
      description: 'LinkedIn user profile data',
      properties: {
        id: { type: 'string', description: 'LinkedIn member ID (sub)' },
        localizedFirstName: { type: 'string', description: 'First name' },
        localizedLastName: { type: 'string', description: 'Last name' },
        localizedHeadline: { type: 'string', description: 'Full display name' },
        vanityName: { type: 'string', description: 'Email address' },
        profilePicture: { type: 'string', description: 'Profile picture URL' },
      },
    },
  },
}
