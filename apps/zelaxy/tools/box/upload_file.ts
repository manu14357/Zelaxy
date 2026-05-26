import type { ToolConfig } from '@/tools/types'

export const boxUploadFileTool: ToolConfig = {
  id: 'box_upload_file',
  name: 'Box Upload File',
  description: 'Upload a file to a Box folder.',
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
    folderId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the folder to upload the file to (use "0" for root)',
    },
    fileName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional filename override',
    },
    uploadFile: {
      type: 'file',
      required: false,
      visibility: 'user-or-llm',
      description: 'The file to upload',
    },
  },

  request: {
    url: '/api/tools/box/upload',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      accessToken: params.accessToken,
      parentFolderId: params.folderId,
      file: params.uploadFile,
      fileName: params.fileName,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload file')
    }
    return {
      success: true,
      output: data.output,
    }
  },

  outputs: {
    id: { type: 'string', description: 'File ID' },
    name: { type: 'string', description: 'File name' },
    size: { type: 'number', description: 'File size in bytes' },
    parentId: { type: 'string', description: 'Parent folder ID' },
  },
}
