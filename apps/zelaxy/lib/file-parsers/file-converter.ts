/**
 * File Converter — Converts DWG, STEP, DXF, and other CAD/engineering files to PDF or images
 *
 * Conversion strategies (tried in order):
 * - DWG/DXF: Use ODA File Converter → DXF → parse text, or LibreOffice, or ImageMagick
 * - STEP/STP/IGES: Use FreeCAD headless rendering, or LibreOffice, or ImageMagick
 * - Images (HEIC/TIFF/BMP): Convert to PNG using sharp
 * - PDF: Pass through (already supported)
 *
 * For text extraction: parse DXF entities or use AI Vision fallback
 */

import { exec } from 'child_process'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { createLogger } from '@/lib/logs/console/logger'

const execAsync = promisify(exec)
const logger = createLogger('FileConverter')

export interface ConversionResult {
  /** Converted file buffer */
  buffer: Buffer
  /** MIME type of the converted file */
  mimeType: string
  /** Method used for conversion */
  method: string
  /** Original filename */
  originalFilename: string
}

/**
 * Convert a file to PDF format for reading/text extraction.
 * Supports: DWG, DXF, STEP, STP, IGES, images, and other document formats.
 *
 * Conversion strategies:
 * - DWG/DXF: Use LibreOffice or ODA File Converter → PDF
 * - STEP/STP/IGES: Use FreeCAD or LibreOffice → PDF
 * - Images: Use ImageMagick (convert) or LibreOffice → PDF
 * - Already PDF: Pass through
 *
 * @param buffer - Raw file buffer
 * @param filename - Original filename (used for extension detection)
 * @param mimeType - MIME type of the file
 * @returns Converted PDF buffer and metadata
 */
export async function convertToPdf(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ConversionResult> {
  const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || '' : ''

  logger.info(`Converting file to PDF: ${filename} (${ext}, ${mimeType}, ${buffer.length} bytes)`)

  // Already a PDF — pass through
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return {
      buffer,
      mimeType: 'application/pdf',
      method: 'passthrough',
      originalFilename: filename,
    }
  }

  // DWG/DXF → convert to PDF using LibreOffice, ODA, or ImageMagick
  if (['dwg', 'dxf'].includes(ext)) {
    return convertCadFileToPdf(buffer, filename, ext)
  }

  // STEP/STP/IGES → convert to PDF using FreeCAD or LibreOffice
  if (['step', 'stp', 'iges', 'igs'].includes(ext)) {
    return convertStepFileToPdf(buffer, filename, ext)
  }

  // Image files → convert to PDF using ImageMagick or LibreOffice
  if (
    ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'svg', 'heic', 'heif'].includes(ext)
  ) {
    return convertImageToPdf(buffer, filename, ext)
  }

  // Office documents → convert to PDF using LibreOffice
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf'].includes(ext)) {
    return convertWithLibreOffice(buffer, filename, ext)
  }

  // Unknown format — try LibreOffice as last resort
  try {
    return await convertWithLibreOffice(buffer, filename, ext)
  } catch {
    logger.warn(`Cannot convert ${filename} (${ext}) to PDF — returning original`)
    return {
      buffer,
      mimeType,
      method: 'unsupported',
      originalFilename: filename,
    }
  }
}

/**
 * Convert a file to an image format suitable for OCR processing.
 * Supports: DWG, DXF, STEP, STP, IGES, HEIC, TIFF, BMP, and other image formats.
 */
