import type { ToolResponse } from '@/tools/types'

export interface RssBaseParams {
  url: string
}

export interface RssFetchFeedParams extends RssBaseParams {
  limit?: number
}

export interface RssFeedItem {
  title: string
  link: string
  pubDate: string
  description: string
}

export interface RssFeedResponse extends ToolResponse {
  output: {
    data: RssFeedItem[]
    metadata: { count: number; title: string }
  }
}

export interface RssFeedInfoResponse extends ToolResponse {
  output: {
    data: { title: string; link: string; description: string }
    metadata: { itemCount: number }
  }
}

export type RssResponse = RssFeedResponse | RssFeedInfoResponse
