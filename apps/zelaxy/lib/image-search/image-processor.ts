/**
 * Image Processor
 *
 * Handles processing of standard image files (PNG, JPG, TIFF, BMP, etc.)
 * for text extraction, metadata extraction, and thumbnail generation.
 *
 * Uses:
 *   - sharp (already in deps) for thumbnail generation and EXIF metadata
 *   - AI Vision (GPT-4o/Claude) for image description and OCR
 *   - Mistral OCR for scanned document images
 */

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import type { ExtractedTextResult, TextEntity } from './types'

// ==========================================
// Image Metadata Extraction
// ==========================================

export interface ImageMetadata {
  width: number
  height: number
  format: string
  channels: number
  fileSize: number
  density?: number // DPI
  hasAlpha: boolean
  orientation?: number
  exif?: Record<string, any>
}

/**
 * Extract metadata from an image file using sharp
 */
export async function extractImageMetadata(filePath: string): Promise<ImageMetadata> {
  try {
    // Dynamic import sharp since it's a native module
    const sharp = (await import('sharp')).default
    const metadata = await sharp(filePath).metadata()
    const stats = await fs.stat(filePath)

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      channels: metadata.channels || 0,
      fileSize: stats.size,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation,
      exif: metadata.exif
        ? {
            raw: 'EXIF data present',
          }
        : undefined,
    }
  } catch {
    // Fallback if sharp fails
    const stats = await fs.stat(filePath)
    return {
      width: 0,
      height: 0,
      format: path.extname(filePath).replace('.', ''),
      channels: 0,
      fileSize: stats.size,
      hasAlpha: false,
    }
  }
}

// ==========================================
// Thumbnail Generation
// ==========================================

/**
 * Generate a thumbnail for an image file
 */
export async function generateThumbnail(filePath: string, maxSize = 512): Promise<string | null> {
  try {
    const sharp = (await import('sharp')).default
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'img-thumb-'))
    const thumbnailPath = path.join(tmpDir, 'thumbnail.png')

    await sharp(filePath)
      .resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png({ quality: 80 })
      .toFile(thumbnailPath)

    return thumbnailPath
  } catch {
    return null
  }
}

/**
 * Convert an image to base64 data URL
 */
export async function imageToDataUrl(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  }
  const mime = mimeMap[ext] || 'image/png'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

// ==========================================
// AI Vision Text Extraction
// ==========================================

/**
 * Extract text from an image using AI Vision (GPT-4o or Claude)
 */
export async function extractTextFromImage(
  imageUrl: string,
  apiKey: string,
  model = 'gpt-4o'
): Promise<ExtractedTextResult> {
  const prompt = `Analyze this image and extract ALL text visible in it.
This includes:
- Any printed or handwritten text
- Labels, captions, titles
- Numbers, codes, identifiers
- Signs, logos with text
- Watermarks
- Technical annotations or specifications

Return the extracted text organized by location/category.
If this is a technical drawing or blueprint, also identify:
- Part numbers, dimensions, materials
- Drawing title, number, revision
- Author, date, scale information

Be thorough — extract every piece of readable text.`

  if (model.startsWith('claude')) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: imageUrl } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude Vision failed: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      content: Array<{ type: string; text?: string }>
    }
    const text = result.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')

    return {
      text,
      method: 'ai_vision',
      confidence: 0.8,
      entities: parseVisionOutput(text),
    }
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`GPT-4o Vision failed: ${response.statusText}`)
  }

  const result = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  const text = result.choices[0]?.message?.content || ''

  return {
    text,
    method: 'ai_vision',
    confidence: 0.8,
    entities: parseVisionOutput(text),
  }
}

// ==========================================
// Mistral OCR for Document Images
// ==========================================

/**
 * Extract text from a document image using Mistral OCR
 */
