import type { ToolConfig } from '@/tools/types'

export const boxCreateSharedLinkTool: ToolConfig = {
  id: 'box_create_shared_link',
  name: 'Box Create Shared Link',
  description: 'Create a shared link for a file in Box.',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'box',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Box API',
    },
    fileId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the file to create a shared link for',
    },
  },

  request: {
    url: (params) => `https://api.box.com/2.0/files/${params.fileId.trim()}?fields=shared_link`,
    method: 'PUT',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: () => ({
      shared_link: { access: 'open' },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || `Box API error: ${response.status}`)
    }
    const sharedLink = data.shared_link ?? {}
    return {
      success: true,
      output: {
        url: sharedLink.url ?? null,
        downloadUrl: sharedLink.download_url ?? null,
        access: sharedLink.access ?? null,
        effectiveAccess: sharedLink.effective_access ?? null,
      },
    }
  },

  outputs: {
    url: { type: 'string', description: 'Shared link URL' },
    downloadUrl: { type: 'string', description: 'Direct download URL' },
    access: { type: 'string', description: 'Access level (open, company, collaborators)' },
  },
}
