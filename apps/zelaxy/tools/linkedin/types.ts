import type { ToolResponse } from '@/tools/types'

// Common Types
export interface LinkedInProfile {
  id: string
  localizedFirstName: string
  localizedLastName: string
  localizedHeadline?: string
  vanityName?: string
  profilePicture?: string
}

export interface LinkedInPost {
  id: string
  author: string
  text: string
  createdAt: string
  visibility: string
  lifecycleState?: string
  media?: LinkedInMedia[]
}

export interface LinkedInMedia {
  status: string
  description?: string
  title?: string
  originalUrl?: string
}

export interface LinkedInComment {
  id: string
  author: string
  message: string
  createdAt: string
  parentComment?: string
}

export interface LinkedInOrganization {
  id: string
  localizedName: string
  vanityName?: string
  localizedDescription?: string
  logoUrl?: string
  followersCount?: number
  staffCount?: number
  industries?: string[]
  websiteUrl?: string
}

// Common parameters for all LinkedIn endpoints
export interface LinkedInBaseParams {
  accessToken: string
}

// Create Post Operation
export interface LinkedInCreatePostParams extends LinkedInBaseParams {
  text: string
  visibility?: 'PUBLIC' | 'CONNECTIONS'
  mediaUrl?: string
  mediaTitle?: string
  mediaDescription?: string
  organizationId?: string
}

export interface LinkedInCreatePostResponse extends ToolResponse {
  output: {
    post: {
      id: string
      status: string
    }
  }
}

// Get Profile Operation
export interface LinkedInGetProfileParams extends LinkedInBaseParams {
  profileId?: string
}

export interface LinkedInGetProfileResponse extends ToolResponse {
  output: {
    profile: LinkedInProfile
  }
}

// Get Company Operation
export interface LinkedInGetCompanyParams extends LinkedInBaseParams {
  organizationId: string
}

export interface LinkedInGetCompanyResponse extends ToolResponse {
  output: {
    organization: LinkedInOrganization
  }
}

// Delete Post Operation
export interface LinkedInDeletePostParams extends LinkedInBaseParams {
  postId: string
}

export interface LinkedInDeletePostResponse extends ToolResponse {
  output: {
    deleted: boolean
    postId: string
  }
}

export type LinkedInResponse =
  | LinkedInCreatePostResponse
  | LinkedInGetProfileResponse
  | LinkedInGetCompanyResponse
  | LinkedInDeletePostResponse
