import type { ToolConfig } from '@/tools/types'

const HEX_BASE_URL = 'https://app.hex.tech/api/v1'

function hexHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

export const hexCancelRunTool: ToolConfig = {
  id: 'hex_cancel_run',
  name: 'Cancel Run',
  description: 'Cancel a running Hex project run',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Hex project ID',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Run ID to cancel',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/projects/${params.projectId}/runs/${params.runId}`,
    method: 'DELETE',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response, params: any) => {
    if (response.status === 204 || response.ok) {
      return {
        success: true,
        output: { success: true, projectId: params.projectId, runId: params.runId },
      }
    }
    const data = await response.json()
    throw new Error(data.message || `Hex API error: ${response.status}`)
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the run was cancelled' },
    projectId: { type: 'string', description: 'Project ID' },
    runId: { type: 'string', description: 'Run ID that was cancelled' },
  },
}

export const hexCreateCollectionTool: ToolConfig = {
  id: 'hex_create_collection',
  name: 'Create Collection',
  description: 'Create a new Hex collection',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Collection name',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Collection description',
    },
  },
  request: {
    url: () => `${HEX_BASE_URL}/collections`,
    method: 'POST',
    headers: (params: any) => hexHeaders(params.apiKey),
    body: (params: any) => {
      const body: any = { name: params.name }
      if (params.description) body.description = params.description
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        id: data.id,
        name: data.name,
        description: data.description,
        creator: data.creator,
      },
    }
  },
  outputs: {
    id: { type: 'string', description: 'Collection ID' },
    name: { type: 'string', description: 'Collection name' },
    description: { type: 'string', description: 'Collection description' },
    creator: { type: 'json', description: 'Creator info' },
  },
}

export const hexGetCollectionTool: ToolConfig = {
  id: 'hex_get_collection',
  name: 'Get Collection',
  description: 'Get details of a Hex collection',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    collectionId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Collection ID',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/collections/${params.collectionId}`,
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        id: data.id,
        name: data.name,
        description: data.description,
        creator: data.creator,
      },
    }
  },
  outputs: {
    id: { type: 'string', description: 'Collection ID' },
    name: { type: 'string', description: 'Collection name' },
    description: { type: 'string', description: 'Collection description' },
    creator: { type: 'json', description: 'Creator info' },
  },
}

export const hexGetDataConnectionTool: ToolConfig = {
  id: 'hex_get_data_connection',
  name: 'Get Data Connection',
  description: 'Get details of a Hex data connection',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    dataConnectionId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Data connection ID',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/data-connections/${params.dataConnectionId}`,
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        id: data.id,
        name: data.name,
        type: data.type,
        description: data.description,
        connectViaSsh: data.connectViaSsh,
        includeMagic: data.includeMagic,
        allowWritebackCells: data.allowWritebackCells,
      },
    }
  },
  outputs: {
    id: { type: 'string', description: 'Data connection ID' },
    name: { type: 'string', description: 'Data connection name' },
    type: { type: 'string', description: 'Connection type' },
    description: { type: 'string', description: 'Connection description' },
    connectViaSsh: { type: 'boolean', description: 'Whether SSH tunnel is used' },
    includeMagic: { type: 'boolean', description: 'Whether magic is included' },
    allowWritebackCells: { type: 'boolean', description: 'Whether writeback cells are allowed' },
  },
}

export const hexGetGroupTool: ToolConfig = {
  id: 'hex_get_group',
  name: 'Get Group',
  description: 'Get details of a Hex group',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    groupId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Group ID',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/groups/${params.groupId}`,
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        id: data.id,
        name: data.name,
        createdAt: data.createdAt,
      },
    }
  },
  outputs: {
    id: { type: 'string', description: 'Group ID' },
    name: { type: 'string', description: 'Group name' },
    createdAt: { type: 'string', description: 'Creation timestamp' },
  },
}

export const hexGetProjectTool: ToolConfig = {
  id: 'hex_get_project',
  name: 'Get Project',
  description: 'Get details of a Hex project',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Project ID',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/projects/${params.projectId}`,
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        type: data.type,
        creator: data.creator,
        owner: data.owner,
        categories: data.categories,
        lastEditedAt: data.lastEditedAt,
        lastPublishedAt: data.lastPublishedAt,
        createdAt: data.createdAt,
        archivedAt: data.archivedAt,
        trashedAt: data.trashedAt,
      },
    }
  },
  outputs: {
    id: { type: 'string', description: 'Project ID' },
    title: { type: 'string', description: 'Project title' },
    description: { type: 'string', description: 'Project description' },
    status: { type: 'json', description: 'Project status object' },
    type: { type: 'string', description: 'Project type' },
    creator: { type: 'json', description: 'Creator info' },
    owner: { type: 'json', description: 'Owner info' },
    categories: { type: 'json', description: 'Project categories' },
    lastEditedAt: { type: 'string', description: 'Last edited timestamp' },
    lastPublishedAt: { type: 'string', description: 'Last published timestamp' },
    createdAt: { type: 'string', description: 'Creation timestamp' },
    archivedAt: { type: 'string', description: 'Archive timestamp' },
    trashedAt: { type: 'string', description: 'Trash timestamp' },
  },
}

