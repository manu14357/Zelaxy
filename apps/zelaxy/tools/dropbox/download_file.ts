import type { ToolConfig } from '@/tools/types'

export const dropboxDownloadFileTool: ToolConfig = {
  id: 'dropbox_download_file',
  name: 'Dropbox Download File',
  description: 'Download a file from Dropbox.',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'dropbox',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Dropbox OAuth access token',
    },
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Path of the file in Dropbox to download',
    },
  },

  request: {
    url: 'https://content.dropboxapi.com/2/files/download',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: params.path }),
    }),
  },

  transformResponse: async (response) => {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(
        (data as { error_summary?: string }).error_summary || `HTTP ${response.status}`
      )
    }
    const apiResult = response.headers.get('Dropbox-API-Result')
    const meta = apiResult ? (JSON.parse(apiResult) as Record<string, unknown>) : {}
    const content = await response.text()
    return {
      success: true,
      output: {
        content,
        name: meta.name ?? '',
        size: meta.size ?? 0,
      },
    }
  },

  outputs: {
    content: { type: 'string', description: 'File content as text' },
    name: { type: 'string', description: 'File name' },
    size: { type: 'number', description: 'File size in bytes' },
  },
}
