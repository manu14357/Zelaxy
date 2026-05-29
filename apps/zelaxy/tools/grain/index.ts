import type { ToolConfig, ToolResponse } from '@/tools/types'

const BASE = 'https://api.grain.com/_/public-api/v2'
const API_VERSION = '2025-10-31'

const grainHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
  'Public-Api-Version': API_VERSION,
})

export const grainListRecordingsTool: ToolConfig = {
  id: 'grain_list_recordings',
  name: 'Grain List Recordings',
  description: 'List recordings from Grain with optional filters and pagination',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key (Personal Access Token)' },
    cursor: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Pagination cursor from previous response' },
    beforeDatetime: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Only recordings before this ISO8601 timestamp' },
    afterDatetime: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Only recordings after this ISO8601 timestamp' },
    participantScope: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Filter: "internal" or "external"' },
    titleSearch: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Search term to filter by recording title' },
    teamId: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Filter by team UUID' },
    meetingTypeId: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Filter by meeting type UUID' },
    includeHighlights: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include highlights/clips in response' },
    includeParticipants: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include participant list in response' },
    includeAiSummary: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include AI-generated summary' },
  },
  request: {
    url: `${BASE}/recordings`,
    method: 'POST',
    headers: (params: any) => grainHeaders(params.apiKey),
    body: (params: any) => {
      const body: Record<string, any> = {}
      if (params.cursor) body.cursor = params.cursor
      const filter: Record<string, any> = {}
      if (params.beforeDatetime) filter.before_datetime = params.beforeDatetime
      if (params.afterDatetime) filter.after_datetime = params.afterDatetime
      if (params.participantScope) filter.participant_scope = params.participantScope
      if (params.titleSearch) filter.title_search = params.titleSearch
      if (params.teamId) filter.team = params.teamId
      if (params.meetingTypeId) filter.meeting_type = params.meetingTypeId
      if (Object.keys(filter).length) body.filter = filter
      const include: Record<string, any> = {}
      if (params.includeHighlights) include.highlights = true
      if (params.includeParticipants) include.participants = true
      if (params.includeAiSummary) include.ai_summary = true
      if (Object.keys(include).length) body.include = include
      return body
    },
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to list recordings')
    return { success: true, output: { recordings: data.recordings || [], cursor: data.cursor || null } }
  },
  outputs: {
    recordings: { type: 'array', description: 'Array of recording objects' },
    cursor: { type: 'string', description: 'Cursor for next page', optional: true },
  },
}

export const grainGetRecordingTool: ToolConfig = {
  id: 'grain_get_recording',
  name: 'Grain Get Recording',
  description: 'Get details of a single recording by ID',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
    recordingId: { type: 'string', required: true, visibility: 'user-or-llm', description: 'The recording UUID' },
    includeHighlights: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include highlights/clips' },
    includeParticipants: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include participant list' },
    includeAiSummary: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include AI summary' },
    includeCalendarEvent: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include calendar event data' },
    includeHubspot: { type: 'boolean', required: false, visibility: 'user-only', description: 'Include HubSpot associations' },
  },
  request: {
    url: (params: any) => `${BASE}/recordings/${params.recordingId}`,
    method: 'POST',
    headers: (params: any) => grainHeaders(params.apiKey),
    body: (params: any) => {
      const include: Record<string, any> = {}
      if (params.includeHighlights) include.highlights = true
      if (params.includeParticipants) include.participants = true
      if (params.includeAiSummary) include.ai_summary = true
      if (params.includeCalendarEvent) include.calendar_event = true
      if (params.includeHubspot) include.hubspot = true
      return Object.keys(include).length ? { include } : {}
    },
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to get recording')
    return { success: true, output: data }
  },
  outputs: {
    id: { type: 'string', description: 'Recording UUID' },
    title: { type: 'string', description: 'Recording title' },
    url: { type: 'string', description: 'URL to view in Grain' },
    duration_ms: { type: 'number', description: 'Duration in milliseconds' },
    participants: { type: 'array', description: 'Participants list', optional: true },
    ai_summary: { type: 'json', description: 'AI summary', optional: true },
  },
}