export const hexGetProjectRunsTool: ToolConfig = {
  id: 'hex_get_project_runs',
  name: 'Get Project Runs',
  description: 'List runs for a Hex project',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Project ID',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of runs to return',
    },
    offset: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Offset for pagination',
    },
    statusFilter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.limit != null) searchParams.set('limit', String(params.limit))
      if (params.offset != null) searchParams.set('offset', String(params.offset))
      if (params.statusFilter) searchParams.set('statusFilter', params.statusFilter)
      const query = searchParams.toString()
      return `${HEX_BASE_URL}/projects/${params.projectId}/runs${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        runs: data.runs,
        total: data.total,
        traceId: data.traceId,
      },
    }
  },
  outputs: {
    runs: { type: 'json', description: 'List of project runs' },
    total: { type: 'number', description: 'Total number of runs' },
    traceId: { type: 'string', description: 'Trace ID' },
  },
}

export const hexGetQueriedTablesTool: ToolConfig = {
  id: 'hex_get_queried_tables',
  name: 'Get Queried Tables',
  description: 'Get tables queried by a Hex project',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Project ID',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of tables to return',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.limit != null) searchParams.set('limit', String(params.limit))
      const query = searchParams.toString()
      return `${HEX_BASE_URL}/projects/${params.projectId}/queriedTables${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        tables: data.tables,
        total: data.total,
      },
    }
  },
  outputs: {
    tables: { type: 'json', description: 'List of queried tables' },
    total: { type: 'number', description: 'Total number of tables' },
  },
}

export const hexGetRunStatusTool: ToolConfig = {
  id: 'hex_get_run_status',
  name: 'Get Run Status',
  description: 'Get the status of a Hex project run',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Project ID',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Run ID',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/projects/${params.projectId}/runs/${params.runId}`,
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        projectId: data.projectId,
        runId: data.runId,
        runUrl: data.runUrl,
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
        elapsedTime: data.elapsedTime,
        traceId: data.traceId,
        projectVersion: data.projectVersion,
      },
    }
  },
  outputs: {
    projectId: { type: 'string', description: 'Project ID' },
    runId: { type: 'string', description: 'Run ID' },
    runUrl: { type: 'string', description: 'URL to view the run' },
    status: { type: 'string', description: 'Run status' },
    startTime: { type: 'string', description: 'Run start time' },
    endTime: { type: 'string', description: 'Run end time' },
    elapsedTime: { type: 'number', description: 'Elapsed time in ms' },
    traceId: { type: 'string', description: 'Trace ID' },
    projectVersion: { type: 'number', description: 'Project version' },
  },
}

export const hexListCollectionsTool: ToolConfig = {
  id: 'hex_list_collections',
  name: 'List Collections',
  description: 'List Hex collections',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of collections to return',
    },
    sortBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.limit != null) searchParams.set('limit', String(params.limit))
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      const query = searchParams.toString()
      return `${HEX_BASE_URL}/collections${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        collections: data.collections,
        total: data.total,
      },
    }
  },
  outputs: {
    collections: { type: 'json', description: 'List of collections' },
    total: { type: 'number', description: 'Total number of collections' },
  },
}

export const hexListDataConnectionsTool: ToolConfig = {
  id: 'hex_list_data_connections',
  name: 'List Data Connections',
  description: 'List Hex data connections',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of connections to return',
    },
    sortBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field',
    },
    sortDirection: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (asc or desc)',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.limit != null) searchParams.set('limit', String(params.limit))
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)
      const query = searchParams.toString()
      return `${HEX_BASE_URL}/data-connections${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        connections: data.connections,
        total: data.total,
      },
    }
  },
  outputs: {
    connections: { type: 'json', description: 'List of data connections' },
    total: { type: 'number', description: 'Total number of connections' },
  },
}

export const hexListGroupsTool: ToolConfig = {
  id: 'hex_list_groups',
  name: 'List Groups',
  description: 'List Hex groups',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of groups to return',
    },
    sortBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field',
    },
    sortDirection: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (asc or desc)',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.limit != null) searchParams.set('limit', String(params.limit))
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)
      const query = searchParams.toString()
      return `${HEX_BASE_URL}/groups${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        groups: data.groups,
        total: data.total,
      },
    }
  },
  outputs: {
    groups: { type: 'json', description: 'List of groups' },
    total: { type: 'number', description: 'Total number of groups' },
  },
}

