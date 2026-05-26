import type { ApolloPeopleSearchParams, ApolloPeopleSearchResponse } from '@/tools/apollo/types'
import type { ToolConfig } from '@/tools/types'

export const apolloPeopleSearchTool: ToolConfig<
  ApolloPeopleSearchParams,
  ApolloPeopleSearchResponse
> = {
  id: 'apollo_people_search',
  name: 'Apollo People Search',
  description: "Search Apollo's database for people using demographic filters",
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Apollo API key',
    },
    person_titles: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Job titles to search for (e.g., ["CEO", "VP of Sales"])',
    },
    include_similar_titles: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to return people with job titles similar to person_titles',
    },
    person_locations: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Locations to search in (e.g., ["San Francisco, CA", "New York, NY"])',
    },
    person_seniorities: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Seniority levels (owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern)',
    },
    organization_ids: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Apollo organization IDs to filter by',
    },
    organization_names: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company names to search within',
    },
    organization_locations: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: "Headquarters locations of the people's current employer",
    },
    q_organization_domains_list: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Employer domain names (e.g., ["apollo.io", "microsoft.com"]) — up to 1,000, no www. or @',
    },
    organization_num_employees_ranges: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Employee count ranges as "min,max" strings (e.g., ["1,10", "250,500"])',
    },
    contact_email_status: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email statuses: "verified", "unverified", "likely to engage", "unavailable"',
    },
    q_keywords: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Keywords to search for',
    },
    page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number for pagination (default 1)',
    },
    per_page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Results per page, max 100 (default 25)',
    },
  },

  request: {
    url: 'https://api.apollo.io/api/v1/mixed_people/search',
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': params.apiKey,
    }),
    body: (params) => {
      const body: Record<string, unknown> = {
        page: params.page || 1,
        per_page: Math.min(params.per_page || 25, 100),
      }
      if (params.person_titles?.length) body.person_titles = params.person_titles
      if (params.include_similar_titles !== undefined)
        body.include_similar_titles = params.include_similar_titles
      if (params.person_locations?.length) body.person_locations = params.person_locations
      if (params.person_seniorities?.length) body.person_seniorities = params.person_seniorities
      if (params.organization_ids?.length) body.organization_ids = params.organization_ids
      if (params.organization_names?.length) body.organization_names = params.organization_names
      if (params.organization_locations?.length)
        body.organization_locations = params.organization_locations
      if (params.q_organization_domains_list?.length)
        body.q_organization_domains_list = params.q_organization_domains_list
      if (params.organization_num_employees_ranges?.length)
        body.organization_num_employees_ranges = params.organization_num_employees_ranges
      if (params.contact_email_status?.length)
        body.contact_email_status = params.contact_email_status
      if (params.q_keywords) body.q_keywords = params.q_keywords
      return body
    },
  },

  transformResponse: async (response: Response) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`)
    }
    const data = await response.json()
    return {
      success: true,
      output: {
        people: data.people || [],
        page: data.pagination?.page || 1,
        per_page: data.pagination?.per_page || 25,
        total_entries: data.pagination?.total_entries || 0,
      },
    }
  },

  outputs: {
    people: { type: 'json', description: 'Array of people matching the search criteria' },
    page: { type: 'number', description: 'Current page number' },
    per_page: { type: 'number', description: 'Results per page' },
    total_entries: { type: 'number', description: 'Total matching entries' },
  },
}