export const grainGetTranscriptTool: ToolConfig = {
  id: 'grain_get_transcript',
  name: 'Grain Get Transcript',
  description: 'Get the full transcript of a recording',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
    recordingId: { type: 'string', required: true, visibility: 'user-or-llm', description: 'The recording UUID' },
  },
  request: {
    url: (params: any) => `${BASE}/recordings/${params.recordingId}/transcript`,
    method: 'GET',
    headers: (params: any) => grainHeaders(params.apiKey),
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to get transcript')
    return { success: true, output: { transcript: data.transcript || [] } }
  },
  outputs: {
    transcript: { type: 'array', description: 'Array of transcript sections with speaker, text, start/end times' },
  },
}

export const grainListViewsTool: ToolConfig = {
  id: 'grain_list_views',
  name: 'Grain List Views',
  description: 'List saved views in Grain',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
    typeFilter: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Filter by type: recordings, highlights, or stories' },
  },
  request: {
    url: (params: any) => {
      const url = new URL(`${BASE}/views`)
      if (params.typeFilter) url.searchParams.append('type', params.typeFilter)
      return url.toString()
    },
    method: 'GET',
    headers: (params: any) => grainHeaders(params.apiKey),
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to list views')
    return { success: true, output: { views: data.views || [] } }
  },
  outputs: {
    views: { type: 'array', description: 'Array of view objects' },
  },
}

export const grainListTeamsTool: ToolConfig = {
  id: 'grain_list_teams',
  name: 'Grain List Teams',
  description: 'List all teams in the Grain workspace',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
  },
  request: {
    url: `${BASE}/teams`,
    method: 'GET',
    headers: (params: any) => grainHeaders(params.apiKey),
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to list teams')
    return { success: true, output: { teams: data.teams || [] } }
  },
  outputs: {
    teams: { type: 'array', description: 'Array of team objects with id and name' },
  },
}

export const grainListMeetingTypesTool: ToolConfig = {
  id: 'grain_list_meeting_types',
  name: 'Grain List Meeting Types',
  description: 'List all meeting types in the Grain workspace',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
  },
  request: {
    url: `${BASE}/meeting-types`,
    method: 'GET',
    headers: (params: any) => grainHeaders(params.apiKey),
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to list meeting types')
    return { success: true, output: { meeting_types: data.meeting_types || [] } }
  },
  outputs: {
    meeting_types: { type: 'array', description: 'Array of meeting type objects' },
  },
}

export const grainCreateHookTool: ToolConfig = {
  id: 'grain_create_hook',
  name: 'Grain Create Hook',
  description: 'Create a webhook to receive Grain recording events',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
    hookUrl: { type: 'string', required: true, visibility: 'user-or-llm', description: 'The URL to send webhook events to' },
    viewId: { type: 'string', required: true, visibility: 'user-or-llm', description: 'View ID to scope the webhook to' },
    actions: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Comma-separated actions: added, updated, removed' },
  },
  request: {
    url: `${BASE}/hooks`,
    method: 'POST',
    headers: (params: any) => grainHeaders(params.apiKey),
    body: (params: any) => ({
      hook_url: params.hookUrl,
      view_id: params.viewId,
      actions: params.actions ? params.actions.split(',').map((a: string) => a.trim()) : ['added', 'updated', 'removed'],
    }),
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to create hook')
    return { success: true, output: data }
  },
  outputs: {
    id: { type: 'string', description: 'Hook ID' },
    hook_url: { type: 'string', description: 'Webhook URL' },
    enabled: { type: 'boolean', description: 'Whether the hook is enabled' },
  },
}

export const grainListHooksTool: ToolConfig = {
  id: 'grain_list_hooks',
  name: 'Grain List Hooks',
  description: 'List all webhooks in the Grain workspace',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
  },
  request: {
    url: `${BASE}/hooks`,
    method: 'GET',
    headers: (params: any) => grainHeaders(params.apiKey),
  },
  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to list hooks')
    return { success: true, output: { hooks: data.hooks || [] } }
  },
  outputs: {
    hooks: { type: 'array', description: 'Array of webhook objects' },
  },
}

export const grainDeleteHookTool: ToolConfig = {
  id: 'grain_delete_hook',
  name: 'Grain Delete Hook',
  description: 'Delete a webhook from the Grain workspace',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Grain API key' },
    hookId: { type: 'string', required: true, visibility: 'user-or-llm', description: 'The hook ID to delete' },
  },
  request: {
    url: (params: any) => `${BASE}/hooks/${params.hookId}`,
    method: 'DELETE',
    headers: (params: any) => grainHeaders(params.apiKey),
  },
  transformResponse: async (response) => {
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || data.message || 'Failed to delete hook')
    }
    return { success: true, output: { success: true } }
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the hook was deleted' },
  },
}
