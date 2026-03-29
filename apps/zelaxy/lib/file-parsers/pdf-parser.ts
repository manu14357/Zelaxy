import { readFile } from 'fs/promises'
// @ts-ignore
import * as pdfParseLib from 'pdf-parse/lib/pdf-parse.js'
import { RawPdfParser } from '@/lib/file-parsers/raw-pdf-parser'
import type { FileParseResult, FileParser } from '@/lib/file-parsers/types'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('PdfParser')

/**
 * Minimum meaningful text length. If pdf-parse returns fewer non-whitespace
 * characters than this, we treat the result as "empty" and fall back to
 * RawPdfParser which uses stream decompression and low-level BT/ET extraction.
 */
const MIN_MEANINGFUL_TEXT_LENGTH = 10

/**
 * Detect whether extracted "text" is actually raw PDF internal structure
 * (object dictionaries, cross-reference tables, etc.) rather than
 * human-readable content.
 *
 * Engineering-drawing PDFs produced by AutoCAD's pdfplot driver store
 * all geometry as vector paths with no text layer. Both `pdf-parse` and
 * `RawPdfParser` may return the raw PDF syntax as "text" in these cases.
 */
export function isPdfStructureGarbage(text: string): boolean {
  if (!text || text.length === 0) return true

  const sample = text.slice(0, 4000) // check a representative sample
  const len = sample.length
  if (len < 20) return true

  // Count PDF-internal markers
  const endObjCount = (sample.match(/\bendobj\b/g) || []).length
  const objRefCount = (sample.match(/\d+\s+\d+\s+R\b/g) || []).length
  const dictStartCount = (sample.match(/<<\s*\//g) || []).length
  const typeTagCount = (sample.match(/\/Type\s*\//g) || []).length

  const markerDensity = (endObjCount + objRefCount + dictStartCount + typeTagCount) / (len / 1000)

  // If there are more than ~3 PDF markers per 1000 chars, it's structure
  if (markerDensity > 3) {
    logger.info(
      `Detected PDF structure garbage (marker density: ${markerDensity.toFixed(1)}/1k chars, ` +
        `endobj: ${endObjCount}, objRef: ${objRefCount}, dict: ${dictStartCount}, typeTag: ${typeTagCount})`
    )
    return true
  }

  return false
}

export class PdfParser implements FileParser {
  async parseFile(filePath: string): Promise<FileParseResult> {
    try {
      logger.info('Starting to parse file:', filePath)

      // Make sure we're only parsing the provided file path
      if (!filePath) {
        throw new Error('No file path provided')
      }

      // Read the file
      logger.info('Reading file...')
      const dataBuffer = await readFile(filePath)
      logger.info('File read successfully, size:', dataBuffer.length)

      return this.parseBuffer(dataBuffer)
    } catch (error) {
      logger.error('Error reading file:', error)
      throw error
    }
  }

  async parseBuffer(dataBuffer: Buffer): Promise<FileParseResult> {
    try {
      logger.info('Starting to parse buffer, size:', dataBuffer.length)

      // Try to parse with pdf-parse library first
      try {
        logger.info('Attempting to parse with pdf-parse library...')

        // Parse PDF with direct function call to avoid test file access
        logger.info('Starting PDF parsing...')
        const data = await pdfParseLib.default(dataBuffer)
        logger.info('PDF parsed successfully with pdf-parse, pages:', data.numpages)

        // Check if pdf-parse returned meaningful text.
        // Scanned / image-based PDFs often parse "successfully" but yield
        // only whitespace, newlines, or raw PDF internal structure.
        const trimmedText = (data.text ?? '').trim()
        const textIsUsable =
          trimmedText.length >= MIN_MEANINGFUL_TEXT_LENGTH && !isPdfStructureGarbage(trimmedText)

        if (textIsUsable) {
          return {
            content: data.text,
            metadata: {
              pageCount: data.numpages,
              info: data.info,
              version: data.version,
            },
          }
        }

        // pdf-parse returned near-empty text — fall back to RawPdfParser
        logger.warn(
          `pdf-parse returned only ${trimmedText.length} chars of text ` +
            `(pages: ${data.numpages}). Falling back to RawPdfParser for deeper extraction.`
        )

        const rawParser = new RawPdfParser()
        const rawResult = await rawParser.parseBuffer(dataBuffer)

        // Validate that RawPdfParser didn't just return PDF structure garbage
        const rawContent = (rawResult.content ?? '').trim()
        const rawIsUsable =
          rawContent.length >= MIN_MEANINGFUL_TEXT_LENGTH && !isPdfStructureGarbage(rawContent)

        if (!rawIsUsable) {
          logger.warn(
            `RawPdfParser also failed to extract readable text (${rawContent.length} chars, ` +
              `structure garbage: ${isPdfStructureGarbage(rawContent)}). ` +
              `Returning empty content so vision fallback can be used.`
          )
          return {
            content: '',
            metadata: {
              pageCount: data.numpages,
              info: data.info,
              version: data.version,
              pdfParseTextLength: trimmedText.length,
              rawParserTextLength: rawContent.length,
              fallbackUsed: 'RawPdfParser',
              extractionFailed: true,
            },
          }
        }

        // Merge metadata from both attempts
        return {
          content: rawResult.content,
          metadata: {
            ...rawResult.metadata,
            pageCount: data.numpages || rawResult.metadata?.pageCount,
            info: {
              ...data.info,
              ...((rawResult.metadata?.info as Record<string, unknown>) ?? {}),
            },
            version: data.version || rawResult.metadata?.version,
            pdfParseTextLength: trimmedText.length,
            fallbackUsed: 'RawPdfParser',
          },
        }
      } catch (pdfParseError: unknown) {
        logger.error('PDF-parse library failed:', pdfParseError)

        // Fallback to manual text extraction
        logger.info('Falling back to manual text extraction...')

        // Extract basic PDF info from raw content
        const rawContent = dataBuffer.toString('utf-8', 0, Math.min(10000, dataBuffer.length))

        let version = 'Unknown'
        let pageCount = 0

        // Try to extract PDF version
        const versionMatch = rawContent.match(/%PDF-(\d+\.\d+)/)
        if (versionMatch?.[1]) {
          version = versionMatch[1]
        }

        // Try to get page count
        const pageMatches = rawContent.match(/\/Type\s*\/Page\b/g)
        if (pageMatches) {
          pageCount = pageMatches.length
        }

        // Try to extract text by looking for text-related operators in the PDF
        let extractedText = ''

        // Look for text in the PDF content using common patterns
        const textMatches = rawContent.match(/BT[\s\S]*?ET/g)
        if (textMatches && textMatches.length > 0) {
          extractedText = textMatches
            .map((textBlock) => {
              // Extract text objects (Tj, TJ) from the text block
              const textObjects = textBlock.match(/\([^)]*\)\s*Tj|\[[^\]]*\]\s*TJ/g)
              if (textObjects) {
                return textObjects
                  .map((obj) => {
                    // Clean up text objects
                    return (
                      obj
                        .replace(
                          /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g,
                          (match, p1, p2) => p1 || p2 || ''
                        )
                        // Clean up PDF escape sequences
                        .replace(/\\(\d{3}|[()\\])/g, '')
                        .replace(/\\\\/g, '\\')
                        .replace(/\\\(/g, '(')
                        .replace(/\\\)/g, ')')
                    )
                  })
                  .join(' ')
              }
              return ''
            })
            .join('\n')
        }

        // If we couldn't extract text or the text is too short, return a fallback message
        if (!extractedText || extractedText.length < 50) {
          extractedText = `This PDF contains ${pageCount} page(s) but text extraction was not successful.`
        }

        return {
          content: extractedText,
          metadata: {
            pageCount,
            version,
            fallback: true,
            error: (pdfParseError as Error).message || 'Unknown error',
          },
        }
      }
    } catch (error) {
      logger.error('Error parsing buffer:', error)
      throw error
    }
  }
}
