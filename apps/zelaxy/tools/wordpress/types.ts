import type { ToolResponse } from '@/tools/types'

export interface WordpressBaseParams {
  siteUrl: string
  username: string
  appPassword: string
}

export interface CreatePostParams extends WordpressBaseParams {
  title: string
  content?: string
  status?: string
}

export interface ListPostsParams extends WordpressBaseParams {
  perPage?: number
}

export interface GetPostParams extends WordpressBaseParams {
  postId: string
}

export interface UpdatePostParams extends WordpressBaseParams {
  postId: string
  title?: string
  content?: string
  status?: string
}

export interface WordpressObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface WordpressListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type WordpressResponse = WordpressObjectResponse | WordpressListResponse

export function wordpressAuthHeader(params: WordpressBaseParams): string {
  return `Basic ${Buffer.from(`${params.username}:${params.appPassword}`).toString('base64')}`
}