export async function convertToImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ConversionResult> {
  const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || '' : ''

  logger.info(`Converting file for OCR: ${filename} (${ext}, ${mimeType}, ${buffer.length} bytes)`)

  // Already a compatible image format — pass through
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return {
      buffer,
      mimeType,
      method: 'passthrough',
      originalFilename: filename,
    }
  }

  // SVG, BMP, TIFF, HEIC → convert to PNG using ImageMagick
  if (['svg', 'bmp', 'tiff', 'tif', 'heic', 'heif', 'ico'].includes(ext)) {
    return convertImageToImage(buffer, filename, ext)
  }

  // DWG/DXF → convert to PNG using ImageMagick or ODA
  if (['dwg', 'dxf'].includes(ext)) {
    return convertCadToImage(buffer, filename, ext)
  }

  // STEP/STP/IGES → convert to PNG using FreeCAD or ImageMagick
  if (['step', 'stp', 'iges', 'igs'].includes(ext)) {
    return convertStepToImage(buffer, filename, ext)
  }

  // PDF → convert first page to image using ImageMagick
  if (ext === 'pdf') {
    return convertPdfToImage(buffer, filename)
  }

  // Unknown format — return as-is
  logger.warn(`Cannot convert ${filename} (${ext}) to image — returning original`)
  return {
    buffer,
    mimeType,
    method: 'unsupported',
    originalFilename: filename,
  }
}

// ==========================================
// LibreOffice Conversion (universal)
// ==========================================

async function findLibreOfficePath(): Promise<string | null> {
  const paths = [
    // macOS
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    // Linux
    '/usr/bin/soffice',
    '/usr/bin/libreoffice',
    '/usr/local/bin/soffice',
    // Snap
    '/snap/bin/libreoffice',
  ]

  for (const p of paths) {
    try {
      await fs.access(p)
      return p
    } catch {}
  }

  // Try PATH
  try {
    const { stdout } = await execAsync('which soffice 2>/dev/null || which libreoffice 2>/dev/null')
    return stdout.trim() || null
  } catch {
    return null
  }
}

