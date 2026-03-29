/**
 * Image Search Indexer
 *
 * Orchestrates the full indexing pipeline:
 *   1. File discovery from connectors
 *   2. File download (if remote)
 *   3. Text/metadata extraction (DWG processor, image processor)
 *   4. Spatial data extraction
 *   5. Embedding generation (text + visual)
 *   6. Database insert (document + embeddings)
 *
 * Supports batch and real-time processing modes.
 */

import crypto from 'crypto'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { type DWGProcessingOptions, processDWGFile } from './dwg-processor'
import {
  extractTextFromSVG,
  type ImageProcessingOptions,
  processImageFile,
} from './image-processor'
import { generateSpatialSummary, normalizeSpatialData } from './spatial-extractor'
import type {
  DiscoveredFile,
  ExtractionMethod,
  FileProcessingResult,
  IndexingJob,
  IndexingProgress,
  SpatialData,
} from './types'

// ==========================================
// Text Chunking (matches knowledge base pattern)
// ==========================================

interface ChunkConfig {
  maxSize: number
  overlap: number
  minSize: number
}

const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  maxSize: 1024,
  overlap: 200,
  minSize: 50,
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string, config: ChunkConfig = DEFAULT_CHUNK_CONFIG): string[] {
  if (!text || text.length < config.minSize) {
    return text ? [text] : []
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + config.maxSize

    // Try to break at a sentence/paragraph boundary
    if (end < text.length) {
      const breakPoints = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ']
      for (const bp of breakPoints) {
        const lastBreak = text.lastIndexOf(bp, end)
        if (lastBreak > start + config.maxSize * 0.5) {
          end = lastBreak + bp.length
          break
        }
      }
    } else {
      end = text.length
    }

    const chunk = text.slice(start, end).trim()
    if (chunk.length >= config.minSize) {
      chunks.push(chunk)
    }

    start = end - config.overlap
    if (start < 0) start = 0
    if (start >= text.length) break
  }

  return chunks
}

// ==========================================
// File Downloader (for remote files)
// ==========================================

/**
 * Download a remote file to a local temp directory
 */
