import type { ToolConfig } from '@/tools/types'

export const pulseParserTool: ToolConfig = {
  id: 'pulse_parser',
  name: 'Pulse Document Parser',
  description: 'Parse documents (PDF, images, Office docs) using Pulse OCR API',
  version: '1.0.0',

  params: {
    filePath: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'URL to a document to be processed',
    },
    file: {
      type: 'json',
      required: false,
      visibility: 'user-only',
      description: 'Document file to be processed',
    },
    fileUpload: {
      type: 'json',
      required: false,
      visibility: 'hidden',
      description: 'File upload data from file-upload component',
    },
    pages: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Page range to process (1-indexed, e.g., "1-2,5")',
    },
    extractFigure: {
      type: 'boolean',
      required: false,
      visibility: 'hidden',
      description: 'Enable figure extraction from the document',
    },
    figureDescription: {
      type: 'boolean',
      required: false,
      visibility: 'hidden',
      description: 'Generate descriptions/captions for extracted figures',
    },
    returnHtml: {
      type: 'boolean',
      required: false,
      visibility: 'hidden',
      description: 'Include HTML in the response',
    },
    chunking: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Chunking strategies (comma-separated: semantic, header, page, recursive)',
    },
    chunkSize: {
      type: 'number',
      required: false,
      visibility: 'user-only',
      description: 'Maximum characters per chunk when chunking is enabled',
    },
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Pulse API key',
    },
  },

  request: {
    url: '/api/tools/pulse/parse',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: (params: any) => {
      if (!params || typeof params !== 'object') {
        throw new Error('Invalid parameters: Parameters must be provided as an object')
      }

      if (!params.apiKey || typeof params.apiKey !== 'string' || params.apiKey.trim() === '') {
        throw new Error('Missing or invalid API key: A valid Pulse API key is required')
      }

      const requestBody: Record<string, unknown> = {
        apiKey: params.apiKey.trim(),
      }

      const fileInput =
        params.file && typeof params.file === 'object' ? params.file : params.fileUpload
      const hasFileUpload = fileInput && typeof fileInput === 'object'
      const hasFilePath =
        typeof params.filePath === 'string' &&
        params.filePath !== 'null' &&
        params.filePath.trim() !== ''

      if (hasFilePath) {
        const filePathToValidate = params.filePath!.trim()

        if (filePathToValidate.startsWith('/')) {
          requestBody.filePath = filePathToValidate
        } else {
          let url
          try {
            url = new URL(filePathToValidate)
            if (!['http:', 'https:'].includes(url.protocol)) {
              throw new Error(`Invalid protocol: ${url.protocol}. URL must use HTTP or HTTPS protocol`)
            }
          } catch (error: any) {
            throw new Error(
              `Invalid URL format: ${error.message}. Please provide a valid HTTP or HTTPS URL to a document`
            )
          }
          requestBody.filePath = url.toString()
        }
      } else if (hasFileUpload) {
        requestBody.file = fileInput
      } else {
        throw new Error('Missing file input: Please provide a document URL or upload a file')
      }

      if (params.pages && typeof params.pages === 'string' && params.pages.trim() !== '') {
        requestBody.pages = params.pages.trim()
      }
      if (params.extractFigure !== undefined) {
        requestBody.extractFigure = params.extractFigure
      }
      if (params.figureDescription !== undefined) {
        requestBody.figureDescription = params.figureDescription
      }
      if (params.returnHtml !== undefined) {
        requestBody.returnHtml = params.returnHtml
      }
      if (params.chunking && typeof params.chunking === 'string' && params.chunking.trim() !== '') {
        requestBody.chunking = params.chunking.trim()
      }
      if (params.chunkSize !== undefined && params.chunkSize > 0) {
        requestBody.chunkSize = params.chunkSize
      }

      return requestBody
    },
  },

  transformResponse: async (response: Response) => {
    let parseResult: any
    try {
      parseResult = await response.json()
    } catch (jsonError: any) {
      throw new Error(`Failed to parse Pulse response: ${jsonError.message}`)
    }

    if (!parseResult || typeof parseResult !== 'object') {
      throw new Error('Invalid response format from Pulse API')
    }

    const pulseData =
      parseResult.output && typeof parseResult.output === 'object'
        ? parseResult.output
        : parseResult

    return {
      success: true,
      output: {
        markdown: pulseData.markdown ?? '',
        page_count: pulseData.page_count ?? 0,
        job_id: pulseData.job_id ?? '',
        'plan-info': pulseData['plan-info'] ?? { pages_used: 0, tier: 'unknown' },
        bounding_boxes: pulseData.bounding_boxes ?? null,
        extraction_url: pulseData.extraction_url ?? null,
        html: pulseData.html ?? null,
        structured_output: pulseData.structured_output ?? null,
        chunks: pulseData.chunks ?? null,
        figures: pulseData.figures ?? null,
      },
    }
  },

  outputs: {
    markdown: {
      type: 'string',
      description: 'Extracted content in markdown format',
    },
    page_count: {
      type: 'number',
      description: 'Number of pages in the document',
    },
    job_id: {
      type: 'string',
      description: 'Unique job identifier',
    },
    'plan-info': {
      type: 'json',
      description: 'Plan usage information',
    },
    bounding_boxes: {
      type: 'json',
      description: 'Bounding box layout information',
      optional: true,
    },
    extraction_url: {
      type: 'string',
      description: 'URL for extraction results (for large documents)',
      optional: true,
    },
    html: {
      type: 'string',
      description: 'HTML content if requested',
      optional: true,
    },
    structured_output: {
      type: 'json',
      description: 'Structured output if schema was provided',
      optional: true,
    },
    chunks: {
      type: 'json',
      description: 'Chunked content if chunking was enabled',
      optional: true,
    },
    figures: {
      type: 'json',
      description: 'Extracted figures if figure extraction was enabled',
      optional: true,
    },
  },
}