async function convertWithLibreOffice(
  buffer: Buffer,
  filename: string,
  ext: string
): Promise<ConversionResult> {
  const soffice = await findLibreOfficePath()
  if (!soffice) {
    throw new Error('LibreOffice not found. Install LibreOffice for document conversion.')
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-lo-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    await fs.writeFile(inputPath, buffer)

    // Use LibreOffice headless to convert to PDF
    const cmd = `"${soffice}" --headless --convert-to pdf --outdir "${tmpDir}" "${inputPath}"`
    await execAsync(cmd, { timeout: 120000 })

    // Find the output PDF
    const baseName = path.basename(filename, `.${ext}`)
    const pdfPath = path.join(tmpDir, `${baseName}.pdf`)

    try {
      const pdfBuffer = await fs.readFile(pdfPath)
      logger.info(`Converted ${filename} to PDF via LibreOffice (${pdfBuffer.length} bytes)`)
      return {
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        method: 'libreoffice',
        originalFilename: filename,
      }
    } catch {
      // Look for any PDF in output dir
      const files = await fs.readdir(tmpDir)
      const pdfFile = files.find((f) => f.endsWith('.pdf'))
      if (pdfFile) {
        const pdfBuffer = await fs.readFile(path.join(tmpDir, pdfFile))
        return {
          buffer: pdfBuffer,
          mimeType: 'application/pdf',
          method: 'libreoffice',
          originalFilename: filename,
        }
      }
      throw new Error('LibreOffice conversion produced no PDF output')
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ==========================================
// CAD File (DWG/DXF) → PDF
// ==========================================

async function convertCadFileToPdf(
  buffer: Buffer,
  filename: string,
  ext: string
): Promise<ConversionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-cad-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    await fs.writeFile(inputPath, buffer)

    // Strategy 1: LibreOffice (LibreCAD integration)
    try {
      return await convertWithLibreOffice(buffer, filename, ext)
    } catch {
      logger.debug(`LibreOffice conversion failed for ${filename}`)
    }

    // Strategy 2: ODA File Converter → DXF → then use LibreOffice
    try {
      const odaPath = await findODAPath()
      if (odaPath && ext === 'dwg') {
        const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dwg2pdf-'))
        const cmd = `"${odaPath}" "${tmpDir}" "${outputDir}" ACAD2018 DXF 0 1 "${filename}"`
        await execAsync(cmd, { timeout: 60000 })

        const outputFiles = await fs.readdir(outputDir)
        const dxfFile = outputFiles.find((f) => f.toLowerCase().endsWith('.dxf'))
        if (dxfFile) {
          const dxfBuffer = await fs.readFile(path.join(outputDir, dxfFile))
          try {
            return await convertWithLibreOffice(dxfBuffer, dxfFile, 'dxf')
          } catch {
            // DXF to PDF via LibreOffice failed, but we have the DXF
          }
        }
        await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {})
      }
    } catch {
      logger.debug(`ODA conversion failed for ${filename}`)
    }

    // Strategy 3: ImageMagick convert → PDF
    try {
      const outputPath = path.join(tmpDir, 'output.pdf')
      await execAsync(`convert "${inputPath}" "${outputPath}"`, { timeout: 60000 })
      const pdfBuffer = await fs.readFile(outputPath)
      logger.info(`Converted ${filename} to PDF via ImageMagick`)
      return {
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        method: 'imagemagick',
        originalFilename: filename,
      }
    } catch {
      logger.debug(`ImageMagick conversion failed for ${filename}`)
    }

    // Strategy 4: Extract metadata as text-based PDF fallback
    const metaText = `CAD File: ${filename}\nFormat: ${ext.toUpperCase()}\nSize: ${buffer.length} bytes\nNote: Install LibreOffice, ODA File Converter, or ImageMagick to enable CAD file PDF conversion.\nThe raw file data is preserved — use a CAD viewer for full viewing.`
    return {
      buffer: Buffer.from(metaText, 'utf-8'),
      mimeType: 'text/plain',
      method: 'metadata-fallback',
      originalFilename: filename,
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ==========================================
// STEP/STP/IGES → PDF
// ==========================================

async function convertStepFileToPdf(
  buffer: Buffer,
  filename: string,
  ext: string
): Promise<ConversionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-step-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    const outputPath = path.join(tmpDir, 'output.pdf')
    await fs.writeFile(inputPath, buffer)

    // Strategy 1: FreeCAD headless → render to PDF
    try {
      const freecadPaths = [
        'freecadcmd',
        'FreeCADCmd',
        '/usr/bin/freecadcmd',
        '/usr/local/bin/freecadcmd',
      ]

      // FreeCAD render to PDF via PNG → ImageMagick
      const pngOutput = path.join(tmpDir, 'render.png')
      const freecadScript = `
import FreeCAD
import Part
doc = FreeCAD.newDocument()
Part.insert("${inputPath.replace(/"/g, '\\"')}", doc.Name)
doc.recompute()
import FreeCADGui
FreeCADGui.showMainWindow()
view = FreeCADGui.activeDocument().activeView()
view.fitAll()
view.saveImage("${pngOutput.replace(/"/g, '\\"')}", 2048, 2048, "Current")
FreeCAD.closeDocument(doc.Name)
`
      const scriptPath = path.join(tmpDir, 'render.py')
      await fs.writeFile(scriptPath, freecadScript)

      for (const freecadPath of freecadPaths) {
        try {
          await execAsync(`"${freecadPath}" "${scriptPath}"`, { timeout: 120000 })
          try {
            const pngBuffer = await fs.readFile(pngOutput)
            // Convert PNG to PDF via ImageMagick
            try {
              await execAsync(`convert "${pngOutput}" "${outputPath}"`, { timeout: 30000 })
              const pdfBuffer = await fs.readFile(outputPath)
              logger.info(`Converted ${filename} to PDF via FreeCAD + ImageMagick`)
              return {
                buffer: pdfBuffer,
                mimeType: 'application/pdf',
                method: 'freecad',
                originalFilename: filename,
              }
            } catch {
              // Return PNG if we can't convert to PDF
              logger.info(`Converted ${filename} to PNG via FreeCAD (PDF conversion failed)`)
              return {
                buffer: pngBuffer,
                mimeType: 'image/png',
                method: 'freecad-png',
                originalFilename: filename,
              }
            }
          } catch {
            // Output file doesn't exist
          }
        } catch {}
      }
    } catch {
      logger.debug(`FreeCAD conversion failed for ${filename}`)
    }

    // Strategy 2: LibreOffice (some STEP formats)
    try {
      return await convertWithLibreOffice(buffer, filename, ext)
    } catch {
      logger.debug(`LibreOffice conversion failed for STEP file ${filename}`)
    }

    // Strategy 3: ImageMagick (if file has embedded preview)
    try {
      await execAsync(`convert "${inputPath}[0]" "${outputPath}"`, { timeout: 30000 })
      const pdfBuffer = await fs.readFile(outputPath)
      logger.info(`Converted ${filename} to PDF via ImageMagick`)
      return {
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        method: 'imagemagick',
        originalFilename: filename,
      }
    } catch {
      logger.debug(`ImageMagick conversion failed for ${filename}`)
    }

    // Strategy 4: Extract STEP metadata as text
    const stepContent = extractStepMetadata(buffer, filename)
    return {
      buffer: Buffer.from(stepContent, 'utf-8'),
      mimeType: 'text/plain',
      method: 'metadata-extraction',
      originalFilename: filename,
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ==========================================
// Image → PDF
// ==========================================

async function convertImageToPdf(
  buffer: Buffer,
  filename: string,
  ext: string
): Promise<ConversionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-img-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    const outputPath = path.join(tmpDir, 'output.pdf')
    await fs.writeFile(inputPath, buffer)

    // Strategy 1: ImageMagick
    try {
      await execAsync(`convert "${inputPath}" "${outputPath}"`, { timeout: 30000 })
      const pdfBuffer = await fs.readFile(outputPath)
      logger.info(`Converted ${filename} to PDF via ImageMagick`)
      return {
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        method: 'imagemagick',
        originalFilename: filename,
      }
    } catch {
      logger.debug(`ImageMagick conversion failed for ${filename}`)
    }

    // Strategy 2: LibreOffice
    try {
      return await convertWithLibreOffice(buffer, filename, ext)
    } catch {
      logger.debug(`LibreOffice conversion failed for ${filename}`)
    }

    // Return original if conversion fails
    return {
      buffer,
      mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      method: 'passthrough',
      originalFilename: filename,
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ==========================================
// CAD → Image (for OCR fallback)
// ==========================================

async function convertCadToImage(
  buffer: Buffer,
  filename: string,
  ext: string
): Promise<ConversionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-cad-img-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    const outputPath = path.join(tmpDir, 'output.png')
    await fs.writeFile(inputPath, buffer)

    // Strategy 1: ImageMagick
    try {
      await execAsync(`convert "${inputPath}[0]" -resize 2048x2048 "${outputPath}"`, {
        timeout: 30000,
      })
      const pngBuffer = await fs.readFile(outputPath)
      logger.info(`Converted ${filename} to PNG via ImageMagick`)
      return {
        buffer: pngBuffer,
        mimeType: 'image/png',
        method: 'imagemagick',
        originalFilename: filename,
      }
    } catch {
      logger.debug(`ImageMagick conversion failed for ${filename}`)
    }

    // Strategy 2: Metadata text fallback
    const metaText = `CAD File: ${filename}\nFormat: ${ext.toUpperCase()}\nSize: ${buffer.length} bytes\nNote: Install ImageMagick or ODA File Converter to enable CAD file image conversion for OCR.`
    return {
      buffer: Buffer.from(metaText, 'utf-8'),
      mimeType: 'text/plain',
      method: 'metadata-fallback',
      originalFilename: filename,
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function convertStepToImage(
  buffer: Buffer,
  filename: string,
  ext: string
): Promise<ConversionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-step-img-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    const outputPath = path.join(tmpDir, 'output.png')
    await fs.writeFile(inputPath, buffer)

    // Strategy 1: FreeCAD headless
    try {
      const freecadPaths = [
        'freecadcmd',
        'FreeCADCmd',
        '/usr/bin/freecadcmd',
        '/usr/local/bin/freecadcmd',
      ]

      const freecadScript = `
import FreeCAD
import Part
doc = FreeCAD.newDocument()
Part.insert("${inputPath.replace(/"/g, '\\"')}", doc.Name)
doc.recompute()
import FreeCADGui
FreeCADGui.showMainWindow()
view = FreeCADGui.activeDocument().activeView()
view.fitAll()
view.saveImage("${outputPath.replace(/"/g, '\\"')}", 2048, 2048, "Current")
FreeCAD.closeDocument(doc.Name)
`
      const scriptPath = path.join(tmpDir, 'render.py')
      await fs.writeFile(scriptPath, freecadScript)

      for (const freecadPath of freecadPaths) {
        try {
          await execAsync(`"${freecadPath}" "${scriptPath}"`, { timeout: 120000 })
          try {
            const pngBuffer = await fs.readFile(outputPath)
            logger.info(`Converted ${filename} to PNG via FreeCAD`)
            return {
              buffer: pngBuffer,
              mimeType: 'image/png',
              method: 'freecad',
              originalFilename: filename,
            }
          } catch {
            // Output doesn't exist
          }
        } catch {}
      }
    } catch {
      logger.debug(`FreeCAD conversion failed for ${filename}`)
    }

    // Strategy 2: ImageMagick (some STEP files have embedded thumbnails)
    try {
      await execAsync(`convert "${inputPath}[0]" -resize 2048x2048 "${outputPath}"`, {
        timeout: 30000,
      })
      const pngBuffer = await fs.readFile(outputPath)
      return {
        buffer: pngBuffer,
        mimeType: 'image/png',
        method: 'imagemagick',
        originalFilename: filename,
      }
    } catch {
      logger.debug(`ImageMagick conversion failed for ${filename}`)
    }

    // Strategy 3: Metadata text fallback
    const stepContent = extractStepMetadata(buffer, filename)
    return {
      buffer: Buffer.from(stepContent, 'utf-8'),
      mimeType: 'text/plain',
      method: 'metadata-extraction',
      originalFilename: filename,
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function convertImageToImage(
  buffer: Buffer,
  filename: string,
  ext: string
): Promise<ConversionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-imgconv-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    const outputPath = path.join(tmpDir, 'output.png')
    await fs.writeFile(inputPath, buffer)

    // Try ImageMagick
    try {
      await execAsync(`convert "${inputPath}" -resize 2048x2048 "${outputPath}"`, {
        timeout: 30000,
      })
      const pngBuffer = await fs.readFile(outputPath)
      return {
        buffer: pngBuffer,
        mimeType: 'image/png',
        method: 'imagemagick',
        originalFilename: filename,
      }
    } catch {
      // Return original if conversion fails
      return {
        buffer,
        mimeType: `image/${ext}`,
        method: 'passthrough',
        originalFilename: filename,
      }
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function convertPdfToImage(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zelaxy-pdf2img-'))

  try {
    const inputPath = path.join(tmpDir, filename)
    const outputPath = path.join(tmpDir, 'output.png')
    await fs.writeFile(inputPath, buffer)

    try {
      await execAsync(`convert -density 300 "${inputPath}[0]" -resize 2048x2048 "${outputPath}"`, {
        timeout: 30000,
      })
      const pngBuffer = await fs.readFile(outputPath)
      return {
        buffer: pngBuffer,
        mimeType: 'image/png',
        method: 'imagemagick',
        originalFilename: filename,
      }
    } catch {
      return {
        buffer,
        mimeType: 'application/pdf',
        method: 'passthrough',
        originalFilename: filename,
      }
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ==========================================
// Helper Functions
// ==========================================

async function findODAPath(): Promise<string | null> {
  const paths = [
    '/usr/bin/ODAFileConverter',
    '/usr/local/bin/ODAFileConverter',
    '/opt/ODAFileConverter/ODAFileConverter',
    path.join(os.homedir(), 'ODAFileConverter', 'ODAFileConverter'),
  ]

  if (process.platform === 'darwin') {
    paths.push('/Applications/ODAFileConverter.app/Contents/MacOS/ODAFileConverter')
  }
  if (process.platform === 'win32') {
    paths.push('C:\\Program Files\\ODA\\ODAFileConverter\\ODAFileConverter.exe')
  }

  for (const p of paths) {
    try {
      await fs.access(p)
      return p
    } catch {}
  }

  try {
    const { stdout } = await execAsync(
      'which ODAFileConverter 2>/dev/null || where ODAFileConverter 2>NUL'
    )
    return stdout.trim() || null
  } catch {
    return null
  }
}

/**
 * Extract metadata from STEP files as text.
 * STEP files are ASCII-based and contain readable header information.
 */
function extractStepMetadata(buffer: Buffer, filename: string): string {
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000))
  const lines: string[] = [`STEP/STP File: ${filename}`, `Size: ${buffer.length} bytes`, '']

  // Extract HEADER section
  const headerMatch = content.match(/HEADER;([\s\S]*?)ENDSEC;/i)
  if (headerMatch) {
    lines.push('=== HEADER ===')

    // Extract FILE_DESCRIPTION
    const descMatch = headerMatch[1].match(/FILE_DESCRIPTION\s*\(\s*\(([^)]*)\)/i)
    if (descMatch) {
      lines.push(`Description: ${descMatch[1].replace(/'/g, '').trim()}`)
    }

    // Extract FILE_NAME
    const nameMatch = headerMatch[1].match(/FILE_NAME\s*\(\s*'([^']*)'/i)
    if (nameMatch) {
      lines.push(`File Name: ${nameMatch[1]}`)
    }

    // Extract author
    const authorMatch = headerMatch[1].match(
      /FILE_NAME\s*\([^,]*,\s*'([^']*)'\s*,\s*\(\s*'([^']*)'/i
    )
    if (authorMatch) {
      lines.push(`Date: ${authorMatch[1]}`)
      lines.push(`Author: ${authorMatch[2]}`)
    }

    // Extract FILE_SCHEMA
    const schemaMatch = headerMatch[1].match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']*)'/i)
    if (schemaMatch) {
      lines.push(`Schema: ${schemaMatch[1]}`)
    }
  }

  // Count entities in DATA section
  const dataMatch = content.match(/DATA;([\s\S]*?)ENDSEC;/i)
  if (dataMatch) {
    const entityMatches = dataMatch[1].match(/#\d+\s*=/g)
    if (entityMatches) {
      lines.push(`\nEntities: ${entityMatches.length}`)
    }

    // Extract unique entity types
    const typeMatches = dataMatch[1].match(/=\s*([A-Z_]+)\s*\(/g)
    if (typeMatches) {
      const types = new Set(typeMatches.map((m) => m.replace(/[=\s(]/g, '')))
      lines.push(`Entity Types: ${Array.from(types).slice(0, 30).join(', ')}`)
    }
  }

  // Extract any product/part names
  const productMatches = content.match(/PRODUCT\s*\([^,]*,\s*'([^']*)'/gi)
  if (productMatches && productMatches.length > 0) {
    lines.push('\n=== PRODUCTS ===')
    const products = new Set<string>()
    for (const match of productMatches) {
      const nameMatch = match.match(/'([^']*)'/)?.[1]
      if (nameMatch) products.add(nameMatch)
    }
    products.forEach((p) => lines.push(`  - ${p}`))
  }

  return lines.join('\n')
}

/**
 * Check if a file extension is a CAD/engineering format that we can convert
 */
export function isConvertibleFormat(extension: string): boolean {
  const convertible = [
    'dwg',
    'dxf',
    'step',
    'stp',
    'iges',
    'igs',
    'heic',
    'heif',
    'tiff',
    'tif',
    'bmp',
    'svg',
    'doc',
    'docx',
    'ppt',
    'pptx',
    'odt',
    'ods',
    'odp',
    'rtf',
  ]
  return convertible.includes(extension.toLowerCase())
}

/**
 * Get the MIME type for CAD/engineering file extensions
 */
export function getCadMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    dwg: 'application/acad',
    dxf: 'application/dxf',
    step: 'application/step',
    stp: 'application/step',
    iges: 'application/iges',
    igs: 'application/iges',
  }
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}
