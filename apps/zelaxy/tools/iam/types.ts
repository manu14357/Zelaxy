import type { ToolResponse } from '@/tools/types'

export interface IamBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface IamListUsersParams extends IamBaseParams {}

export interface IamListRolesParams extends IamBaseParams {}

export interface IamGetUserParams extends IamBaseParams {
  userName: string
}

export interface IamResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
