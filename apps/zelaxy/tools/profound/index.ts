import type { OutputProperty, ToolConfig } from '@/tools/types'

const PROFOUND_API_URL_V1 = 'https://api.tryprofound.com/v1'
const PROFOUND_API_URL_V2 = 'https://api.tryprofound.com/v2'

function profoundHeaders(apiKey: string, json = false): Record<string, string> {
  const headers: Record<string, string> = {
    'X-API-Key': apiKey,
    Accept: 'application/json',
  }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

function parseFilters(filters: string | undefined): unknown[] | undefined {
  if (!filters) return undefined
  try {
    return JSON.parse(filters)
  } catch {
    throw new Error('Invalid JSON in filters parameter')
  }
}

function buildReportBody(
  params: any,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...extra }
  if (params.startDate) body.start_date = params.startDate
  if (params.endDate) body.end_date = params.endDate
  if (params.metrics) body.metrics = params.metrics.split(',').map((m: string) => m.trim())
  if (params.dimensions) body.dimensions = params.dimensions.split(',').map((d: string) => d.trim())
  if (params.dateInterval) body.date_interval = params.dateInterval
  const filters = parseFilters(params.filters)
  if (filters) body.filters = filters
  if (params.limit != null) body.pagination = { limit: params.limit }
  return body
}

function transformReportResponse(data: any) {
  return {
    success: true,
    output: {
      totalRows: data.info?.total_rows ?? (Array.isArray(data) ? data.length : 0),
      data: (Array.isArray(data) ? data : (data.data ?? [])).map((row: any) => ({
        metrics: row.metrics ?? [],
        dimensions: row.dimensions ?? [],
      })),
    },
  }
}

const reportOutputs: Record<string, OutputProperty> = {
  totalRows: { type: 'number', description: 'Total number of rows in the report' },
  data: {
    type: 'json',
    description: 'Report data rows with metrics and dimension values',
    properties: {
      metrics: { type: 'json', description: 'Array of metric values' },
      dimensions: { type: 'json', description: 'Array of dimension values' },
    },
  },
}

// ─── List endpoints ──────────────────────────────────────────────────────────

export const profoundListCategoriesTool: ToolConfig = {
  id: 'profound_list_categories',
  name: 'Profound List Categories',
  description: 'List all organization categories in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/org/categories`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list categories')
    return {
      success: true,
      output: {
        categories: (data ?? []).map((item: any) => ({
          id: item.id ?? null,
          name: item.name ?? null,
        })),
      },
    }
  },
  outputs: {
    categories: { type: 'json', description: 'List of organization categories' },
  },
}

export const profoundListAssetsTool: ToolConfig = {
  id: 'profound_list_assets',
  name: 'Profound List Assets',
  description: 'List all assets in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/org/assets`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list assets')
    return {
      success: true,
      output: {
        assets: (data ?? []).map((item: any) => ({
          id: item.id ?? null,
          name: item.name ?? null,
          website: item.website ?? null,
          alternateDomains: item.alternate_domains ?? null,
          isOwned: item.is_owned ?? false,
          createdAt: item.created_at ?? null,
          logoUrl: item.logo_url ?? null,
        })),
      },
    }
  },
  outputs: {
    assets: { type: 'json', description: 'List of assets' },
  },
}

export const profoundListDomainsTool: ToolConfig = {
  id: 'profound_list_domains',
  name: 'Profound List Domains',
  description: 'List all domains in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/org/domains`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list domains')
    return { success: true, output: { domains: data ?? [] } }
  },
  outputs: {
    domains: { type: 'json', description: 'List of domains' },
  },
}

export const profoundListModelsTool: ToolConfig = {
  id: 'profound_list_models',
  name: 'Profound List Models',
  description: 'List all AI models tracked in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/org/models`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list models')
    return { success: true, output: { models: data ?? [] } }
  },
  outputs: {
    models: { type: 'json', description: 'List of AI models' },
  },
}

export const profoundListPersonasTool: ToolConfig = {
  id: 'profound_list_personas',
  name: 'Profound List Personas',
  description: 'List all personas in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/org/personas`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list personas')
    return { success: true, output: { personas: data ?? [] } }
  },
  outputs: {
    personas: { type: 'json', description: 'List of personas' },
  },
}

export const profoundListRegionsTool: ToolConfig = {
  id: 'profound_list_regions',
  name: 'Profound List Regions',
  description: 'List all regions in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/org/regions`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list regions')
    return { success: true, output: { regions: data ?? [] } }
  },
  outputs: {
    regions: { type: 'json', description: 'List of regions' },
  },
}

