import type { ToolConfig } from '@/tools/types'

export const clerkListUsersTool: ToolConfig = {
  id: 'clerk_list_users',
  name: 'List Users from Clerk',
  description: 'List all users in your Clerk application with optional filtering and pagination.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (range: 1-500, default: 10)',
    },
    offset: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
    orderBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field with +/- prefix (default: -created_at)',
    },
    emailAddress: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by email address (comma-separated for multiple)',
    },
    phoneNumber: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by phone number (comma-separated for multiple)',
    },
    externalId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by external ID (comma-separated for multiple)',
    },
    username: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by username (comma-separated for multiple)',
    },
    userId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by user ID (comma-separated for multiple)',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Search query across email, phone, username, and names',
    },
  },

  request: {
    url: (params) => {
      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())
      if (params.orderBy) queryParams.append('order_by', params.orderBy)
      if (params.query) queryParams.append('query', params.query)
      if (params.emailAddress) {
        ;(params.emailAddress as string)
          .split(',')
          .forEach((e) => queryParams.append('email_address', e.trim()))
      }
      if (params.phoneNumber) {
        ;(params.phoneNumber as string)
          .split(',')
          .forEach((p) => queryParams.append('phone_number', p.trim()))
      }
      if (params.externalId) {
        ;(params.externalId as string)
          .split(',')
          .forEach((id) => queryParams.append('external_id', id.trim()))
      }
      if (params.username) {
        ;(params.username as string)
          .split(',')
          .forEach((u) => queryParams.append('username', u.trim()))
      }
      if (params.userId) {
        ;(params.userId as string)
          .split(',')
          .forEach((id) => queryParams.append('user_id', id.trim()))
      }
      const qs = queryParams.toString()
      return qs ? `https://api.clerk.com/v1/users?${qs}` : 'https://api.clerk.com/v1/users'
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to list users from Clerk'
      )
    }
    const totalCount = Number.parseInt(response.headers.get('x-total-count') || '0', 10)
    return {
      success: true,
      output: { users: data, totalCount: totalCount || (data as unknown[]).length },
    }
  },

  outputs: {
    users: { type: 'array', description: 'Array of Clerk user objects' },
    totalCount: { type: 'number', description: 'Total number of users matching the query' },
  },
}

export const clerkGetUserTool: ToolConfig = {
  id: 'clerk_get_user',
  name: 'Get User from Clerk',
  description: 'Retrieve a single user by their ID from Clerk.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the user to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.clerk.com/v1/users/${String(params.userId).trim()}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to get user from Clerk'
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    id: { type: 'string', description: 'User ID' },
    username: { type: 'string', description: 'Username' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    emailAddresses: { type: 'array', description: 'User email addresses' },
  },
}

export const clerkCreateUserTool: ToolConfig = {
  id: 'clerk_create_user',
  name: 'Create User in Clerk',
  description: 'Create a new user in your Clerk application.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    emailAddress: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email address(es) for the user (comma-separated for multiple)',
    },
    phoneNumber: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Phone number(s) for the user (comma-separated for multiple)',
    },
    username: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Username (must be unique)',
    },
    password: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Password (minimum 8 characters)',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'First name',
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Last name',
    },
    externalId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'External system identifier (must be unique)',
    },
    publicMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Public metadata (JSON object)',
    },
    privateMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Private metadata (JSON object)',
    },
    unsafeMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Unsafe metadata (JSON object)',
    },
    skipPasswordChecks: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Skip password validation checks',
    },
    skipPasswordRequirement: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Make password optional',
    },
  },

  request: {
    url: 'https://api.clerk.com/v1/users',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {}
      if (params.emailAddress) {
        body.email_address = (params.emailAddress as string).split(',').map((e) => e.trim())
      }
      if (params.phoneNumber) {
        body.phone_number = (params.phoneNumber as string).split(',').map((p) => p.trim())
      }
      if (params.username) body.username = (params.username as string).trim()
      if (params.password) body.password = params.password
      if (params.firstName) body.first_name = (params.firstName as string).trim()
      if (params.lastName) body.last_name = (params.lastName as string).trim()
      if (params.externalId) body.external_id = (params.externalId as string).trim()
      if (params.publicMetadata) body.public_metadata = params.publicMetadata
      if (params.privateMetadata) body.private_metadata = params.privateMetadata
      if (params.unsafeMetadata) body.unsafe_metadata = params.unsafeMetadata
      if (params.skipPasswordChecks !== undefined)
        body.skip_password_checks = params.skipPasswordChecks
      if (params.skipPasswordRequirement !== undefined)
        body.skip_password_requirement = params.skipPasswordRequirement
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to create user in Clerk'
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    id: { type: 'string', description: 'Created user ID' },
    emailAddresses: { type: 'array', description: 'User email addresses' },
  },
}

