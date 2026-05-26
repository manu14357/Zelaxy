import type { ToolConfig } from '@/tools/types'

export const cloudflareListZonesTool: ToolConfig = {
  id: 'cloudflare_list_zones',
  name: 'Cloudflare List Zones',
  description: 'Lists all zones (domains) in the Cloudflare account.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cloudflare API Token',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter zones by domain name',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by zone status: initializing, pending, active, or moved',
    },
    page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number for pagination (default: 1)',
    },
    per_page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of zones per page (default: 20, max: 50)',
    },
    accountId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter zones by account ID',
    },
    order: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field (name, status, account.id, account.name)',
    },
    direction: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (asc, desc)',
    },
    match: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Match logic for filters (any, all)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.cloudflare.com/client/v4/zones')
      if (params.name) url.searchParams.append('name', params.name)
      if (params.status) url.searchParams.append('status', params.status)
      if (params.page) url.searchParams.append('page', String(params.page))
      if (params.per_page) url.searchParams.append('per_page', String(params.per_page))
      if (params.accountId) url.searchParams.append('account.id', params.accountId)
      if (params.order) url.searchParams.append('order', params.order)
      if (params.direction) url.searchParams.append('direction', params.direction)
      if (params.match) url.searchParams.append('match', params.match)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = (await response.json()) as {
      success: boolean
      result?: unknown[]
      result_info?: { total_count: number }
      errors?: { message: string }[]
    }
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'Failed to list zones')
    }
    return {
      success: true,
      output: {
        zones: data.result ?? [],
        total_count: data.result_info?.total_count ?? data.result?.length ?? 0,
      },
    }
  },

  outputs: {
    zones: { type: 'array', description: 'List of zones/domains' },
    total_count: { type: 'number', description: 'Total number of zones' },
  },
}

export const cloudflareGetZoneTool: ToolConfig = {
  id: 'cloudflare_get_zone',
  name: 'Cloudflare Get Zone',
  description: 'Gets details for a specific zone (domain) by its ID.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cloudflare API Token',
    },
    zoneId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The zone ID to retrieve details for',
    },
  },

  request: {
    url: (params) => `https://api.cloudflare.com/client/v4/zones/${params.zoneId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = (await response.json()) as {
      success: boolean
      result?: unknown
      errors?: { message: string }[]
    }
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'Failed to get zone')
    }
    return { success: true, output: data.result }
  },

  outputs: {
    id: { type: 'string', description: 'Zone ID' },
    name: { type: 'string', description: 'Domain name' },
    status: { type: 'string', description: 'Zone status' },
  },
}

export const cloudflareListDnsRecordsTool: ToolConfig = {
  id: 'cloudflare_list_dns_records',
  name: 'Cloudflare List DNS Records',
  description: 'Lists DNS records for a specific zone.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cloudflare API Token',
    },
    zoneId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The zone ID to list DNS records for',
    },
    type: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by record type (A, AAAA, CNAME, MX, TXT)',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by record name (exact match)',
    },
    content: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by record content (exact match)',
    },
    page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number for pagination',
    },
    per_page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Records per page (default: 100)',
    },
    search: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Free-text search across record fields',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://api.cloudflare.com/client/v4/zones/${params.zoneId}/dns_records`)
      if (params.type) url.searchParams.append('type', params.type)
      if (params.name) url.searchParams.append('name', params.name)
      if (params.content) url.searchParams.append('content', params.content)
      if (params.page) url.searchParams.append('page', String(params.page))
      if (params.per_page) url.searchParams.append('per_page', String(params.per_page))
      if (params.search) url.searchParams.append('search', params.search)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = (await response.json()) as {
      success: boolean
      result?: unknown[]
      result_info?: { total_count: number }
      errors?: { message: string }[]
    }
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'Failed to list DNS records')
    }
    return {
      success: true,
      output: {
        records: data.result ?? [],
        total_count: data.result_info?.total_count ?? data.result?.length ?? 0,
      },
    }
  },

  outputs: {
    records: { type: 'array', description: 'List of DNS records' },
    total_count: { type: 'number', description: 'Total number of DNS records' },
  },
}

export const cloudflareCreateDnsRecordTool: ToolConfig = {
  id: 'cloudflare_create_dns_record',
  name: 'Cloudflare Create DNS Record',
  description: 'Creates a new DNS record for a zone.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cloudflare API Token',
    },
    zoneId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The zone ID to create the DNS record in',
    },
    type: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'DNS record type (A, AAAA, CNAME, MX, TXT, NS, SRV)',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'DNS record name',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'DNS record content',
    },
    ttl: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Time to live in seconds (1 = automatic)',
    },
    proxied: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to enable Cloudflare proxy',
    },
    priority: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Priority for MX and SRV records',
    },
    comment: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comment for the DNS record',
    },
  },

  request: {
    url: (params) => `https://api.cloudflare.com/client/v4/zones/${params.zoneId}/dns_records`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {
        type: params.type,
        name: params.name,
        content: params.content,
      }
      if (params.ttl !== undefined) body.ttl = Number(params.ttl)
      if (params.proxied !== undefined) body.proxied = params.proxied
      if (params.priority !== undefined) body.priority = Number(params.priority)
      if (params.comment) body.comment = params.comment
      return body
    },
  },

  transformResponse: async (response) => {
    const data = (await response.json()) as {
      success: boolean
      result?: unknown
      errors?: { message: string }[]
    }
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'Failed to create DNS record')
    }
    return { success: true, output: data.result }
  },

  outputs: {
    id: { type: 'string', description: 'Created DNS record ID' },
    name: { type: 'string', description: 'DNS record name' },
    type: { type: 'string', description: 'DNS record type' },
  },
}

