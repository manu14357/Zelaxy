import { Document, HeadingLevel, Packer, Paragraph } from 'docx'
import type { ToolConfig, ToolResponse } from '@/tools/types'
import type { DocxGenerateParams } from './types'

export const docxGenerate: ToolConfig<DocxGenerateParams> = {
  id: 'docx_generate',
  name: 'Generate DOCX',
  description:
    'Generate a Word (.docx) document from a title and newline-separated paragraphs. Returns the file as base64.',
  version: '1.0.0',

  params: {
    title: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Title shown as a heading and used for the filename',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Body text. Each newline-separated line becomes a paragraph.',
    },
  },

  // Placeholder request: this tool runs server-side via directExecution only.
  // The ToolConfig type requires `request`, but it is never used for this tool.
  request: {
    url: '',
    method: 'POST',
    headers: () => ({}),
  },

  directExecution: async (params: DocxGenerateParams): Promise<ToolResponse> => {
    try {
      const title = params.title?.trim() || ''
      const content = params.content ?? ''

      const children: Paragraph[] = []

      if (title) {
        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          })
        )
      }

      const lines = content.split(/\r?\n/)
      for (const line of lines) {
        children.push(new Paragraph({ text: line }))
      }

      const doc = new Document({
        sections: [
          {
            children,
          },
        ],
      })

      const buffer = await Packer.toBuffer(doc)
      const base64 = Buffer.from(buffer).toString('base64')

      return {
        success: true,
        output: {
          base64,
          filename: `${title || 'document'}.docx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        output: {},
        error: `Failed to generate DOCX: ${message}`,
      }
    }
  },

  outputs: {
    base64: { type: 'string', description: 'Base64-encoded DOCX file contents' },
    filename: { type: 'string', description: 'Suggested filename for the DOCX' },
    mimeType: { type: 'string', description: 'MIME type of the generated file' },
  },
}
