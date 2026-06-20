import type { QuartrListDocumentsParams, QuartrListResponse } from '@/tools/quartr/types'
import type { ToolConfig } from '@/tools/types'

export const listDocumentsTool: ToolConfig<QuartrListDocumentsParams, QuartrListResponse> = {
  id: 'quartr_list_documents',
  name: 'Quartr List Documents',
  description:
    'List documents (reports, slide decks, transcripts) from Quartr, filterable by company, event, type, and date range',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Quartr API key',
    },
    companyIds: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of Quartr company IDs (e.g. "4742,128")',
    },
    eventIds: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of Quartr event IDs (e.g. "128301")',
    },
    documentTypeIds: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of document type IDs (e.g. "7,10")',
    },
    startDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Only return documents dated on or after this ISO 8601 date (e.g. "2024-01-01")',
    },
    endDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Only return documents dated on or before this ISO 8601 date (e.g. "2024-12-31")',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items to return (default 10, max 500)',
    },
    cursor: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response (nextCursor)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.quartr.com/public/v3/documents')
      if (params.companyIds) url.searchParams.set('companyIds', params.companyIds)
      if (params.eventIds) url.searchParams.set('eventIds', params.eventIds)
      if (params.documentTypeIds) url.searchParams.set('typeIds', params.documentTypeIds)
      if (params.startDate) url.searchParams.set('startDate', params.startDate)
      if (params.endDate) url.searchParams.set('endDate', params.endDate)
      if (params.limit) url.searchParams.set('limit', String(params.limit))
      if (params.cursor) url.searchParams.set('cursor', String(params.cursor))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({ 'x-api-key': params.apiKey }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const documents = json.data ?? []
    return {
      success: true,
      output: {
        data: documents,
        metadata: { count: documents.length, nextCursor: json.pagination?.nextCursor ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Quartr document objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of documents returned' },
        nextCursor: { type: 'number', description: 'Cursor for the next page (null when none)' },
      },
    },
  },
}