export const clerkUpdateUserTool: ToolConfig = {
  id: 'clerk_update_user',
  name: 'Update User in Clerk',
  description: 'Update an existing user in your Clerk application.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the user to update',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'First name',
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Last name',
    },
    username: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Username (must be unique)',
    },
    password: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New password (minimum 8 characters)',
    },
    externalId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'External system identifier',
    },
    primaryEmailAddressId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'ID of verified email to set as primary',
    },
    primaryPhoneNumberId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'ID of verified phone to set as primary',
    },
    publicMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Public metadata (JSON object)',
    },
    privateMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Private metadata (JSON object)',
    },
    unsafeMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Unsafe metadata (JSON object)',
    },
    skipPasswordChecks: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Skip password validation checks',
    },
  },

  request: {
    url: (params) => `https://api.clerk.com/v1/users/${String(params.userId).trim()}`,
    method: 'PATCH',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {}
      if (params.firstName !== undefined) body.first_name = (params.firstName as string)?.trim()
      if (params.lastName !== undefined) body.last_name = (params.lastName as string)?.trim()
      if (params.username !== undefined) body.username = (params.username as string)?.trim()
      if (params.password !== undefined) body.password = params.password
      if (params.externalId !== undefined) body.external_id = (params.externalId as string)?.trim()
      if (params.primaryEmailAddressId !== undefined)
        body.primary_email_address_id = (params.primaryEmailAddressId as string)?.trim()
      if (params.primaryPhoneNumberId !== undefined)
        body.primary_phone_number_id = (params.primaryPhoneNumberId as string)?.trim()
      if (params.publicMetadata !== undefined) body.public_metadata = params.publicMetadata
      if (params.privateMetadata !== undefined) body.private_metadata = params.privateMetadata
      if (params.unsafeMetadata !== undefined) body.unsafe_metadata = params.unsafeMetadata
      if (params.skipPasswordChecks !== undefined)
        body.skip_password_checks = params.skipPasswordChecks
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to update user in Clerk'
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    id: { type: 'string', description: 'Updated user ID' },
    emailAddresses: { type: 'array', description: 'User email addresses' },
  },
}

export const clerkDeleteUserTool: ToolConfig = {
  id: 'clerk_delete_user',
  name: 'Delete User from Clerk',
  description: 'Delete a user from your Clerk application.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the user to delete',
    },
  },

  request: {
    url: (params) => `https://api.clerk.com/v1/users/${String(params.userId).trim()}`,
    method: 'DELETE',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to delete user from Clerk'
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    id: { type: 'string', description: 'Deleted user ID' },
    deleted: { type: 'boolean', description: 'Whether the user was deleted' },
  },
}

export const clerkListOrganizationsTool: ToolConfig = {
  id: 'clerk_list_organizations',
  name: 'List Organizations from Clerk',
  description: 'List all organizations in your Clerk application with optional filtering.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (range: 1-500, default: 10)',
    },
    offset: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
    includeMembersCount: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Include member count for each organization',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Search by organization ID, name, or slug',
    },
    orderBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field with +/- prefix',
    },
  },

  request: {
    url: (params) => {
      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())
      if (params.includeMembersCount) queryParams.append('include_members_count', 'true')
      if (params.query) queryParams.append('query', params.query)
      if (params.orderBy) queryParams.append('order_by', params.orderBy)
      const qs = queryParams.toString()
      return qs
        ? `https://api.clerk.com/v1/organizations?${qs}`
        : 'https://api.clerk.com/v1/organizations'
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    if (!response.ok) {
      throw new Error(
        (json as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to list organizations from Clerk'
      )
    }
    const data = json as { data: unknown[]; total_count: number }
    return {
      success: true,
      output: { organizations: data.data, totalCount: data.total_count ?? data.data.length },
    }
  },

  outputs: {
    organizations: { type: 'array', description: 'Array of Clerk organization objects' },
    totalCount: { type: 'number', description: 'Total number of organizations' },
  },
}