export async function extractTextWithMistralOCR(
  imageUrl: string,
  apiKey: string
): Promise<ExtractedTextResult> {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        image_url: imageUrl,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Mistral OCR failed: ${response.statusText}`)
  }

  const result = (await response.json()) as {
    pages?: Array<{ markdown: string }>
  }

  const text = result.pages?.map((p) => p.markdown).join('\n\n') || ''

  return {
    text,
    method: 'ocr',
    confidence: 0.9,
    entities: text
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => ({
        text: l.trim(),
        type: 'text' as const,
      })),
  }
}

// ==========================================
// Main Image Processing Entry Point
// ==========================================

export interface ImageProcessingOptions {
  apiKey?: string
  visionModel?: string
  mistralApiKey?: string
  generateThumbnailFlag?: boolean
  extractText?: boolean
}

/**
 * Process a standard image file — extract metadata, generate thumbnail, extract text
 */
export async function processImageFile(
  filePath: string,
  options: ImageProcessingOptions
): Promise<{
  metadata: ImageMetadata
  extractedText: string
  textResult: ExtractedTextResult | null
  thumbnailPath: string | null
}> {
  // Extract metadata
  const metadata = await extractImageMetadata(filePath)

  // Generate thumbnail
  let thumbnailPath: string | null = null
  if (options.generateThumbnailFlag !== false) {
    thumbnailPath = await generateThumbnail(filePath)
  }

  // Extract text
  let extractedText = ''
  let textResult: ExtractedTextResult | null = null

  if (options.extractText !== false && options.apiKey) {
    try {
      const imageUrl = await imageToDataUrl(filePath)

      // Try Mistral OCR first (better for documents/scans)
      if (options.mistralApiKey) {
        try {
          textResult = await extractTextWithMistralOCR(imageUrl, options.mistralApiKey)
          extractedText = textResult.text
        } catch {
          // Fall back to AI Vision
        }
      }

      // Fall back to AI Vision
      if (!textResult && options.apiKey) {
        textResult = await extractTextFromImage(imageUrl, options.apiKey, options.visionModel)
        extractedText = textResult.text
      }
    } catch (error) {
      // Text extraction is best-effort
      console.error('Image text extraction failed:', error)
    }
  }

  return {
    metadata,
    extractedText,
    textResult,
    thumbnailPath,
  }
}

// ==========================================
// SVG Text Extraction
// ==========================================

/**
 * Extract text content from an SVG file
 */
export async function extractTextFromSVG(filePath: string): Promise<ExtractedTextResult> {
  const content = await fs.readFile(filePath, 'utf-8')

  const entities: TextEntity[] = []

  // Extract <text> elements
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi
  let match: RegExpExecArray | null
  while ((match = textRegex.exec(content)) !== null) {
    const textContent = match[1]
      .replace(/<[^>]+>/g, '') // Remove nested tags like <tspan>
      .trim()
    if (textContent) {
      entities.push({ text: textContent, type: 'text' })
    }
  }

  // Extract <tspan> elements (nested text)
  const tspanRegex = /<tspan[^>]*>([\s\S]*?)<\/tspan>/gi
  while ((match = tspanRegex.exec(content)) !== null) {
    const textContent = match[1].replace(/<[^>]+>/g, '').trim()
    if (textContent && !entities.some((e) => e.text === textContent)) {
      entities.push({ text: textContent, type: 'text' })
    }
  }

  // Extract title and desc elements
  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/gi
  while ((match = titleRegex.exec(content)) !== null) {
    entities.push({ text: match[1].trim(), type: 'title' })
  }

  const combinedText = entities.map((e) => e.text).join('\n')

  return {
    text: combinedText,
    method: 'ocr',
    confidence: 0.95,
    entities,
  }
}

// ==========================================
// Helpers
// ==========================================

function parseVisionOutput(text: string): TextEntity[] {
  const entities: TextEntity[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length < 2) continue

    // Skip markdown formatting
    if (trimmed.startsWith('#') || trimmed === '---') continue

    // Clean up bullet points
    const cleaned = trimmed
      .replace(/^[-•*]\s*/, '')
      .replace(/^\d+\.\s*/, '')
      .trim()

    if (cleaned.length > 0) {
      entities.push({
        text: cleaned,
        type: 'text',
      })
    }
  }

  return entities
}