// ─── Category-scoped endpoints ───────────────────────────────────────────────

export const profoundCategoryAssetsTool: ToolConfig = {
  id: 'profound_category_assets',
  name: 'Profound Category Assets',
  description: 'List assets for a specific category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
  },
  request: {
    url: (params: any) =>
      `${PROFOUND_API_URL_V1}/org/categories/${encodeURIComponent(params.categoryId)}/assets`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list category assets')
    return {
      success: true,
      output: {
        assets: (data ?? []).map((item: any) => ({
          id: item.id ?? null,
          name: item.name ?? null,
          website: item.website ?? null,
          alternateDomains: item.alternate_domains ?? null,
          isOwned: item.is_owned ?? false,
          createdAt: item.created_at ?? null,
          logoUrl: item.logo_url ?? null,
        })),
      },
    }
  },
  outputs: {
    assets: { type: 'json', description: 'List of assets in the category' },
  },
}

export const profoundCategoryPersonasTool: ToolConfig = {
  id: 'profound_category_personas',
  name: 'Profound Category Personas',
  description: 'List personas for a specific category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
  },
  request: {
    url: (params: any) =>
      `${PROFOUND_API_URL_V1}/org/categories/${encodeURIComponent(params.categoryId)}/personas`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list category personas')
    return { success: true, output: { personas: data.data ?? data ?? [] } }
  },
  outputs: {
    personas: { type: 'json', description: 'List of personas in the category' },
  },
}

export const profoundCategoryPromptsTool: ToolConfig = {
  id: 'profound_category_prompts',
  name: 'Profound Category Prompts',
  description: 'List prompts for a specific category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor',
    },
    orderDir: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction: asc or desc',
    },
    promptType: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated prompt types: visibility, sentiment',
    },
    topicId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated topic IDs',
    },
    tagId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated tag IDs',
    },
    regionId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated region IDs',
    },
    platformId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated platform IDs',
    },
  },
  request: {
    url: (params: any) => {
      const url = new URL(
        `${PROFOUND_API_URL_V1}/org/categories/${encodeURIComponent(params.categoryId)}/prompts`
      )
      if (params.limit != null) url.searchParams.set('limit', String(params.limit))
      if (params.cursor) url.searchParams.set('cursor', params.cursor)
      if (params.orderDir) url.searchParams.set('order_dir', params.orderDir)
      if (params.promptType) {
        params.promptType
          .split(',')
          .forEach((t: string) => url.searchParams.append('prompt_type', t.trim()))
      }
      if (params.topicId) {
        params.topicId
          .split(',')
          .forEach((t: string) => url.searchParams.append('topic_id', t.trim()))
      }
      if (params.tagId) {
        params.tagId.split(',').forEach((t: string) => url.searchParams.append('tag_id', t.trim()))
      }
      if (params.regionId) {
        params.regionId
          .split(',')
          .forEach((t: string) => url.searchParams.append('region_id', t.trim()))
      }
      if (params.platformId) {
        params.platformId
          .split(',')
          .forEach((t: string) => url.searchParams.append('platform_id', t.trim()))
      }
      return url.toString()
    },
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list category prompts')
    return {
      success: true,
      output: {
        prompts: data.data ?? data ?? [],
        cursor: data.cursor ?? null,
        hasMore: data.has_more ?? false,
      },
    }
  },
  outputs: {
    prompts: { type: 'json', description: 'List of prompts in the category' },
    cursor: { type: 'string', description: 'Pagination cursor' },
    hasMore: { type: 'boolean', description: 'Whether more results are available' },
  },
}

export const profoundCategoryTagsTool: ToolConfig = {
  id: 'profound_category_tags',
  name: 'Profound Category Tags',
  description: 'List tags for a specific category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
  },
  request: {
    url: (params: any) =>
      `${PROFOUND_API_URL_V1}/org/categories/${encodeURIComponent(params.categoryId)}/tags`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list category tags')
    return {
      success: true,
      output: {
        tags: (data ?? []).map((item: any) => ({ id: item.id ?? null, name: item.name ?? null })),
      },
    }
  },
  outputs: {
    tags: { type: 'json', description: 'List of tags in the category' },
  },
}

export const profoundCategoryTopicsTool: ToolConfig = {
  id: 'profound_category_topics',
  name: 'Profound Category Topics',
  description: 'List topics for a specific category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
  },
  request: {
    url: (params: any) =>
      `${PROFOUND_API_URL_V1}/org/categories/${encodeURIComponent(params.categoryId)}/topics`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list category topics')
    return {
      success: true,
      output: {
        topics: (data ?? []).map((item: any) => ({ id: item.id ?? null, name: item.name ?? null })),
      },
    }
  },
  outputs: {
    topics: { type: 'json', description: 'List of topics in the category' },
  },
}

