import { DocumentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const DocumentGeneratorBlock: BlockConfig = {
  type: 'document_generator',
  name: 'Document Generator',
  description: 'Generate PDF, DOCX, or PPTX files and return them as base64',
  longDescription:
    'Generate documents server-side and return the file as a base64 string. Choose PDF, Word (DOCX), or PowerPoint (PPTX). Provide a title and body content, or for presentations a list of slides (one per line) or a JSON array of {title, body}.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E11D48',
  icon: DocumentIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Format',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'PDF', id: 'pdf_generate' },
        { label: 'DOCX (Word)', id: 'docx_generate' },
        { label: 'PPTX (PowerPoint)', id: 'pptx_generate' },
      ],
      value: () => 'pdf_generate',
    },
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'My Document',
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'One paragraph per line...',
      condition: { field: 'operation', value: ['pdf_generate', 'docx_generate'] },
    },
    {
      id: 'slides',
      title: 'Slides',
      type: 'long-input',
      layout: 'full',
      placeholder: 'One slide per line, or a JSON array like [{"title":"Intro","body":"Welcome"}]',
      condition: { field: 'operation', value: 'pptx_generate' },
    },
  ],
  tools: {
    access: ['pdf_generate', 'docx_generate', 'pptx_generate'],
    config: {
      tool: (params) => params.operation || 'pdf_generate',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Document format to generate' },
    title: { type: 'string', description: 'Document or presentation title' },
    content: { type: 'string', description: 'Body content (newline-separated paragraphs)' },
    slides: {
      type: 'string',
      description: 'Slides: one per line or a JSON array of {title, body}',
    },
  },
  outputs: {
    base64: { type: 'string', description: 'Base64-encoded file contents' },
    filename: { type: 'string', description: 'Suggested filename' },
    mimeType: { type: 'string', description: 'MIME type of the generated file' },
  },
}