async function downloadFile(
  file: DiscoveredFile
): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'imgsearch-'))
  const localPath = path.join(tmpDir, file.filename)

  // S3 presigned URL, Azure Blob URL, HTTP URL
  if (
    file.filePath.startsWith('http://') ||
    file.filePath.startsWith('https://') ||
    file.filePath.startsWith('data:')
  ) {
    const response = await fetch(file.filePath)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.writeFile(localPath, buffer)
  } else if (file.filePath.startsWith('s3://')) {
    // For S3, we need to use the SDK — the presigned URL should be in metadata
    throw new Error(`Direct S3 download not supported — use presigned URLs`)
  } else if (file.filePath.startsWith('gdrive://')) {
    // For Google Drive, download via API
    const fileId = file.filePath.replace('gdrive://', '')
    const accessToken = file.metadata?.accessToken
    if (!accessToken) {
      throw new Error('Google Drive access token required')
    }
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      throw new Error(`Google Drive download failed: ${response.statusText}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.writeFile(localPath, buffer)
  } else {
    // Local/network file — just return path directly
    return {
      localPath: file.filePath,
      cleanup: async () => {
        try {
          await fs.rm(tmpDir, { recursive: true })
        } catch {
          /* best effort */
        }
      },
    }
  }

  return {
    localPath,
    cleanup: async () => {
      try {
        await fs.rm(tmpDir, { recursive: true })
      } catch {
        /* best effort */
      }
    },
  }
}

// ==========================================
// Single File Processor
// ==========================================

export interface ProcessingConfig {
  extractionMethod: ExtractionMethod
  apiKey?: string // OpenAI/Anthropic API key for AI Vision
  visionModel?: string
  mistralApiKey?: string
  apsClientId?: string
  apsClientSecret?: string
  chunkConfig?: ChunkConfig
}

/**
 * Process a single file — extract text, metadata, spatial data, generate thumbnail
 */
export async function processFile(
  file: DiscoveredFile,
  config: ProcessingConfig
): Promise<FileProcessingResult> {
  const startTime = Date.now()
  const documentId = crypto.randomUUID()

  try {
    const { localPath, cleanup } = await downloadFile(file)

    try {
      let extractedText = ''
      let metadata: Record<string, any> = file.metadata || {}
      let spatialData: SpatialData | null = null
      let thumbnailUrl: string | null = null
      let extractionMethod: ExtractionMethod = config.extractionMethod

      switch (file.fileType) {
        case 'dwg':
        case 'dxf': {
          const dwgOptions: DWGProcessingOptions = {
            method: config.extractionMethod,
            apiKey: config.apiKey,
            visionModel: config.visionModel,
            apsConfig:
              config.apsClientId && config.apsClientSecret
                ? {
                    clientId: config.apsClientId,
                    clientSecret: config.apsClientSecret,
                  }
                : undefined,
          }

          const result = await processDWGFile(localPath, dwgOptions)
          extractedText = result.textResult.text
          extractionMethod = result.textResult.method
          spatialData = normalizeSpatialData(result.spatialData)
          thumbnailUrl = result.thumbnailUrl

          // Append spatial summary to extracted text for better search
          const spatialSummary = generateSpatialSummary(spatialData)
          if (spatialSummary) {
            extractedText = `${extractedText}\n\n--- Spatial Summary ---\n${spatialSummary}`
          }

          // Add DWG-specific metadata
          metadata = {
            ...metadata,
            layerCount: spatialData.layers.length,
            blockCount: spatialData.blocks.length,
            dimensionCount: spatialData.dimensions.length,
            units: spatialData.units,
          }
          break
        }

        case 'svg': {
          const svgResult = await extractTextFromSVG(localPath)
          extractedText = svgResult.text
          extractionMethod = 'ocr'
          break
        }

        case 'pdf': {
          // Use Mistral OCR if available, otherwise standard parser
          if (config.mistralApiKey) {
            const { extractTextWithMistralOCR } = await import('./image-processor')
            const imageBuffer = await fs.readFile(localPath)
            const dataUrl = `data:application/pdf;base64,${imageBuffer.toString('base64')}`
            const result = await extractTextWithMistralOCR(dataUrl, config.mistralApiKey)
            extractedText = result.text
            extractionMethod = 'ocr'
          } else {
            // Use existing file parser
            extractedText = `[PDF file: ${file.filename}]`
            extractionMethod = 'auto'
          }
          break
        }

        case 'image': {
          const imgOptions: ImageProcessingOptions = {
            apiKey: config.apiKey,
            visionModel: config.visionModel,
            mistralApiKey: config.mistralApiKey,
            generateThumbnailFlag: true,
            extractText: true,
          }

          const result = await processImageFile(localPath, imgOptions)
          extractedText = result.extractedText
          thumbnailUrl = result.thumbnailPath
          extractionMethod = result.textResult?.method || 'ai_vision'

          // Add image metadata
          metadata = {
            ...metadata,
            width: result.metadata.width,
            height: result.metadata.height,
            format: result.metadata.format,
            density: result.metadata.density,
          }
          break
        }
      }

      return {
        documentId,
        filename: file.filename,
        fileType: file.fileType,
        extractedText,
        textLength: extractedText.length,
        metadata,
        spatialData,
        thumbnailUrl,
        extractionMethod,
        processingTimeMs: Date.now() - startTime,
      }
    } finally {
      await cleanup()
    }
  } catch (error) {
    return {
      documentId,
      filename: file.filename,
      fileType: file.fileType,
      extractedText: '',
      textLength: 0,
      metadata: file.metadata || {},
      spatialData: null,
      thumbnailUrl: null,
      extractionMethod: config.extractionMethod,
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// ==========================================
// Batch Indexing
// ==========================================

/**
 * Process a batch of files and report progress.
 * Returns processed results for database insertion.
 */
export async function processBatch(
  job: IndexingJob,
  config: ProcessingConfig
): Promise<{
  results: FileProcessingResult[]
  progress: IndexingProgress
}> {
  const results: FileProcessingResult[] = []
  const progress: IndexingProgress = {
    catalogId: job.catalogId,
    totalFiles: job.files.length,
    processedFiles: 0,
    failedFiles: 0,
    percentage: 0,
    status: 'processing',
    errors: [],
  }

  const batchSize = job.batchSize || 10

  // Process files in batches
  for (let i = 0; i < job.files.length; i += batchSize) {
    const batch = job.files.slice(i, i + batchSize)

    // Process batch concurrently
    const batchResults = await Promise.allSettled(batch.map((file) => processFile(file, config)))

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j]

      if (result.status === 'fulfilled') {
        results.push(result.value)
        if (result.value.error) {
          progress.failedFiles++
          progress.errors.push({
            filename: result.value.filename,
            error: result.value.error,
          })
        }
      } else {
        progress.failedFiles++
        progress.errors.push({
          filename: batch[j].filename,
          error: result.reason?.message || 'Unknown error',
        })
      }

      progress.processedFiles++
      progress.percentage = Math.round((progress.processedFiles / progress.totalFiles) * 100)
      progress.currentFile = batch[j].filename

      // Report progress
      job.onProgress?.(progress)
    }
  }

  progress.status = progress.failedFiles === progress.totalFiles ? 'failed' : 'completed'

  return { results, progress }
}

// ==========================================
// Embedding Preparation
// ==========================================

/**
 * Prepare text chunks with their metadata for embedding generation.
 * Each chunk will become a row in the image_embedding table.
 */
export function prepareChunksForEmbedding(
  result: FileProcessingResult,
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
): Array<{
  content: string
  chunkIndex: number
  startOffset: number
  endOffset: number
  chunkHash: string
}> {
  if (!result.extractedText || result.extractedText.length === 0) {
    return []
  }

  const chunks = chunkText(result.extractedText, config)

  return chunks.map((chunk, index) => {
    const startOffset = result.extractedText.indexOf(chunk)
    return {
      content: chunk,
      chunkIndex: index,
      startOffset: startOffset >= 0 ? startOffset : 0,
      endOffset: startOffset >= 0 ? startOffset + chunk.length : chunk.length,
      chunkHash: crypto.createHash('sha256').update(chunk).digest('hex').slice(0, 16),
    }
  })
}
