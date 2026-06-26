import { DocumentIcon } from '@/components/icons'
import { createLogger } from '@/lib/logs/console/logger'
import type { BlockConfig, SubBlockLayout, SubBlockType } from '@/blocks/types'
import type { FileParserOutput } from '@/tools/file/types'

const logger = createLogger('FileBlock')

const READ_OPS = ['read', 'get_content', 'fetch']

export const FileBlock: BlockConfig<FileParserOutput> = {
  type: 'file',
  name: 'File',
  description: 'Read, fetch, write, and append files',
  longDescription: `One block with five operations. Read and Get Content take an existing file (by URL or upload) and hand the next block the file object or its extracted text. Fetch downloads and parses a file from an external URL. Write creates a new workspace file from text content; Append adds text to the end of an existing workspace file. Written files land in the workspace Files store and are visible to every workflow. PDFs, CSVs, Word/Excel, CAD (DWG/DXF/STEP), and images are parsed automatically.`,
  docsLink: '#',
  category: 'tools',
  bgColor: '#40916C',
  icon: DocumentIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown' as SubBlockType,
      layout: 'full' as SubBlockLayout,
      options: [
        { id: 'read', label: 'Read' },
        { id: 'get_content', label: 'Get Content' },
        { id: 'fetch', label: 'Fetch' },
        { id: 'write', label: 'Write' },
        { id: 'append', label: 'Append' },
      ],
      value: () => 'read',
    },
    {
      id: 'inputMethod',
      title: 'Select Input Method',
      type: 'dropdown' as SubBlockType,
      layout: 'full' as SubBlockLayout,
      options: [
        { id: 'url', label: 'File URL' },
        { id: 'upload', label: 'Upload Files' },
      ],
      condition: { field: 'operation', value: ['read', 'get_content', 'fetch'] },
    },
    {
      id: 'filePath',
      title: 'File URL',
      type: 'short-input' as SubBlockType,
      layout: 'full' as SubBlockLayout,
      placeholder: 'Enter URL to a file (https://example.com/document.pdf)',
      condition: {
        field: 'inputMethod',
        value: 'url',
        and: { field: 'operation', value: ['read', 'get_content', 'fetch'] },
      },
    },
    {
      id: 'file',
      title: 'Upload Files',
      type: 'file-upload' as SubBlockType,
      layout: 'full' as SubBlockLayout,
      acceptedTypes:
        '.pdf,.csv,.docx,.dwg,.dxf,.step,.stp,.iges,.igs,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.svg,.xlsx,.xls,.txt,.md',
      multiple: true,
      condition: {
        field: 'inputMethod',
        value: 'upload',
        and: { field: 'operation', value: ['read', 'get_content', 'fetch'] },
      },
      maxSize: 100, // 100MB max via direct upload
    },
    {
      id: 'fileName',
      title: 'File Name',
      type: 'short-input' as SubBlockType,
      layout: 'full' as SubBlockLayout,
      placeholder: 'summary.md',
      condition: { field: 'operation', value: ['write', 'append'] },
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input' as SubBlockType,
      layout: 'full' as SubBlockLayout,
      placeholder: 'Text content to save (reference another block with {{block.content}})',
      condition: { field: 'operation', value: ['write', 'append'] },
    },
    {
      id: 'contentType',
      title: 'Content Type',
      type: 'short-input' as SubBlockType,
      layout: 'full' as SubBlockLayout,
      placeholder: 'text/markdown (auto-detected from extension if omitted)',
      mode: 'advanced',
      condition: { field: 'operation', value: 'write' },
    },
  ],
  tools: {
    access: ['file_parser', 'file_write', 'file_append'],
    config: {
      tool: (params) => {
        switch (params.operation) {
          case 'write':
            return 'file_write'
          case 'append':
            return 'file_append'
          default:
            return 'file_parser'
        }
      },
      params: (params) => {
        const operation = params.operation || 'read'
        const workspaceId = params._context?.workspaceId

        // ── Write / Append → workspace Files store ──
        if (operation === 'write' || operation === 'append') {
          if (!params.fileName || params.fileName.trim() === '') {
            throw new Error('File Name is required')
          }
          const base = {
            workspaceId,
            fileName: params.fileName.trim(),
            content: params.content ?? '',
          }
          return operation === 'write' ? { ...base, contentType: params.contentType } : base
        }

        // ── Read / Get Content / Fetch → parser ──
        const inputMethod = params.inputMethod || 'url'

        if (inputMethod === 'url') {
          if (!params.filePath || params.filePath.trim() === '') {
            logger.error('Missing file URL')
            throw new Error('File URL is required')
          }
          return { filePath: params.filePath.trim(), fileType: params.fileType || 'auto' }
        }

        // Upload input
        if (params.file && Array.isArray(params.file) && params.file.length > 0) {
          const filePaths = params.file.map((file) => file.path)
          return {
            filePath: filePaths.length === 1 ? filePaths[0] : filePaths,
            fileType: params.fileType || 'auto',
          }
        }
        if (params.file?.path) {
          return { filePath: params.file.path, fileType: params.fileType || 'auto' }
        }

        logger.error('No files provided for upload method')
        throw new Error('Please upload a file')
      },
    },
  },
  inputs: {
    operation: {
      type: 'string',
      description: 'Operation: read, get_content, fetch, write, append',
    },
    inputMethod: { type: 'string', description: 'Input method selection' },
    filePath: { type: 'string', description: 'File URL path' },
    fileType: { type: 'string', description: 'File type' },
    file: { type: 'json', description: 'Uploaded file data' },
    fileName: { type: 'string', description: 'Name of the file to write or append to' },
    content: { type: 'string', description: 'Content to write or append' },
    contentType: { type: 'string', description: 'MIME type for written files' },
  },
  outputs: {
    files: {
      type: 'json',
      description: 'Array of parsed file objects with content, metadata, and file properties',
    },
    combinedContent: {
      type: 'string',
      description: 'All file contents merged into a single text string',
    },
    // Write / Append outputs
    id: { type: 'string', description: 'Workspace file ID (Write/Append)' },
    name: { type: 'string', description: 'Saved file name (Write/Append)' },
    size: { type: 'number', description: 'File size in bytes (Write/Append)' },
    url: { type: 'string', description: 'URL to access the saved file (Write/Append)' },
  },
}

// Re-exported so other modules can reference the read-style operations consistently.
export { READ_OPS }
