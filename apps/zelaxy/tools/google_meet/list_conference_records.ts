import type {
  GoogleMeetListConferenceRecordsParams,
  GoogleMeetListResponse,
} from '@/tools/google_meet/types'
import type { ToolConfig } from '@/tools/types'

export const listConferenceRecordsTool: ToolConfig<
  GoogleMeetListConferenceRecordsParams,
  GoogleMeetListResponse
> = {
  id: 'google_meet_list_conference_records',
  name: 'Google Meet List Conference Records',
  description: 'List conference records for meetings you organized',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for Google Meet',
    },
    filter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Filter by space name (e.g., space.name = "spaces/abc123") or time range (e.g., start_time > "2024-01-01T00:00:00Z")',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of conference records to return (max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://meet.googleapis.com/v2/conferenceRecords')
      if (params.filter) url.searchParams.set('filter', params.filter)
      if (params.pageSize) url.searchParams.set('pageSize', String(params.pageSize))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to list conference records')
    }
    const records = data.conferenceRecords || []
    return {
      success: true,
      output: {
        data: records,
        metadata: { count: records.length, nextPageToken: data.nextPageToken },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of conference record objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of records returned' },
        nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
      },
    },
  },
}
