import PptxGenJS from 'pptxgenjs'
import type { ToolConfig, ToolResponse } from '@/tools/types'
import type { PptxGenerateParams } from './types'

interface SlideSpec {
  title?: string
  body?: string
}

/**
 * Parse the `slides` param. Accepts either:
 *  - a JSON array of { title, body } objects, or
 *  - plain text with one slide per line.
 */
function parseSlides(raw: string): SlideSpec[] {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => {
          if (item && typeof item === 'object') {
            return {
              title: item.title != null ? String(item.title) : undefined,
              body: item.body != null ? String(item.body) : undefined,
            }
          }
          return { body: String(item) }
        })
      }
    } catch {
      // Fall through to line-based parsing.
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({ title: line }))
}

export const pptxGenerate: ToolConfig<PptxGenerateParams> = {
  id: 'pptx_generate',
  name: 'Generate PPTX',
  description:
    'Generate a PowerPoint (.pptx) presentation. Slides can be one-per-line text or a JSON array of {title, body}. Returns the file as base64.',
  version: '1.0.0',

  params: {
    title: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Presentation title used for the filename',
    },
    slides: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Slides: one slide per line, OR a JSON array of objects like [{"title":"...","body":"..."}].',
    },
  },

  // Placeholder request: this tool runs server-side via directExecution only.
  // The ToolConfig type requires `request`, but it is never used for this tool.
  request: {
    url: '',
    method: 'POST',
    headers: () => ({}),
  },

  directExecution: async (params: PptxGenerateParams): Promise<ToolResponse> => {
    try {
      const title = params.title?.trim() || ''
      const specs = parseSlides(params.slides)

      const pptx = new PptxGenJS()

      if (specs.length === 0) {
        // Always emit at least one slide so the file is valid.
        const slide = pptx.addSlide()
        slide.addText(title || 'Presentation', {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: 28,
          bold: true,
        })
      } else {
        for (const spec of specs) {
          const slide = pptx.addSlide()
          if (spec.title) {
            slide.addText(spec.title, {
              x: 0.5,
              y: 0.4,
              w: 9,
              h: 1,
              fontSize: 28,
              bold: true,
            })
          }
          if (spec.body) {
            slide.addText(spec.body, {
              x: 0.5,
              y: spec.title ? 1.6 : 0.5,
              w: 9,
              h: 4,
              fontSize: 16,
            })
          }
        }
      }

      // pptxgenjs returns a string when outputType is 'base64'; the typed
      // return is a union, so narrow it explicitly.
      const result = await pptx.write({ outputType: 'base64' })
      const base64 =
        typeof result === 'string' ? result : Buffer.from(result as ArrayBuffer).toString('base64')

      return {
        success: true,
        output: {
          base64,
          filename: `${title || 'presentation'}.pptx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        output: {},
        error: `Failed to generate PPTX: ${message}`,
      }
    }
  },

  outputs: {
    base64: { type: 'string', description: 'Base64-encoded PPTX file contents' },
    filename: { type: 'string', description: 'Suggested filename for the PPTX' },
    mimeType: { type: 'string', description: 'MIME type of the generated file' },
  },
}