export const cloudflareUpdateDnsRecordTool: ToolConfig = {
  id: 'cloudflare_update_dns_record',
  name: 'Cloudflare Update DNS Record',
  description: 'Updates an existing DNS record for a zone.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cloudflare API Token',
    },
    zoneId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The zone ID containing the DNS record',
    },
    recordId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The DNS record ID to update',
    },
    type: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'DNS record type',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'DNS record name',
    },
    content: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'DNS record content',
    },
    ttl: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Time to live in seconds (1 = automatic)',
    },
    proxied: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to enable Cloudflare proxy',
    },
    priority: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Priority for MX and SRV records',
    },
    comment: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comment for the DNS record',
    },
  },

  request: {
    url: (params) =>
      `https://api.cloudflare.com/client/v4/zones/${params.zoneId}/dns_records/${params.recordId}`,
    method: 'PATCH',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {}
      if (params.type !== undefined) body.type = params.type
      if (params.name !== undefined) body.name = params.name
      if (params.content !== undefined) body.content = params.content
      if (params.ttl !== undefined) body.ttl = Number(params.ttl)
      if (params.proxied !== undefined) body.proxied = params.proxied
      if (params.priority !== undefined) body.priority = Number(params.priority)
      if (params.comment !== undefined) body.comment = params.comment
      return body
    },
  },

  transformResponse: async (response) => {
    const data = (await response.json()) as {
      success: boolean
      result?: unknown
      errors?: { message: string }[]
    }
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'Failed to update DNS record')
    }
    return { success: true, output: data.result }
  },

  outputs: {
    id: { type: 'string', description: 'Updated DNS record ID' },
    name: { type: 'string', description: 'DNS record name' },
  },
}

export const cloudflareDeleteDnsRecordTool: ToolConfig = {
  id: 'cloudflare_delete_dns_record',
  name: 'Cloudflare Delete DNS Record',
  description: 'Deletes a DNS record from a zone.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cloudflare API Token',
    },
    zoneId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The zone ID containing the DNS record',
    },
    recordId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The DNS record ID to delete',
    },
  },

  request: {
    url: (params) =>
      `https://api.cloudflare.com/client/v4/zones/${params.zoneId}/dns_records/${params.recordId}`,
    method: 'DELETE',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = (await response.json()) as {
      success: boolean
      result?: { id: string }
      errors?: { message: string }[]
    }
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'Failed to delete DNS record')
    }
    return { success: true, output: { id: data.result?.id ?? '' } }
  },

  outputs: {
    id: { type: 'string', description: 'Deleted record ID' },
  },
}

export const cloudflarePurgeCacheTool: ToolConfig = {
  id: 'cloudflare_purge_cache',
  name: 'Cloudflare Purge Cache',
  description: 'Purges cached content for a zone.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cloudflare API Token',
    },
    zoneId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The zone ID to purge cache for',
    },
    purge_everything: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Set to true to purge all cached content',
    },
    files: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of URLs to purge from cache',
    },
    tags: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of cache tags to purge (Enterprise only)',
    },
    hosts: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of hostnames to purge (Enterprise only)',
    },
    prefixes: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of URL prefixes to purge (Enterprise only)',
    },
  },

  request: {
    url: (params) => `https://api.cloudflare.com/client/v4/zones/${params.zoneId}/purge_cache`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      if (params.purge_everything) return { purge_everything: true }
      const body: Record<string, string[]> = {}
      if (params.files)
        body.files = (params.files as string)
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
      if (params.tags)
        body.tags = (params.tags as string)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      if (params.hosts)
        body.hosts = (params.hosts as string)
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean)
      if (params.prefixes)
        body.prefixes = (params.prefixes as string)
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      if (Object.keys(body).length === 0) {
        throw new Error(
          'No purge targets specified. Provide files, tags, hosts, prefixes, or set purge_everything to true.'
        )
      }
      return body
    },
  },

  transformResponse: async (response) => {
    const data = (await response.json()) as {
      success: boolean
      result?: { id: string }
      errors?: { message: string }[]
    }
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'Failed to purge cache')
    }
    return { success: true, output: { id: data.result?.id ?? '' } }
  },

  outputs: {
    id: { type: 'string', description: 'Purge request identifier returned by Cloudflare' },
  },
}
