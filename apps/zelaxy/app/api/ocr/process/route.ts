/**
 * POST /api/ocr/process
 *
 * Server-side OCR endpoint. The agent handler calls this via fetch() so that
 * OCR always runs on the server (Node.js) — even when the executor is running
 * client-side in the browser for manual / chat executions.
 *
 * Body: { fileUrl: string; fileName: string }
 * Returns: { success: true; text: string; confidence: number; processingTimeMs: number }
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { formatOCRResultForPrompt, processFileOCRFromUrl } from '@/lib/ocr'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // OCR can be slow on large PDFs

const logger = createLogger('OCR-API')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileUrl, fileName } = body as { fileUrl?: string; fileName?: string }

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: fileUrl, fileName' },
        { status: 400 }
      )
    }

    logger.info(`OCR request for: ${fileName}`)
    const start = Date.now()

    const result = await processFileOCRFromUrl(fileUrl, fileName)

    if (!result) {
      logger.warn(`OCR returned null for ${fileName} — unsupported file type or download failure`)
      return NextResponse.json(
        { success: false, error: 'OCR processing failed or file type not supported' },
        { status: 422 }
      )
    }

    const formatted = formatOCRResultForPrompt(result)
    const elapsed = Date.now() - start

    logger.info(
      `OCR complete for ${fileName}: ${result.totalText.length} chars, ` +
        `${result.avgConfidence}% confidence, ${elapsed}ms`
    )

    return NextResponse.json({
      success: true,
      text: result.totalText,
      formattedText: formatted,
      confidence: result.avgConfidence,
      processingTimeMs: elapsed,
      pages: result.pages.length,
    })
  } catch (err) {
    logger.error('OCR processing error', { error: err })
    return NextResponse.json(
      { error: 'Internal OCR processing error', message: String(err) },
      { status: 500 }
    )
  }
}
