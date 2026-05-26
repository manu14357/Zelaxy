import type { ToolConfig } from '@/tools/types'
import type { DevinGetSnapshotParams, DevinGetSnapshotResponse } from './types'

export const devinGetSnapshotTool: ToolConfig<DevinGetSnapshotParams, DevinGetSnapshotResponse> = {
  id: 'devin_get_snapshot',
  name: 'Get Snapshot',
  description: 'Retrieve a snapshot (screenshot URL) of the current state of a Devin session.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Devin API key (service user credential starting with cog_)',
    },
    sessionId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The session ID to get a snapshot for',
    },
  },

  request: {
    url: (params) => `https://api.devin.ai/v3/organizations/sessions/${params.sessionId}/snapshot`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
    }),
  },

  transformResponse: async (response: Response, params) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || `Failed to get snapshot: ${response.statusText}`)
    }
    return {
      success: true,
      output: {
        sessionId: params?.sessionId ?? null,
        snapshotUrl: data.snapshot_url ?? data.url ?? null,
      },
    }
  },

  outputs: {
    sessionId: { type: 'string', description: 'The session ID', optional: true },
    snapshotUrl: {
      type: 'string',
      description: 'URL of the session snapshot image',
      optional: true,
    },
  },
}