export const clerkGetOrganizationTool: ToolConfig = {
  id: 'clerk_get_organization',
  name: 'Get Organization from Clerk',
  description: 'Retrieve a single organization by ID or slug from Clerk.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    organizationId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID or slug of the organization',
    },
  },

  request: {
    url: (params) => `https://api.clerk.com/v1/organizations/${params.organizationId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to get organization from Clerk'
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    id: { type: 'string', description: 'Organization ID' },
    name: { type: 'string', description: 'Organization name' },
  },
}

export const clerkCreateOrganizationTool: ToolConfig = {
  id: 'clerk_create_organization',
  name: 'Create Organization in Clerk',
  description: 'Create a new organization in your Clerk application.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The name of the organization',
    },
    createdBy: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the user who will be the initial admin of the organization',
    },
    slug: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'A unique slug for the organization',
    },
    maxAllowedMemberships: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of memberships allowed (0 for unlimited)',
    },
    publicMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Public metadata (JSON object)',
    },
    privateMetadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Private metadata (JSON object)',
    },
  },

  request: {
    url: 'https://api.clerk.com/v1/organizations',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {
        name: (params.name as string).trim(),
        created_by: (params.createdBy as string).trim(),
      }
      if (params.slug) body.slug = (params.slug as string).trim()
      if (params.maxAllowedMemberships !== undefined)
        body.max_allowed_memberships = params.maxAllowedMemberships
      if (params.publicMetadata) body.public_metadata = params.publicMetadata
      if (params.privateMetadata) body.private_metadata = params.privateMetadata
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to create organization in Clerk'
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    id: { type: 'string', description: 'Created organization ID' },
    name: { type: 'string', description: 'Organization name' },
    slug: { type: 'string', description: 'Organization slug' },
  },
}

export const clerkListSessionsTool: ToolConfig = {
  id: 'clerk_list_sessions',
  name: 'List Sessions from Clerk',
  description: 'List sessions for a user or client in your Clerk application.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    userId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'User ID to list sessions for',
    },
    clientId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Client ID to list sessions for',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Filter by session status (abandoned, active, ended, expired, pending, removed, replaced, revoked)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (range: 1-500, default: 10)',
    },
    offset: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
  },

  request: {
    url: (params) => {
      const queryParams = new URLSearchParams()
      if (params.userId) queryParams.append('user_id', params.userId)
      if (params.clientId) queryParams.append('client_id', params.clientId)
      if (params.status) queryParams.append('status', params.status)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())
      const qs = queryParams.toString()
      return qs ? `https://api.clerk.com/v1/sessions?${qs}` : 'https://api.clerk.com/v1/sessions'
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to list sessions from Clerk'
      )
    }
    const totalCount = Number.parseInt(response.headers.get('x-total-count') || '0', 10)
    return {
      success: true,
      output: { sessions: data, totalCount: totalCount || (data as unknown[]).length },
    }
  },

  outputs: {
    sessions: { type: 'array', description: 'Array of Clerk session objects' },
    totalCount: { type: 'number', description: 'Total number of sessions' },
  },
}

export const clerkRevokeSessionTool: ToolConfig = {
  id: 'clerk_revoke_session',
  name: 'Revoke Session in Clerk',
  description: 'Revoke a session to immediately invalidate it.',
  version: '1.0.0',

  params: {
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The Clerk Secret Key for API authentication',
    },
    sessionId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the session to revoke',
    },
  },

  request: {
    url: (params) => `https://api.clerk.com/v1/sessions/${params.sessionId}/revoke`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { errors?: { message: string }[] }).errors?.[0]?.message ||
          'Failed to revoke session in Clerk'
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    id: { type: 'string', description: 'Session ID' },
    status: { type: 'string', description: 'Session status (revoked)' },
  },
}
