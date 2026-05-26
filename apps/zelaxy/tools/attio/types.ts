import type { OutputProperty, ToolResponse } from '@/tools/types'

export const RECORD_ID_OUTPUT_PROPERTIES = {
  workspace_id: { type: 'string', description: 'The workspace ID' },
  object_id: { type: 'string', description: 'The object ID' },
  record_id: { type: 'string', description: 'The record ID' },
} as const satisfies Record<string, OutputProperty>

export const RECORD_OUTPUT_PROPERTIES = {
  id: {
    type: 'object',
    description: 'The record identifier',
    properties: RECORD_ID_OUTPUT_PROPERTIES,
  },
  created_at: { type: 'string', description: 'When the record was created' },
  web_url: { type: 'string', description: 'URL to view the record in Attio' },
  values: { type: 'json', description: 'The record attribute values' },
} as const satisfies Record<string, OutputProperty>

export const RECORD_OBJECT_OUTPUT: OutputProperty = {
  type: 'object',
  description: 'An Attio record',
  properties: RECORD_OUTPUT_PROPERTIES,
}

export const RECORDS_ARRAY_OUTPUT: OutputProperty = {
  type: 'array',
  description: 'Array of Attio records',
  items: {
    type: 'object',
    properties: RECORD_OUTPUT_PROPERTIES,
  },
}

export const ACTOR_OUTPUT_PROPERTIES = {
  type: {
    type: 'string',
    description: 'The actor type (e.g. workspace-member, api-token, system)',
  },
  id: { type: 'string', description: 'The actor ID' },
} as const satisfies Record<string, OutputProperty>

export const NOTE_OUTPUT_PROPERTIES = {
  noteId: { type: 'string', description: 'The note ID' },
  parentObject: { type: 'string', description: 'The parent object slug' },
  parentRecordId: { type: 'string', description: 'The parent record ID' },
  title: { type: 'string', description: 'The note title' },
  contentPlaintext: { type: 'string', description: 'The note content as plaintext' },
  contentMarkdown: { type: 'string', description: 'The note content as markdown' },
  meetingId: { type: 'string', description: 'The linked meeting ID', optional: true },
  tags: {
    type: 'array',
    description: 'Tags on the note',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'The tag type' },
        workspaceMemberId: { type: 'string', description: 'The workspace member ID of the tagger' },
      },
    },
  },
  createdByActor: {
    type: 'object',
    description: 'The actor who created the note',
    properties: ACTOR_OUTPUT_PROPERTIES,
  },
  createdAt: { type: 'string', description: 'When the note was created' },
} as const satisfies Record<string, OutputProperty>

export interface AttioListRecordsParams {
  accessToken: string
  objectType: string
  filter?: string
  sorts?: string
  limit?: number
  offset?: number
}

export interface AttioGetRecordParams {
  accessToken: string
  objectType: string
  recordId: string
}

export interface AttioCreateRecordParams {
  accessToken: string
  objectType: string
  values: string
}

export interface AttioUpdateRecordParams {
  accessToken: string
  objectType: string
  recordId: string
  values: string
}

export interface AttioDeleteRecordParams {
  accessToken: string
  objectType: string
  recordId: string
}

export interface AttioListNotesParams {
  accessToken: string
  parentObject?: string
  parentRecordId?: string
  limit?: number
  offset?: number
}

export interface AttioCreateNoteParams {
  accessToken: string
  parentObject: string
  parentRecordId: string
  title: string
  content: string
  format?: string
  createdAt?: string
  meetingId?: string
}

interface AttioRecord {
  id: { workspace_id: string; object_id: string; record_id: string }
  created_at: string
  web_url: string
  values: Record<string, unknown>
}

export interface AttioListRecordsResponse extends ToolResponse {
  output: { records: AttioRecord[]; count: number }
}

export interface AttioGetRecordResponse extends ToolResponse {
  output: { record: AttioRecord; recordId: string; webUrl: string }
}

export interface AttioCreateRecordResponse extends ToolResponse {
  output: { record: AttioRecord; recordId: string; webUrl: string }
}

export interface AttioUpdateRecordResponse extends ToolResponse {
  output: { record: AttioRecord; recordId: string; webUrl: string }
}

export interface AttioDeleteRecordResponse extends ToolResponse {
  output: { deleted: boolean }
}

export interface AttioListNotesResponse extends ToolResponse {
  output: {
    notes: Array<{
      noteId: string | null
      parentObject: string | null
      parentRecordId: string | null
      title: string | null
      contentPlaintext: string | null
      contentMarkdown: string | null
      meetingId: string | null
      tags: unknown[]
      createdByActor: unknown
      createdAt: string | null
    }>
    count: number
  }
}

export interface AttioCreateNoteResponse extends ToolResponse {
  output: {
    noteId: string | null
    parentObject: string | null
    parentRecordId: string | null
    title: string | null
    contentPlaintext: string | null
    contentMarkdown: string | null
    meetingId: string | null
    tags: unknown[]
    createdByActor: unknown
    createdAt: string | null
  }
}
