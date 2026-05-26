import type {
  AmplitudeExportEventsParams,
  AmplitudeExportEventsResponse,
} from '@/tools/amplitude/types'
import type { ToolConfig } from '@/tools/types'

export const amplitudeExportEventsTool: ToolConfig<
  AmplitudeExportEventsParams,
  AmplitudeExportEventsResponse
> = {
  id: 'amplitude_export_events',
  name: 'Amplitude Export Events',
  description:
    'Export raw event data from Amplitude for a specified date range using the Export REST API.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Amplitude API Key',
    },
    secretKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Amplitude Secret Key',
    },
    start: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start date/time in format YYYYMMDDTHH (e.g., "20230101T00")',
    },
    end: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End date/time in format YYYYMMDDTHH (e.g., "20230101T23")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://amplitude.com/api/2/export')
      url.searchParams.set('start', params.start)
      url.searchParams.set('end', params.end)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${btoa(`${params.apiKey}:${params.secretKey}`)}`,
    }),
  },

  transformResponse: async (response: Response) => {
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Amplitude Export API error: ${text}`)
    }
    return {
      success: true,
      output: {
        exportedAt: new Date().toISOString(),
        startDate: '',
        endDate: '',
        message: 'Export initiated successfully. Data will be available as a zip file.',
      },
    }
  },

  outputs: {
    exportedAt: { type: 'string', description: 'Timestamp when the export was requested' },
    startDate: { type: 'string', description: 'Start date of the export range' },
    endDate: { type: 'string', description: 'End date of the export range' },
    message: { type: 'string', description: 'Status message' },
  },
}