export const hexListProjectsTool: ToolConfig = {
  id: 'hex_list_projects',
  name: 'List Projects',
  description: 'List Hex projects',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of projects to return',
    },
    includeArchived: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Include archived projects',
    },
    statusFilter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.limit != null) searchParams.set('limit', String(params.limit))
      if (params.includeArchived != null)
        searchParams.set('includeArchived', String(params.includeArchived))
      if (params.statusFilter) searchParams.append('statuses[]', params.statusFilter)
      const query = searchParams.toString()
      return `${HEX_BASE_URL}/projects${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        projects: data.projects,
        total: data.total,
      },
    }
  },
  outputs: {
    projects: { type: 'json', description: 'List of projects' },
    total: { type: 'number', description: 'Total number of projects' },
  },
}

export const hexListUsersTool: ToolConfig = {
  id: 'hex_list_users',
  name: 'List Users',
  description: 'List Hex workspace users',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of users to return',
    },
    sortBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field',
    },
    sortDirection: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (asc or desc)',
    },
    groupId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by group ID',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.limit != null) searchParams.set('limit', String(params.limit))
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)
      if (params.groupId) searchParams.set('groupId', params.groupId)
      const query = searchParams.toString()
      return `${HEX_BASE_URL}/users${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => hexHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        users: data.users,
        total: data.total,
      },
    }
  },
  outputs: {
    users: { type: 'json', description: 'List of users' },
    total: { type: 'number', description: 'Total number of users' },
  },
}

export const hexRunProjectTool: ToolConfig = {
  id: 'hex_run_project',
  name: 'Run Project',
  description: 'Trigger a run of a Hex project',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Project ID to run',
    },
    inputParams: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Input parameters for the project run',
    },
    dryRun: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Perform a dry run without executing cells',
    },
    updateCache: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Update cached results',
    },
    updatePublishedResults: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Update published results',
    },
    useCachedSqlResults: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Use cached SQL results',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/projects/${params.projectId}/runs`,
    method: 'POST',
    headers: (params: any) => hexHeaders(params.apiKey),
    body: (params: any) => {
      const body: any = {}
      if (params.inputParams != null) {
        body.inputParams =
          typeof params.inputParams === 'string'
            ? JSON.parse(params.inputParams)
            : params.inputParams
      }
      if (params.dryRun != null) body.dryRun = params.dryRun
      if (params.updateCache != null) body.updateCache = params.updateCache
      if (params.updatePublishedResults != null)
        body.updatePublishedResults = params.updatePublishedResults
      if (params.useCachedSqlResults != null)
        body.useCachedSqlResults = params.useCachedSqlResults
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        projectId: data.projectId,
        runId: data.runId,
        runUrl: data.runUrl,
        runStatusUrl: data.runStatusUrl,
        traceId: data.traceId,
        projectVersion: data.projectVersion,
      },
    }
  },
  outputs: {
    projectId: { type: 'string', description: 'Project ID' },
    runId: { type: 'string', description: 'Run ID' },
    runUrl: { type: 'string', description: 'URL to view the run' },
    runStatusUrl: { type: 'string', description: 'URL to check run status' },
    traceId: { type: 'string', description: 'Trace ID' },
    projectVersion: { type: 'number', description: 'Project version' },
  },
}

export const hexUpdateProjectTool: ToolConfig = {
  id: 'hex_update_project',
  name: 'Update Project',
  description: 'Update a Hex project (e.g. change its status)',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Hex API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Project ID to update',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New project status',
    },
  },
  request: {
    url: (params: any) => `${HEX_BASE_URL}/projects/${params.projectId}`,
    method: 'PATCH',
    headers: (params: any) => hexHeaders(params.apiKey),
    body: (params: any) => {
      const body: any = {}
      if (params.status) body.status = params.status
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Hex API error: ${response.status}`)
    return {
      success: true,
      output: {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        type: data.type,
        creator: data.creator,
        owner: data.owner,
        categories: data.categories,
        lastEditedAt: data.lastEditedAt,
        lastPublishedAt: data.lastPublishedAt,
        createdAt: data.createdAt,
        archivedAt: data.archivedAt,
        trashedAt: data.trashedAt,
      },
    }
  },
  outputs: {
    id: { type: 'string', description: 'Project ID' },
    title: { type: 'string', description: 'Project title' },
    description: { type: 'string', description: 'Project description' },
    status: { type: 'json', description: 'Project status' },
    type: { type: 'string', description: 'Project type' },
    creator: { type: 'json', description: 'Creator info' },
    owner: { type: 'json', description: 'Owner info' },
    categories: { type: 'json', description: 'Project categories' },
    lastEditedAt: { type: 'string', description: 'Last edited timestamp' },
    lastPublishedAt: { type: 'string', description: 'Last published timestamp' },
    createdAt: { type: 'string', description: 'Creation timestamp' },
    archivedAt: { type: 'string', description: 'Archive timestamp' },
    trashedAt: { type: 'string', description: 'Trash timestamp' },
  },
}
