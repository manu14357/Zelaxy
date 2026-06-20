import type { ToolResponse } from '@/tools/types'

export interface MicrosoftAdBaseParams {
  accessToken: string
}

export interface ListUsersParams extends MicrosoftAdBaseParams {
  top?: number
  filter?: string
}

export interface GetUserParams extends MicrosoftAdBaseParams {
  userId: string
}

export interface ListGroupsParams extends MicrosoftAdBaseParams {
  top?: number
  filter?: string
}

export interface CreateUserParams extends MicrosoftAdBaseParams {
  displayName: string
  mailNickname: string
  userPrincipalName: string
  password: string
  accountEnabled?: boolean
}

export interface MicrosoftAdObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface MicrosoftAdListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type MicrosoftAdResponse = MicrosoftAdObjectResponse | MicrosoftAdListResponse
