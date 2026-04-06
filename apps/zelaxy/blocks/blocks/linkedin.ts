import { LinkedInIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { LinkedInResponse } from '@/tools/linkedin/types'

export const LinkedInBlock: BlockConfig<LinkedInResponse> = {
  type: 'linkedin',
  name: 'LinkedIn',
  description: 'Interact with LinkedIn',
  longDescription:
    'Connect with LinkedIn to create posts, manage company pages, view profiles, and build B2B social media workflows. Leverage LinkedIn for professional networking and content distribution.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0A66C2',
  icon: LinkedInIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create Post', id: 'linkedin_create_post' },
        { label: 'Get Profile', id: 'linkedin_get_profile' },
        { label: 'Get Company', id: 'linkedin_get_company' },
        { label: 'Delete Post', id: 'linkedin_delete_post' },
      ],
      value: () => 'linkedin_create_post',
    },
    {
      id: 'credential',
      title: 'LinkedIn Account',
      type: 'oauth-input',
      layout: 'full',
      provider: 'linkedin',
      serviceId: 'linkedin',
      requiredScopes: ['openid', 'profile', 'email', 'w_member_social'],
      placeholder: 'Select LinkedIn account',
    },
    // Create Post fields
    {
      id: 'text',
      title: 'Post Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Write your LinkedIn post...',
      condition: { field: 'operation', value: 'linkedin_create_post' },
      required: true,
    },
    {
      id: 'visibility',
      title: 'Visibility',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Public', id: 'PUBLIC' },
        { label: 'Connections Only', id: 'CONNECTIONS' },
      ],
      value: () => 'PUBLIC',
      condition: { field: 'operation', value: 'linkedin_create_post' },
    },
    {
      id: 'mediaUrl',
      title: 'Link URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com/article',
      condition: { field: 'operation', value: 'linkedin_create_post' },
    },
    {
      id: 'mediaTitle',
      title: 'Link Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Title for the shared link',
      condition: { field: 'operation', value: 'linkedin_create_post' },
    },
    {
      id: 'mediaDescription',
      title: 'Link Description',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Description for the shared link',
      condition: { field: 'operation', value: 'linkedin_create_post' },
    },
    {
      id: 'organizationId',
      title: 'Organization ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Company page ID (leave empty for personal post)',
      condition: { field: 'operation', value: 'linkedin_create_post' },
    },
    // Get Company fields
    {
      id: 'companyOrganizationId',
      title: 'Organization ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter LinkedIn organization/company ID',
      condition: { field: 'operation', value: 'linkedin_get_company' },
      required: true,
    },
    // Delete Post fields
    {
      id: 'postId',
      title: 'Post ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter post URN (e.g., urn:li:share:123456)',
      condition: { field: 'operation', value: 'linkedin_delete_post' },
      required: true,
    },
  ],
  tools: {
    access: [
      'linkedin_create_post',
      'linkedin_get_profile',
      'linkedin_get_company',
      'linkedin_delete_post',
    ],
    config: {
      tool: (params) => {
        switch (params.operation) {
          case 'linkedin_create_post':
            return 'linkedin_create_post'
          case 'linkedin_get_profile':
            return 'linkedin_get_profile'
          case 'linkedin_get_company':
            return 'linkedin_get_company'
          case 'linkedin_delete_post':
            return 'linkedin_delete_post'
          default:
            return 'linkedin_create_post'
        }
      },
      params: (params) => {
        const { credential, ...rest } = params

        const parsedParams: Record<string, any> = {
          credential: credential,
        }

        Object.keys(rest).forEach((key) => {
          const value = rest[key]
          // Map companyOrganizationId to organizationId for the get-company tool
          if (key === 'companyOrganizationId') {
            parsedParams.organizationId = value
          } else {
            parsedParams[key] = value
          }
        })

        return parsedParams
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    credential: { type: 'string', description: 'LinkedIn account credential' },
    text: { type: 'string', description: 'Post text content' },
    visibility: { type: 'string', description: 'Post visibility setting' },
    mediaUrl: { type: 'string', description: 'URL of link to share' },
    mediaTitle: { type: 'string', description: 'Title for shared link' },
    mediaDescription: { type: 'string', description: 'Description for shared link' },
    organizationId: { type: 'string', description: 'Organization ID for company posts' },
    companyOrganizationId: { type: 'string', description: 'Organization ID to look up' },
    postId: { type: 'string', description: 'Post URN to delete' },
  },
  outputs: {
    post: { type: 'json', description: 'Created post data' },
    profile: { type: 'json', description: 'User profile data' },
    organization: { type: 'json', description: 'Company/organization data' },
    deleted: { type: 'json', description: 'Deletion confirmation' },
  },
}
