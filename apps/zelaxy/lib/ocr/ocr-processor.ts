/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       Server-Side OCR Pipeline for Agent Block               ║
 * ║  Extracts text from images & PDFs using Tesseract.js         ║
 * ║  Supports: PNG, JPG, JPEG, WEBP, TIFF, BMP, GIF, PDF        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ⚠ This module must ONLY run server-side (Node.js). It is imported
 *   by the API route at /api/ocr/process, never by client code.
 *
 * Pipeline:
 *  - Images → preprocess (sharp) → Tesseract OCR → text
 *  - PDFs   → try native text extraction first (pdf-parse)
 *           → if insufficient → render pages to images (mupdf) → OCR each page
 *
 * PDF rendering uses **mupdf** (WASM-based, zero system deps) because
 * sharp's pre-built binary doesn't include poppler/pdfium on most installs.
 */

import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('OCRProcessor')

// ── Types ────────────────────────────────────────────────────────────────────

export interface OCRPageResult {
  page: number | null
  text: string
  confidence: number
  isNative?: boolean
}

export interface OCRResult {
  fileName: string
  fileType: 'image' | 'pdf'
  pages: OCRPageResult[]
  totalText: string
  avgConfidence: number
  processingTimeMs: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif', 'bmp', 'gif'])

const PDF_EXTENSION = 'pdf'

/** Minimum chars from native PDF text extraction to consider "meaningful" */
const MIN_PDF_TEXT_LENGTH = 30

// ── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(fileName: string): string {
  const dotIdx = fileName.lastIndexOf('.')
  if (dotIdx === -1) return ''
  return fileName.slice(dotIdx + 1).toLowerCase()
}

/**
 * Detect raw PDF internal structure mistakenly "extracted" as text.
 */
function looksLikePdfStructure(text: string): boolean {
  if (!text || text.length < 20) return false
  const sample = text.slice(0, 4000)
  const len = sample.length
  const density =
    ((sample.match(/\bendobj\b/g) || []).length +
      (sample.match(/\d+\s+\d+\s+R\b/g) || []).length +
      (sample.match(/<<\s*\//g) || []).length +
      (sample.match(/\/Type\s*\//g) || []).length) /
    (len / 1000)
  return density > 3
}

// ── Image preprocessing with sharp ───────────────────────────────────────────

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default
    return await sharp(buffer).greyscale().normalize().sharpen().png().toBuffer()
  } catch {
    logger.warn('Image preprocessing failed, using original buffer')
    return buffer
  }
}

async function resizeIfNeeded(buffer: Buffer, maxDim = 4000): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default
    const { width, height } = await sharp(buffer).metadata()
    if (!width || !height || (width <= maxDim && height <= maxDim)) return buffer
    logger.info(`Resizing image from ${width}x${height} to fit ${maxDim}px`)
    return await sharp(buffer)
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer()
  } catch {
    return buffer
  }
}

// ── Tesseract OCR ────────────────────────────────────────────────────────────

async function ocrBuffer(
  buffer: Buffer,
  lang = 'eng'
): Promise<{ text: string; confidence: number }> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(lang, undefined, { logger: () => {} })
  try {
    const { data } = await worker.recognize(buffer)
    return { text: (data.text || '').trim(), confidence: Math.round(data.confidence ?? 0) }
  } finally {
    await worker.terminate()
  }
}

// ── PDF: Native text extraction ──────────────────────────────────────────────

async function tryNativePdfText(buf: Buffer): Promise<{ text: string; pages: number } | null> {
  try {
    // @ts-ignore — no types for this sub-path
    const pdfParseLib = await import('pdf-parse/lib/pdf-parse.js')
    const pdfParse = pdfParseLib.default || pdfParseLib
    const data = await pdfParse(buf)
    const text = (data.text || '').trim()
    if (text.length >= MIN_PDF_TEXT_LENGTH && !looksLikePdfStructure(text)) {
      logger.info(`Native PDF extraction: ${text.length} chars, ${data.numpages} pages`)
      return { text, pages: data.numpages }
    }
    logger.info(`Native PDF text insufficient (${text.length} chars) — falling through to OCR`)
    return null
  } catch (err) {
    logger.warn('Native PDF extraction failed', { error: err })
    return null
  }
}

// ── PDF: Render pages to images with mupdf ───────────────────────────────────

/**
 * Render PDF pages to PNG buffers using mupdf (WASM-based, no system deps).
 */
async function pdfToImageBuffers(pdfBuffer: Buffer, dpi = 300): Promise<Buffer[]> {
  const mupdfMod = await import('mupdf')
  const mupdf = mupdfMod.default || mupdfMod
  const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf')
  const pageCount = doc.countPages()
  const scale = dpi / 72

  logger.info(`mupdf: rendering ${pageCount} page(s) at ${dpi} DPI`)

  const buffers: Buffer[] = []
  for (let i = 0; i < pageCount; i++) {
    try {
      const page = doc.loadPage(i)
      const pixmap = page.toPixmap([scale, 0, 0, scale, 0, 0], mupdf.ColorSpace.DeviceRGB)
      const pngBuf = Buffer.from(pixmap.asPNG())
      logger.info(
        `Page ${i + 1}: ${pixmap.getWidth()}x${pixmap.getHeight()} (${pngBuf.length} bytes)`
      )
      buffers.push(pngBuf)
    } catch (err) {
      logger.warn(`Failed to render page ${i + 1}`, { error: err })
    }
  }
  return buffers
}