// ─── Content optimization endpoints ─────────────────────────────────────────

export const profoundListOptimizationsTool: ToolConfig = {
  id: 'profound_list_optimizations',
  name: 'Profound List Optimizations',
  description: 'List content optimization entries for an asset in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    assetId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Asset ID (UUID)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
    offset: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Offset for pagination',
    },
  },
  request: {
    url: (params: any) => {
      const url = new URL(
        `${PROFOUND_API_URL_V1}/content/${encodeURIComponent(params.assetId)}/optimization`
      )
      if (params.limit != null) url.searchParams.set('limit', String(params.limit))
      if (params.offset != null) url.searchParams.set('offset', String(params.offset))
      return url.toString()
    },
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to list optimizations')
    return {
      success: true,
      output: {
        totalRows: data.info?.total_rows ?? 0,
        optimizations: (data.data ?? []).map((item: any) => ({
          id: item.id ?? null,
          title: item.title ?? null,
          createdAt: item.created_at ?? null,
          extractedInput: item.extracted_input ?? null,
          type: item.type ?? null,
          status: item.status ?? null,
        })),
      },
    }
  },
  outputs: {
    totalRows: { type: 'number', description: 'Total number of optimization entries' },
    optimizations: { type: 'json', description: 'List of content optimization entries' },
  },
}

export const profoundOptimizationAnalysisTool: ToolConfig = {
  id: 'profound_optimization_analysis',
  name: 'Profound Optimization Analysis',
  description: 'Get detailed content optimization analysis for a specific content item in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    assetId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Asset ID (UUID)',
    },
    contentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Content/optimization ID (UUID)',
    },
  },
  request: {
    url: (params: any) =>
      `${PROFOUND_API_URL_V1}/content/${encodeURIComponent(params.assetId)}/optimization/${encodeURIComponent(params.contentId)}`,
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.detail?.[0]?.msg || 'Failed to get optimization analysis')
    return { success: true, output: { analysis: data.data ?? data } }
  },
  outputs: {
    analysis: { type: 'json', description: 'Detailed content optimization analysis' },
  },
}

// ─── Citation prompts endpoint ───────────────────────────────────────────────

export const profoundCitationPromptsTool: ToolConfig = {
  id: 'profound_citation_prompts',
  name: 'Profound Citation Prompts',
  description: 'Get prompts that cite a specific domain across AI platforms in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    inputDomain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Domain to look up citations for (e.g. ramp.com)',
    },
  },
  request: {
    url: (params: any) => {
      const url = new URL(`${PROFOUND_API_URL_V1}/prompt-volumes/citation-prompts`)
      url.searchParams.set('input_domain', params.inputDomain)
      return url.toString()
    },
    method: 'GET',
    headers: (params: any) => profoundHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to get citation prompts')
    return { success: true, output: { data: data ?? null } }
  },
  outputs: {
    data: { type: 'json', description: 'Citation prompt data for the queried domain' },
  },
}

// ─── Report endpoints (POST) ─────────────────────────────────────────────────

