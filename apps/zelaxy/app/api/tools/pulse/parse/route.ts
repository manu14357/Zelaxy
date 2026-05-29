import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('PulseParseAPI')

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, filePath, file, pages, extractFigure, figureDescription, returnHtml, chunking, chunkSize } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    if (!filePath && !file) {
      return NextResponse.json({ error: 'Either filePath or file is required' }, { status: 400 })
    }

    const formData = new FormData()
    formData.append('apiKey', apiKey)

    if (filePath) {
      formData.append('url', filePath)
    } else if (file && typeof file === 'object') {
      // file is a serialized file object with base64 data
      if (file.url) {
        formData.append('url', file.url)
      } else if (file.data) {
        // base64 encoded file
        const binaryStr = atob(file.data.split(',').pop() ?? file.data)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: file.type || 'application/octet-stream' })
        formData.append('file', blob, file.name || 'document')
      }
    }

    if (pages) formData.append('pages', pages)
    if (extractFigure !== undefined) formData.append('extract_figure', String(extractFigure))
    if (figureDescription !== undefined) formData.append('figure_description', String(figureDescription))
    if (returnHtml !== undefined) formData.append('return_html', String(returnHtml))
    if (chunking) formData.append('chunking', chunking)
    if (chunkSize) formData.append('chunk_size', String(chunkSize))

    const response = await fetch('https://api.pulsemcp.com/v0beta/parse', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('Pulse API error', { status: response.status, data })
      return NextResponse.json(
        { error: data.message || data.error || `Pulse API error: ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      output: data,
    })
  } catch (error: any) {
    logger.error('Pulse parse error', { error: error.message })
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
