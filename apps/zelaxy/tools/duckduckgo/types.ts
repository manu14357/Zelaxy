import type { ToolResponse } from '@/tools/types'

export interface DuckDuckGoTextSearchParams {
  query: string
  noHtml?: boolean
  skipDisambig?: boolean
}

export interface DuckDuckGoNewsSearchParams {
  query: string
  maxResults?: number
  region?: string
}

export interface DuckDuckGoImagesSearchParams {
  query: string
  maxResults?: number
  region?: string
}

interface DuckDuckGoRelatedTopic {
  FirstURL?: string
  Text?: string
  Result?: string
  Icon?: {
    URL?: string
    Height?: string
    Width?: string
  }
}

interface DuckDuckGoResult {
  FirstURL?: string
  Text?: string
  Result?: string
  Icon?: {
    URL?: string
    Height?: string
    Width?: string
  }
}

interface DuckDuckGoTextSearchOutput {
  heading: string
  abstract: string
  abstractText: string
  abstractSource: string
  abstractURL: string
  image: string
  answer: string
  answerType: string
  type: string
  relatedTopics: DuckDuckGoRelatedTopic[]
  results: DuckDuckGoResult[]
}

export interface DuckDuckGoTextSearchResponse extends ToolResponse {
  output: DuckDuckGoTextSearchOutput
}

export interface DuckDuckGoNewsSearchResponse extends ToolResponse {
  output: {
    results: Array<{
      title: string
      url: string
      source: string
      date: string
      excerpt: string
    }>
  }
}

export interface DuckDuckGoImagesSearchResponse extends ToolResponse {
  output: {
    results: Array<{
      title: string
      url: string
      thumbnail: string
      source: string
      width: number
      height: number
    }>
  }
}

export type DuckDuckGoResponse =
  | DuckDuckGoTextSearchResponse
  | DuckDuckGoNewsSearchResponse
  | DuckDuckGoImagesSearchResponse
