import { DocumentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const BoxBlock: BlockConfig = {
  type: 'box',
  name: 'Box',
  description: 'Upload, download, and manage files in Box cloud storage',
  longDescription:
    'Integrate Box file storage into your workflows. Upload and download files, list folder contents, create folders, and manage sharing.',
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
        { label: 'Upload File', id: 'box_upload_file' },
        { label: 'Download File', id: 'box_download_file' },
        { label: 'List Folder', id: 'box_list_folder' },
        { label: 'Create Folder', id: 'box_create_folder' },
        { label: 'Delete File', id: 'box_delete_file' },
        { label: 'Get File Info', id: 'box_get_file_info' },
        { label: 'Create Shared Link', id: 'box_create_shared_link' },
      ],
      required: true,
    },
    {
      id: 'credential',
      title: 'Box Account',
      type: 'oauth-input',
      layout: 'full',
      provider: 'box',
    },
    {
      id: 'fileId',
      title: 'File ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '123456789',
      condition: {
        field: 'operation',
        value: [
          'box_download_file',
          'box_delete_file',
          'box_get_file_info',
          'box_create_shared_link',
        ],
      },
    },
    {
      id: 'folderId',
      title: 'Folder ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '0 (root)',
      condition: {
        field: 'operation',
        value: ['box_list_folder', 'box_create_folder', 'box_upload_file'],
      },
    },
    {
      id: 'fileName',
      title: 'File/Folder Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my-file.pdf',
      condition: { field: 'operation', value: ['box_upload_file', 'box_create_folder'] },
    },
    {
      id: 'uploadFile',
      title: 'File',
      type: 'file-upload',
      layout: 'full',
      condition: { field: 'operation', value: ['box_upload_file'] },
    },
  ],
  tools: {
    access: [
      'box_upload_file',
      'box_download_file',
      'box_list_folder',
      'box_create_folder',
      'box_delete_file',
      'box_get_file_info',
      'box_create_shared_link',
    ],
    config: {
      tool: (params) => params.operation || 'box_list_folder',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    oauthCredential: { type: 'string', description: 'OAuth credential' },
    fileId: { type: 'string', description: 'File ID' },
    folderId: { type: 'string', description: 'Folder ID' },
    fileName: { type: 'string', description: 'File or folder name' },
  },
  outputs: {
    file: { type: 'json', description: 'File metadata' },
    files: { type: 'json', description: 'File list' },
    folder: { type: 'json', description: 'Folder data' },
  },
}
