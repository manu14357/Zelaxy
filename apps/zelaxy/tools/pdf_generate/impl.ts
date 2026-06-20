import type { ToolConfig, ToolResponse } from '@/tools/types'
import type { PdfGenerateParams } from './types'

// NOTE: `pdf-lib` is imported dynamically inside directExecution (server-only) — a static top-level
// import leaks it into the client bundle (extra weight, and the same Turbopack ESM-parse class of
// failure that `docx` hits). The inline `import('pdf-lib').PDFFont` type below is erased at compile
// time, so it does not pull the runtime in.

/**
 * Wrap a single line of text to fit within a given max width.
 */
function wrapText(
  text: string,
  font: import('pdf-lib').PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  if (text.length === 0) return ['']
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    const width = font.widthOfTextAtSize(candidate, fontSize)
    if (width <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      // If a single word is longer than the line, hard-break it by character.
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let chunk = ''
        for (const ch of word) {
          const next = chunk + ch
          if (font.widthOfTextAtSize(next, fontSize) > maxWidth) {
            if (chunk) lines.push(chunk)
            chunk = ch
          } else {
            chunk = next
          }
        }
        current = chunk
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

export const pdfGenerate: ToolConfig<PdfGenerateParams> = {
  id: 'pdf_generate',
  name: 'Generate PDF',
  description:
    'Generate a PDF document from a title and newline-separated paragraphs. Returns the file as base64.',
  version: '1.0.0',

  params: {
    title: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Title shown at the top of the document and used for the filename',
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

  directExecution: async (params: PdfGenerateParams): Promise<ToolResponse> => {
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')

      const title = params.title?.trim() || ''
      const content = params.content ?? ''

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const pageWidth = 595.28 // A4 width in points
      const pageHeight = 841.89 // A4 height in points
      const margin = 50
      const maxWidth = pageWidth - margin * 2

      const titleSize = 20
      const bodySize = 12
      const bodyLineHeight = bodySize * 1.4

      let page = pdfDoc.addPage([pageWidth, pageHeight])
      let cursorY = pageHeight - margin

      const ensureSpace = (needed: number) => {
        if (cursorY - needed < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          cursorY = pageHeight - margin
        }
      }

      if (title) {
        const titleLines = wrapText(title, boldFont, titleSize, maxWidth)
        for (const line of titleLines) {
          ensureSpace(titleSize * 1.4)
          page.drawText(line, {
            x: margin,
            y: cursorY - titleSize,
            size: titleSize,
            font: boldFont,
            color: rgb(0, 0, 0),
          })
          cursorY -= titleSize * 1.4
        }
        cursorY -= bodyLineHeight // gap after title
      }

      const paragraphs = content.split(/\r?\n/)
      for (const paragraph of paragraphs) {
        const lines = wrapText(paragraph, font, bodySize, maxWidth)
        for (const line of lines) {
          ensureSpace(bodyLineHeight)
          page.drawText(line, {
            x: margin,
            y: cursorY - bodySize,
            size: bodySize,
            font,
            color: rgb(0, 0, 0),
          })
          cursorY -= bodyLineHeight
        }
      }

      const bytes = await pdfDoc.save()
      const base64 = Buffer.from(bytes).toString('base64')

      return {
        success: true,
        output: {
          base64,
          filename: `${title || 'document'}.pdf`,
          mimeType: 'application/pdf',
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        output: {},
        error: `Failed to generate PDF: ${message}`,
      }
    }
  },

  outputs: {
    base64: { type: 'string', description: 'Base64-encoded PDF file contents' },
    filename: { type: 'string', description: 'Suggested filename for the PDF' },
    mimeType: { type: 'string', description: 'MIME type of the generated file' },
  },
}
