import type { ToolResponse } from '@/tools/types'

interface AhrefsBaseParams {
  apiKey: string
  date?: string
}

export type AhrefsTargetMode = 'domain' | 'prefix' | 'subdomains' | 'exact'

export interface AhrefsDomainRatingParams extends AhrefsBaseParams {
  target: string
}

export interface AhrefsDomainRatingResponse extends ToolResponse {
  output: {
    domainRating: number
    ahrefsRank: number
  }
}

export interface AhrefsBacklinksParams extends AhrefsBaseParams {
  target: string
  mode?: AhrefsTargetMode
  limit?: number
  offset?: number
}

export interface AhrefsBacklinksResponse extends ToolResponse {
  output: {
    backlinks: Array<{
      urlFrom: string
      urlTo: string
      anchor: string
      domainRatingSource: number
      isDofollow: boolean
      firstSeen: string
      lastVisited: string
    }>
  }
}

export interface AhrefsReferringDomainsParams extends AhrefsBaseParams {
  target: string
  mode?: AhrefsTargetMode
  limit?: number
  offset?: number
}

export interface AhrefsReferringDomainsResponse extends ToolResponse {
  output: {
    referringDomains: Array<{
      domain: string
      domainRating: number
      backlinks: number
      dofollowBacklinks: number
      firstSeen: string
      lastVisited: string
    }>
  }
}

export interface AhrefsOrganicKeywordsParams extends AhrefsBaseParams {
  target: string
  country?: string
  mode?: AhrefsTargetMode
  limit?: number
  offset?: number
}

export interface AhrefsOrganicKeywordsResponse extends ToolResponse {
  output: {
    keywords: Array<{
      keyword: string
      volume: number
      position: number
      url: string
      traffic: number
      keywordDifficulty: number
    }>
  }
}

export interface AhrefsTopPagesParams extends AhrefsBaseParams {
  target: string
  country?: string
  mode?: AhrefsTargetMode
  limit?: number
  offset?: number
  select?: string
}

export interface AhrefsTopPagesResponse extends ToolResponse {
  output: {
    pages: Array<{
      url: string
      traffic: number
      keywords: number
      topKeyword: string
      value: number
    }>
  }
}