// ── Main Pipeline ────────────────────────────────────────────────────────────

/**
 * Process a single image file through OCR.
 */
export async function processImageOCR(buffer: Buffer, fileName: string): Promise<OCRResult> {
  const start = Date.now()
  let processed = await preprocessImage(buffer)
  processed = await resizeIfNeeded(processed)
  const result = await ocrBuffer(processed)
  logger.info(
    `Image OCR "${fileName}": ${result.text.length} chars, ${result.confidence}% conf, ${Date.now() - start}ms`
  )
  return {
    fileName,
    fileType: 'image',
    pages: [{ page: null, text: result.text, confidence: result.confidence }],
    totalText: result.text,
    avgConfidence: result.confidence,
    processingTimeMs: Date.now() - start,
  }
}

/**
 * Process a PDF file through the OCR pipeline.
 *  1. Try native text extraction (pdf-parse) — fast path for searchable PDFs
 *  2. If insufficient → render pages to images (mupdf) → OCR each page
 */
export async function processPdfOCR(buffer: Buffer, fileName: string): Promise<OCRResult> {
  const start = Date.now()

  // Step 1: try native extraction
  const native = await tryNativePdfText(buffer)
  if (native) {
    return {
      fileName,
      fileType: 'pdf',
      pages: [{ page: null, text: native.text, confidence: 100, isNative: true }],
      totalText: native.text,
      avgConfidence: 100,
      processingTimeMs: Date.now() - start,
    }
  }

  // Step 2: render pages → OCR
  const imageBuffers = await pdfToImageBuffers(buffer)
  if (imageBuffers.length === 0) {
    logger.error(`Could not render PDF "${fileName}" to images`)
    return {
      fileName,
      fileType: 'pdf',
      pages: [],
      totalText: '',
      avgConfidence: 0,
      processingTimeMs: Date.now() - start,
    }
  }

  const pageResults: OCRPageResult[] = []
  for (let i = 0; i < imageBuffers.length; i++) {
    const result = await ocrBuffer(imageBuffers[i])
    logger.info(`OCR page ${i + 1}: ${result.text.length} chars, ${result.confidence}% conf`)
    pageResults.push({ page: i + 1, text: result.text, confidence: result.confidence })
  }

  const totalText = pageResults
    .map((p, i) => (pageResults.length > 1 ? `--- Page ${i + 1} ---\n${p.text}` : p.text))
    .join('\n\n')
    .trim()

  const avgConf =
    pageResults.length > 0
      ? Math.round(pageResults.reduce((s, p) => s + p.confidence, 0) / pageResults.length)
      : 0

  logger.info(
    `PDF OCR "${fileName}": ${pageResults.length} pages, ${totalText.length} chars, avg conf ${avgConf}%, ${Date.now() - start}ms`
  )

  return {
    fileName,
    fileType: 'pdf',
    pages: pageResults,
    totalText,
    avgConfidence: avgConf,
    processingTimeMs: Date.now() - start,
  }
}

/**
 * Auto-detect file type and run the appropriate OCR pipeline.
 */
export async function processFileOCR(buffer: Buffer, fileName: string): Promise<OCRResult | null> {
  const ext = getExtension(fileName)
  if (IMAGE_EXTENSIONS.has(ext)) return processImageOCR(buffer, fileName)
  if (ext === PDF_EXTENSION) return processPdfOCR(buffer, fileName)
  logger.warn(`OCR not supported for .${ext} (${fileName})`)
  return null
}

/**
 * Download a file from a URL and run it through the OCR pipeline.
 */
export async function processFileOCRFromUrl(
  fileUrl: string,
  fileName: string
): Promise<OCRResult | null> {
  const ext = getExtension(fileName)
  if (!IMAGE_EXTENSIONS.has(ext) && ext !== PDF_EXTENSION) {
    logger.warn(`OCR not supported for .${ext} (${fileName})`)
    return null
  }

  logger.info(`Downloading file for OCR: ${fileName}`)
  const response = await fetch(fileUrl)
  if (!response.ok) {
    logger.error(`Failed to download file: HTTP ${response.status}`)
    return null
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  logger.info(`Downloaded ${fileName}: ${buffer.length} bytes`)
  return processFileOCR(buffer, fileName)
}

/** Check if a file is eligible for OCR processing. */
export function isOCREligible(fileName: string): boolean {
  const ext = getExtension(fileName)
  return IMAGE_EXTENSIONS.has(ext) || ext === PDF_EXTENSION
}

/** Format OCR result for inclusion in an LLM prompt. */
export function formatOCRResultForPrompt(result: OCRResult): string {
  const lines = [`--- OCR Extracted Text: ${result.fileName} ---`]
  if (!result.totalText) {
    lines.push('[No text could be extracted from this file via OCR]')
  } else {
    if (result.avgConfidence < 50) {
      lines.push(`[Note: Low OCR confidence (${result.avgConfidence}%) — text may contain errors]`)
    }
    lines.push(result.totalText)
  }
  lines.push(`--- End of OCR: ${result.fileName} ---`)
  return lines.join('\n')
}
