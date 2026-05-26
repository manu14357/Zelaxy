import { DocumentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const DropboxBlock: BlockConfig = {
  type: 'dropbox',
  name: 'Dropbox',
  description: 'Upload, download, and manage files in Dropbox',
  longDescription:
    'Integrate Dropbox file storage into your workflows. Upload and download files, list folder contents, create folders, and manage sharing.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0061FF',
  icon: DocumentIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Upload File', id: 'dropbox_upload_file' },
        { label: 'Download File', id: 'dropbox_download_file' },
        { label: 'List Folder', id: 'dropbox_list_folder' },
        { label: 'Create Folder', id: 'dropbox_create_folder' },
        { label: 'Delete File', id: 'dropbox_delete_file' },
        { label: 'Get File Metadata', id: 'dropbox_get_file_metadata' },
        { label: 'Create Shared Link', id: 'dropbox_create_shared_link' },
        { label: 'Search Files', id: 'dropbox_search_files' },
      ],
      required: true,
    },
    {
      id: 'credential',
      title: 'Dropbox Account',
      type: 'oauth-input',
      layout: 'full',
      provider: 'dropbox',
    },
    {
      id: 'path',
      title: 'Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/path/to/file.pdf',
      required: true,
    },
    {
      id: 'query',
      title: 'Search Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'filename or keyword',
      condition: { field: 'operation', value: ['dropbox_search_files'] },
    },
    {
      id: 'uploadFile',
      title: 'File',
      type: 'file-upload',
      layout: 'full',
      condition: { field: 'operation', value: ['dropbox_upload_file'] },
    },
    {
      id: 'mode',
      title: 'Write Mode',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Add', id: 'add' },
        { label: 'Overwrite', id: 'overwrite' },
      ],
      condition: { field: 'operation', value: ['dropbox_upload_file'] },
    },
  ],
  tools: {
    access: [
      'dropbox_upload_file',
      'dropbox_download_file',
      'dropbox_list_folder',
      'dropbox_create_folder',
      'dropbox_delete_file',
      'dropbox_get_file_metadata',
      'dropbox_create_shared_link',
      'dropbox_search_files',
    ],
    config: {
      tool: (params) => params.operation || 'dropbox_list_folder',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    oauthCredential: { type: 'string', description: 'OAuth credential' },
    path: { type: 'string', description: 'File or folder path' },
    query: { type: 'string', description: 'Search query' },
    mode: { type: 'string', description: 'Write mode' },
  },
  outputs: {
    file: { type: 'json', description: 'File metadata' },
    files: { type: 'json', description: 'File list' },
    sharedLink: { type: 'string', description: 'Shared link URL' },
  },
}
