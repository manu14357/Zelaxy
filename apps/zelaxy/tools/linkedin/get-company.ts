import type { ToolConfig } from '@/tools/types'
import type { LinkedInGetCompanyParams, LinkedInGetCompanyResponse } from './types'

export const linkedinGetCompanyTool: ToolConfig<
  LinkedInGetCompanyParams,
  LinkedInGetCompanyResponse
> = {
  id: 'linkedin_get_company',
  name: 'LinkedIn Get Company',
  description: 'Get organization/company page information from LinkedIn',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'linkedin',
    additionalScopes: ['r_organization_social', 'rw_organization_admin'],
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'LinkedIn OAuth access token',
    },
    organizationId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The LinkedIn organization/company ID',
    },
  },

  request: {
    url: (params) => {
      const orgId = encodeURIComponent(params.organizationId)
      return `https://api.linkedin.com/rest/organizations/${orgId}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401',
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
        organization: {
          id: String(data.id || ''),
          localizedName: data.localizedName || '',
          vanityName: data.vanityName || '',
          localizedDescription: data.localizedDescription || '',
          logoUrl: data.logoV2?.original || '',
          followersCount: data.followersCount,
          staffCount: data.staffCount,
          industries: data.industries || [],
          websiteUrl: data.websiteUrl || '',
        },
      },
    }
  },

  outputs: {
    organization: {
      type: 'object',
      description: 'LinkedIn organization/company data',
      properties: {
        id: { type: 'string', description: 'Organization ID' },
        localizedName: { type: 'string', description: 'Company name' },
        vanityName: { type: 'string', description: 'Company vanity URL name' },
        localizedDescription: { type: 'string', description: 'Company description' },
        logoUrl: { type: 'string', description: 'Company logo URL' },
        followersCount: { type: 'number', description: 'Number of followers' },
        staffCount: { type: 'number', description: 'Number of staff members' },
        industries: { type: 'array', description: 'Industry categories' },
        websiteUrl: { type: 'string', description: 'Company website URL' },
      },
    },
  },
}
