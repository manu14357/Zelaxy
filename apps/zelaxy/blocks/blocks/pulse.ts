import type { SVGProps } from 'react'
import { createElement } from 'react'
import { FileText } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const PulseIcon = (props: SVGProps<SVGSVGElement>) => createElement(FileText, props)

export const PulseBlock: BlockConfig = {
  type: 'pulse',
  name: 'Pulse',
  description: 'Parse and extract text from PDFs and documents',
  longDescription:
    'Extract text, structure, and data from PDFs, Word documents, PowerPoints, spreadsheets, and images using Pulse. Returns markdown, HTML, structured output, and more.',
  docsLink: 'https://docs.zelaxy.ai/tools/pulse',
  category: 'tools',
  hideFromToolbar: true,
  bgColor: '#E0E0E0',
  icon: PulseIcon,
  subBlocks: [
    {
      id: 'fileUpload',
      title: 'File Upload',
      type: 'file-upload',
      acceptedTypes: 'application/pdf,image/*,.docx,.pptx,.xlsx',
      maxSize: 50,
      required: true,
      mode: 'basic',
    },
    {
      id: 'filePath',
      title: 'File URL or Path',
      type: 'short-input',
      placeholder: 'https://... or /path/to/file.pdf',
      required: true,
      mode: 'advanced',
    },
    {
      id: 'pages',
      title: 'Pages',
      type: 'short-input',
      placeholder: 'e.g. 1-3,5 (leave blank for all)',
    },
    {
      id: 'chunking',
      title: 'Enable Chunking',
      type: 'switch',
    },
    {
      id: 'chunkSize',
      title: 'Chunk Size',
      type: 'short-input',
      placeholder: 'Characters per chunk (default: 512)',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      placeholder: 'Enter your Pulse API key',
      required: true,
      password: true,
    },
  ],
  tools: {
    access: ['pulse_parser'],
    config: {
      tool: () => 'pulse_parser',
      params: (params) => {
        const result: Record<string, unknown> = {
          apiKey: typeof params.apiKey === 'string' ? params.apiKey.trim() : params.apiKey,
        }
        if (params.fileUpload && typeof params.fileUpload === 'object') {
          result.file = params.fileUpload
        } else if (typeof params.filePath === 'string' && params.filePath) {
          result.filePath = params.filePath
        }
        if (params.pages) result.pages = params.pages
        if (params.chunking != null) result.chunking = params.chunking
        if (params.chunkSize) result.chunkSize = params.chunkSize
        return result
      },
    },
  },
  inputs: {
    fileUpload: { type: 'json', description: 'Uploaded file object' },
    filePath: { type: 'string', description: 'URL or path to the file' },
    pages: { type: 'string', description: 'Page range to parse (e.g. 1-3,5)' },
    chunking: { type: 'boolean', description: 'Whether to split output into chunks' },
    chunkSize: { type: 'string', description: 'Characters per chunk' },
    apiKey: { type: 'string', description: 'Pulse API key' },
  },
  outputs: {
    markdown: { type: 'string', description: 'Extracted text in Markdown format' },
    page_count: { type: 'number', description: 'Total number of pages' },
    job_id: { type: 'string', description: 'Parse job ID' },
    extraction_url: { type: 'string', description: 'URL to the extraction result' },
    html: { type: 'string', description: 'Extracted content as HTML' },
    structured_output: { type: 'json', description: 'Structured extraction result' },
    chunks: { type: 'json', description: 'Text split into chunks (if chunking enabled)' },
    figures: { type: 'json', description: 'Extracted figures and images' },
    bounding_boxes: { type: 'json', description: 'Element bounding box data' },
  },
}
