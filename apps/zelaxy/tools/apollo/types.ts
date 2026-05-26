import type { ToolResponse } from '@/tools/types'

// People Search
export interface ApolloPeopleSearchParams {
  apiKey: string
  person_titles?: string[]
  include_similar_titles?: boolean
  person_locations?: string[]
  person_seniorities?: string[]
  organization_ids?: string[]
  organization_names?: string[]
  organization_locations?: string[]
  q_organization_domains_list?: string[]
  organization_num_employees_ranges?: string[]
  contact_email_status?: string[]
  q_keywords?: string
  page?: number
  per_page?: number
}

export interface ApolloPeopleSearchResponse extends ToolResponse {
  output: {
    people: Record<string, unknown>[]
    page: number
    per_page: number
    total_entries: number
  }
}

// People Enrich
export interface ApolloPeopleEnrichParams {
  apiKey: string
  first_name?: string
  last_name?: string
  name?: string
  id?: string
  hashed_email?: string
  email?: string
  organization_name?: string
  domain?: string
  linkedin_url?: string
  reveal_personal_emails?: boolean
  reveal_phone_number?: boolean
  webhook_url?: string
}

export interface ApolloPeopleEnrichResponse extends ToolResponse {
  output: {
    person: Record<string, unknown> | null
    enriched: boolean
  }
}

// Organization Search
export interface ApolloOrganizationSearchParams {
  apiKey: string
  organization_locations?: string[]
  organization_not_locations?: string[]
  organization_num_employees_ranges?: string[]
  q_organization_keyword_tags?: string[]
  q_organization_name?: string
  organization_ids?: string[]
  q_organization_domains_list?: string[]
  page?: number
  per_page?: number
}

export interface ApolloOrganizationSearchResponse extends ToolResponse {
  output: {
    organizations: Record<string, unknown>[]
    page: number
    per_page: number
    total_entries: number
  }
}

// Organization Enrich
export interface ApolloOrganizationEnrichParams {
  apiKey: string
  domain: string
}

export interface ApolloOrganizationEnrichResponse extends ToolResponse {
  output: {
    organization: Record<string, unknown> | null
    enriched: boolean
  }
}

// Find Email
export interface ApolloFindEmailParams {
  apiKey: string
  first_name?: string
  last_name?: string
  name?: string
  domain?: string
  organization_name?: string
  linkedin_url?: string
}

export interface ApolloFindEmailResponse extends ToolResponse {
  output: {
    email: string | null
    emailStatus: string | null
    person: Record<string, unknown> | null
    found: boolean
  }
}