export const profoundVisibilityReportTool: ToolConfig = {
  id: 'profound_visibility_report',
  name: 'Profound Visibility Report',
  description: 'Query AI visibility report for a category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    metrics: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Comma-separated metrics: share_of_voice, mentions_count, visibility_score, executions, average_position',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated dimensions',
    },
    dateInterval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Date interval: hour, day, week, month, year',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/reports/visibility`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => buildReportBody(params, { category_id: params.categoryId }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to query visibility report')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundCitationsReportTool: ToolConfig = {
  id: 'profound_citations_report',
  name: 'Profound Citations Report',
  description: 'Query citations report for a category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    metrics: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated metrics: count, citation_share',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated dimensions',
    },
    dateInterval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Date interval',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/reports/citations`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => buildReportBody(params, { category_id: params.categoryId }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to query citations report')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundSentimentReportTool: ToolConfig = {
  id: 'profound_sentiment_report',
  name: 'Profound Sentiment Report',
  description: 'Query sentiment report for a category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    metrics: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated metrics: positive, negative, occurrences',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated dimensions',
    },
    dateInterval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Date interval',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/reports/sentiment`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => buildReportBody(params, { category_id: params.categoryId }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to query sentiment report')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundQueryFanoutsTool: ToolConfig = {
  id: 'profound_query_fanouts',
  name: 'Profound Query Fanouts',
  description:
    'Query fanout report showing how AI models expand prompts into sub-queries in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    metrics: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated metrics: fanouts_per_execution, total_fanouts, share',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated dimensions: prompt, query, model, region, date',
    },
    dateInterval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Date interval',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/reports/query-fanouts`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => buildReportBody(params, { category_id: params.categoryId }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to query fanouts report')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundPromptAnswersTool: ToolConfig = {
  id: 'profound_prompt_answers',
  name: 'Profound Prompt Answers',
  description: 'Get raw prompt answers data for a category in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    categoryId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Category ID (UUID)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/prompts/answers`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => {
      const body: Record<string, unknown> = {
        category_id: params.categoryId,
        start_date: params.startDate,
        end_date: params.endDate,
      }
      const filters = parseFilters(params.filters)
      if (filters) body.filters = filters
      if (params.limit != null) body.pagination = { limit: params.limit }
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to get prompt answers')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundPromptVolumeTool: ToolConfig = {
  id: 'profound_prompt_volume',
  name: 'Profound Prompt Volume',
  description:
    'Query prompt volume data to understand search demand across AI platforms in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    metrics: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated metrics: volume, change',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Comma-separated dimensions: keyword, date, platform, country_code, matching_type, frequency',
    },
    dateInterval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Date interval',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/prompt-volumes/volume`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => buildReportBody(params, {}),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to get prompt volume')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundBotsReportTool: ToolConfig = {
  id: 'profound_bots_report',
  name: 'Profound Bots Report',
  description: 'Query bot traffic report for a domain in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Domain (e.g. example.com)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    metrics: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated metrics: count, citations, indexing, training, last_visit',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated dimensions',
    },
    dateInterval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Date interval',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V2}/reports/bots`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => buildReportBody(params, { domain: params.domain }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to query bots report')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundReferralsReportTool: ToolConfig = {
  id: 'profound_referrals_report',
  name: 'Profound Referrals Report',
  description: 'Query human referral traffic report for a domain in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Domain (e.g. example.com)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    metrics: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated metrics: visits, last_visit',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated dimensions',
    },
    dateInterval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Date interval',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V2}/reports/referrals`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => buildReportBody(params, { domain: params.domain }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to query referrals report')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundBotLogsTool: ToolConfig = {
  id: 'profound_bot_logs',
  name: 'Profound Bot Logs',
  description: 'Get identified bot visit logs with filters for a domain in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Domain (e.g. example.com)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Comma-separated dimensions: timestamp, method, host, path, status_code, ip, user_agent, referer, bytes_sent, duration_ms, query_params, bot_name, bot_provider, bot_types',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/logs/raw/bots`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => {
      const body: Record<string, unknown> = {
        domain: params.domain,
        start_date: params.startDate,
        metrics: ['count'],
      }
      if (params.endDate) body.end_date = params.endDate
      if (params.dimensions)
        body.dimensions = params.dimensions.split(',').map((d: string) => d.trim())
      const filters = parseFilters(params.filters)
      if (filters) body.filters = filters
      if (params.limit != null) body.pagination = { limit: params.limit }
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to get bot logs')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}

export const profoundRawLogsTool: ToolConfig = {
  id: 'profound_raw_logs',
  name: 'Profound Raw Logs',
  description: 'Get raw traffic logs with filters for a domain in Profound',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Profound API Key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Domain (e.g. example.com)',
    },
    startDate: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date (YYYY-MM-DD)',
    },
    endDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'End date (YYYY-MM-DD)',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Comma-separated dimensions: timestamp, method, host, path, status_code, ip, user_agent, referer, bytes_sent, duration_ms, query_params',
    },
    filters: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON array of filter objects',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max results',
    },
  },
  request: {
    url: `${PROFOUND_API_URL_V1}/logs/raw`,
    method: 'POST',
    headers: (params: any) => profoundHeaders(params.apiKey, true),
    body: (params: any) => {
      const body: Record<string, unknown> = {
        domain: params.domain,
        start_date: params.startDate,
        metrics: ['count'],
      }
      if (params.endDate) body.end_date = params.endDate
      if (params.dimensions)
        body.dimensions = params.dimensions.split(',').map((d: string) => d.trim())
      const filters = parseFilters(params.filters)
      if (filters) body.filters = filters
      if (params.limit != null) body.pagination = { limit: params.limit }
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail?.[0]?.msg || 'Failed to get raw logs')
    return transformReportResponse(data)
  },
  outputs: reportOutputs,
}
