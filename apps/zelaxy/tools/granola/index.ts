import type { ToolConfig, ToolResponse } from '@/tools/types'

interface GranolaListNotesParams {
  apiKey: string
  createdBefore?: string
  createdAfter?: string
  updatedAfter?: string
  cursor?: string
  pageSize?: number
}

interface GranolaGetNoteParams {
  apiKey: string
  noteId: string
  includeTranscript?: string
}

interface GranolaListNotesResponse extends ToolResponse {
  output: { notes: any[]; hasMore: boolean; cursor: string | null }
}

interface GranolaGetNoteResponse extends ToolResponse {
  output: Record<string, any>
}

export const granolaListNotesTool: ToolConfig<GranolaListNotesParams, GranolaListNotesResponse> = {
  id: 'granola_list_notes',
  name: 'Granola List Notes',
  description: 'Lists meeting notes from Granola with optional date filters and pagination.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Granola API key',
    },
    createdBefore: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Return notes created before this date (ISO 8601)',
    },
    createdAfter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Return notes created after this date (ISO 8601)',
    },
    updatedAfter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Return notes updated after this date (ISO 8601)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of notes per page (1-30, default 10)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://public-api.granola.ai/v1/notes')
      if (params.createdBefore) url.searchParams.append('created_before', params.createdBefore)
      if (params.createdAfter) url.searchParams.append('created_after', params.createdAfter)
      if (params.updatedAfter) url.searchParams.append('updated_after', params.updatedAfter)
      if (params.cursor) url.searchParams.append('cursor', params.cursor)
      if (params.pageSize) url.searchParams.append('page_size', String(params.pageSize))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response: Response) => {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Granola API error (${response.status}): ${error}`)
    }
    const data = await response.json()
    return {
      success: true,
      output: {
        notes: (data.notes ?? []).map((note: any) => ({
          id: note.id,
          title: note.title ?? null,
          ownerName: note.owner?.name ?? null,
          ownerEmail: note.owner?.email ?? '',
          createdAt: note.created_at ?? '',
          updatedAt: note.updated_at ?? '',
        })),
        hasMore: data.hasMore ?? false,
        cursor: data.cursor ?? null,
      },
    }
  },

  outputs: {
    notes: { type: 'json', description: 'List of meeting notes' },
    hasMore: { type: 'boolean', description: 'Whether more notes are available' },
    cursor: { type: 'string', description: 'Pagination cursor for the next page', optional: true },
  },
}

export const granolaGetNoteTool: ToolConfig<GranolaGetNoteParams, GranolaGetNoteResponse> = {
  id: 'granola_get_note',
  name: 'Granola Get Note',
  description:
    'Retrieves a specific meeting note from Granola by ID, including summary, attendees, calendar event details, and optionally the transcript.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Granola API key',
    },
    noteId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The note ID (e.g., not_1d3tmYTlCICgjy)',
    },
    includeTranscript: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to include the meeting transcript',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://public-api.granola.ai/v1/notes/${params.noteId.trim()}`)
      if (params.includeTranscript === 'true') url.searchParams.append('include', 'transcript')
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response: Response) => {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Granola API error (${response.status}): ${error}`)
    }
    const data = await response.json()
    return {
      success: true,
      output: {
        id: data.id ?? '',
        title: data.title ?? null,
        ownerName: data.owner?.name ?? null,
        ownerEmail: data.owner?.email ?? '',
        createdAt: data.created_at ?? '',
        updatedAt: data.updated_at ?? '',
        summaryText: data.summary_text ?? '',
        summaryMarkdown: data.summary_markdown ?? null,
        attendees: (data.attendees ?? []).map((a: any) => ({ name: a.name ?? null, email: a.email ?? '' })),
        folders: (data.folder_membership ?? []).map((f: any) => ({ id: f.id ?? '', name: f.name ?? '' })),
        calendarEventTitle: data.calendar_event?.event_title ?? null,
        calendarOrganiser: data.calendar_event?.organiser ?? null,
        calendarEventId: data.calendar_event?.calendar_event_id ?? null,
        scheduledStartTime: data.calendar_event?.scheduled_start_time ?? null,
        scheduledEndTime: data.calendar_event?.scheduled_end_time ?? null,
        invitees: (data.calendar_event?.invitees ?? []).map((i: any) => i.email),
        transcript: data.transcript
          ? data.transcript.map((t: any) => ({
              speaker: t.speaker?.source ?? 'unknown',
              text: t.text ?? '',
              startTime: t.start_time ?? '',
              endTime: t.end_time ?? '',
            }))
          : null,
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Note ID' },
    title: { type: 'string', description: 'Note title', optional: true },
    ownerEmail: { type: 'string', description: 'Note owner email' },
    createdAt: { type: 'string', description: 'Creation timestamp' },
    summaryText: { type: 'string', description: 'Plain text summary of the meeting' },
    summaryMarkdown: { type: 'string', description: 'Markdown-formatted summary', optional: true },
    attendees: { type: 'json', description: 'Meeting attendees' },
    transcript: { type: 'json', description: 'Meeting transcript entries', optional: true },
  },
}
