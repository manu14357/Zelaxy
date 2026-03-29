/**
 * DWG/DXF File Processor
 *
 * Handles text extraction and metadata parsing from DWG and DXF CAD files.
 * Supports three extraction strategies:
 *   1. ODA File Converter — convert DWG→DXF, parse DXF entities (free, local)
 *   2. Autodesk Platform Services (APS/Forge) — cloud API extraction
 *   3. AI Vision — convert DWG→PNG thumbnail, use GPT-4o/Claude to extract text
 *
 * Falls back through strategies automatically when set to 'auto'.
 */

import { exec } from 'child_process'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import type {
  BlockInfo,
  CoordinateInfo,
  DimensionInfo,
  ExtractedTextResult,
  ExtractionMethod,
  LayerInfo,
  SpatialData,
  TextEntity,
} from './types'

const execAsync = promisify(exec)

// ==========================================
// DXF Parser (works on DXF files or ODA-converted DXF)
// ==========================================

interface DXFEntity {
  type: string
  layer?: string
  text?: string
  position?: { x: number; y: number; z?: number }
  insertionPoint?: { x: number; y: number; z?: number }
  startPoint?: { x: number; y: number; z?: number }
  endPoint?: { x: number; y: number; z?: number }
  rotation?: number
  height?: number
  style?: string
  attributes?: Record<string, string>
  value?: number
  dimensionType?: string
  name?: string
  visible?: boolean
  frozen?: boolean
  color?: string
  lineType?: string
}

/**
 * Parse a DXF file and extract text entities, layers, blocks, dimensions, coordinates
 */
export async function parseDXFFile(filePath: string): Promise<{
  textResult: ExtractedTextResult
  spatialData: SpatialData
}> {
  const content = await fs.readFile(filePath, 'utf-8')
  return parseDXFContent(content)
}

export function parseDXFContent(content: string): {
  textResult: ExtractedTextResult
  spatialData: SpatialData
} {
  const lines = content.split('\n').map((l) => l.trim())
  const entities: DXFEntity[] = []
  const layers: Map<string, LayerInfo> = new Map()
  const blocks: BlockInfo[] = []
  const dimensions: DimensionInfo[] = []
  const coordinates: CoordinateInfo[] = []
  const textEntities: TextEntity[] = []

  let i = 0

  // Parse TABLES section for layers
  while (i < lines.length) {
    if (lines[i] === 'LAYER' && lines[i - 1] === '0') {
      const layer = parseLayerEntity(lines, i)
      if (layer) {
        layers.set(layer.name, layer)
      }
    }
    i++
  }

  // Reset and parse ENTITIES section
  i = 0
  let inEntities = false
  while (i < lines.length) {
    if (lines[i] === 'ENTITIES') {
      inEntities = true
      i++
      continue
    }
    if (lines[i] === 'ENDSEC' && inEntities) break

    if (inEntities && lines[i] === '0') {
      const entityType = lines[i + 1]
      if (entityType) {
        const entity = parseEntity(lines, i + 1, entityType)
        if (entity) {
          entities.push(entity)
          // Track layer entity counts
          if (entity.layer && layers.has(entity.layer)) {
            const l = layers.get(entity.layer)!
            l.entityCount++
          }
        }
      }
    }
    i++
  }

  // Extract text entities
  for (const entity of entities) {
    if ((entity.type === 'TEXT' || entity.type === 'MTEXT') && entity.text) {
      textEntities.push({
        text: cleanDXFText(entity.text),
        type: entity.type.toLowerCase() as 'text' | 'mtext',
        position: entity.position || entity.insertionPoint,
        layer: entity.layer,
        style: entity.style,
      })
    }

    if (entity.type === 'ATTRIB' && entity.text) {
      textEntities.push({
        text: cleanDXFText(entity.text),
        type: 'attribute',
        position: entity.position,
        layer: entity.layer,
      })
    }

    if (entity.type === 'DIMENSION') {
      const dim: DimensionInfo = {
        type: mapDimensionType(entity.dimensionType),
        value: entity.value || 0,
        text: entity.text ? cleanDXFText(entity.text) : undefined,
        position: entity.position,
        layer: entity.layer,
      }
      dimensions.push(dim)

      if (entity.text) {
        textEntities.push({
          text: cleanDXFText(entity.text),
          type: 'dimension',
          position: entity.position,
          layer: entity.layer,
        })
      }
    }

    if (entity.type === 'INSERT') {
      blocks.push({
        name: entity.name || 'unknown',
        insertionPoint: entity.insertionPoint,
        rotation: entity.rotation,
        attributes: entity.attributes || {},
        layer: entity.layer,
      })
    }

    // Track coordinates from geometric entities
    if (entity.startPoint) {
      coordinates.push({
        x: entity.startPoint.x,
        y: entity.startPoint.y,
        z: entity.startPoint.z,
        entityType: entity.type,
        layer: entity.layer,
      })
    }
    if (entity.endPoint) {
      coordinates.push({
        x: entity.endPoint.x,
        y: entity.endPoint.y,
        z: entity.endPoint.z,
        entityType: entity.type,
        layer: entity.layer,
      })
    }
  }

  // Compute bounding box
  const allCoords = coordinates.length > 0 ? coordinates : []
  const boundingBox =
    allCoords.length > 0
      ? {
          minX: Math.min(...allCoords.map((c) => c.x)),
          minY: Math.min(...allCoords.map((c) => c.y)),
          maxX: Math.max(...allCoords.map((c) => c.x)),
          maxY: Math.max(...allCoords.map((c) => c.y)),
        }
      : undefined

  const combinedText = textEntities.map((e) => e.text).join('\n')

  return {
    textResult: {
      text: combinedText,
      method: 'oda', // Will be overridden by caller if needed
      confidence: 0.85,
      entities: textEntities,
    },
    spatialData: {
      layers: Array.from(layers.values()),
      blocks,
      dimensions,
      coordinates: coordinates.slice(0, 10000), // Cap at 10K coords
      boundingBox,
    },
  }
}

// ==========================================
// ODA File Converter Strategy
// ==========================================

/**
 * Check if ODA File Converter is installed
 */
export async function isODAAvailable(): Promise<boolean> {
  try {
    // Check common ODA installation paths
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
        return true
      } catch {}
    }

    // Try PATH
    await execAsync('which ODAFileConverter 2>/dev/null || where ODAFileConverter 2>NUL')
    return true
  } catch {
    return false
  }
}

/**
 * Find ODA File Converter binary path
 */
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
    return stdout.trim()
  } catch {
    return null
  }
}

/**
 * Convert DWG file to DXF using ODA File Converter
 */
export async function convertDWGtoDXF(dwgFilePath: string): Promise<string> {
  const odaPath = await findODAPath()
  if (!odaPath) {
    throw new Error(
      'ODA File Converter not found. Install from https://www.opendesign.com/guestfiles/oda_file_converter'
    )
  }

  const inputDir = path.dirname(dwgFilePath)
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dwg2dxf-'))
  const filename = path.basename(dwgFilePath)

  // ODA File Converter CLI: ODAFileConverter <inputFolder> <outputFolder> <outputVersion> <outputType>
  // ACAD2018 = AutoCAD 2018 format, DXF = DXF output, 0 = recurse subfolders, 1 = audit
  const cmd = `"${odaPath}" "${inputDir}" "${outputDir}" ACAD2018 DXF 0 1 "${filename}"`

  try {
    await execAsync(cmd, { timeout: 60000 })

    // Find the output DXF file
    const outputFiles = await fs.readdir(outputDir)
    const dxfFile = outputFiles.find((f) => f.toLowerCase().endsWith('.dxf'))

    if (!dxfFile) {
      throw new Error(`ODA conversion produced no DXF output for ${filename}`)
    }

    return path.join(outputDir, dxfFile)
  } catch (error) {
    throw new Error(
      `ODA conversion failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Convert DWG to PNG thumbnail using ODA (if supported) or ImageMagick/Ghostscript
 */
export async function convertDWGtoThumbnail(dwgFilePath: string): Promise<string | null> {
  try {
    // First try converting to DXF, then we can generate a simple SVG representation
    // For production, you'd use LibreCAD or ODA's rendering capabilities
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dwg-thumb-'))
    const thumbnailPath = path.join(tmpDir, 'thumbnail.png')

    // Try using ImageMagick if available (can handle some DWG formats)
    try {
      await execAsync(`convert "${dwgFilePath}[0]" -resize 512x512 "${thumbnailPath}"`, {
        timeout: 30000,
      })
      return thumbnailPath
    } catch {
      // ImageMagick not available or can't handle this file
    }

    return null
  } catch {
    return null
  }
}

// ==========================================
// Autodesk Platform Services (APS) Strategy
// ==========================================

export interface APSConfig {
  clientId: string
  clientSecret: string
}

/**
 * Extract text and metadata from DWG using Autodesk Platform Services
 */
export async function extractWithAPS(
  fileBuffer: Buffer,
  filename: string,
  config: APSConfig
): Promise<{
  textResult: ExtractedTextResult
  spatialData: SpatialData
  thumbnailUrl: string | null
}> {
  // Step 1: Get access token
  const tokenResponse = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
      scope: 'data:read data:write bucket:create bucket:read',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error(`APS auth failed: ${tokenResponse.statusText}`)
  }

  const { access_token } = (await tokenResponse.json()) as { access_token: string }

  // Step 2: Create a transient bucket
  const bucketKey = `imgsearch-${Date.now()}`
  await fetch('https://developer.api.autodesk.com/oss/v2/buckets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketKey,
      policyKey: 'transient',
    }),
  })

  // Step 3: Upload file
  const objectKey = encodeURIComponent(filename)
  const uploadResponse = await fetch(
    `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectKey}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: new Blob([new Uint8Array(fileBuffer)]),
    }
  )

  if (!uploadResponse.ok) {
    throw new Error(`APS upload failed: ${uploadResponse.statusText}`)
  }

  const uploadResult = (await uploadResponse.json()) as { objectId: string }
  const urn = Buffer.from(uploadResult.objectId).toString('base64url')

  // Step 4: Start translation job
  await fetch('https://developer.api.autodesk.com/modelderivative/v2/designdata/job', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { urn },
      output: {
        formats: [{ type: 'svf2', views: ['2d', '3d'] }, { type: 'obj' }],
      },
    }),
  })

  // Step 5: Poll for translation completion
  let translationComplete = false
  let attempts = 0
  while (!translationComplete && attempts < 60) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const statusResponse = await fetch(
      `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    const manifest = (await statusResponse.json()) as { status: string }
    if (manifest.status === 'success') {
      translationComplete = true
    } else if (manifest.status === 'failed') {
      throw new Error('APS translation failed')
    }
    attempts++
  }

  if (!translationComplete) {
    throw new Error('APS translation timed out')
  }

  // Step 6: Extract properties (text, metadata)
  const propsResponse = await fetch(
    `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
  const propsData = (await propsResponse.json()) as {
    data?: { metadata?: Array<{ guid: string }> }
  }

  const textEntities: TextEntity[] = []
  const allLayers: LayerInfo[] = []

  // Extract properties from each viewable
  if (propsData.data?.metadata) {
    for (const viewable of propsData.data.metadata) {
      try {
        const detailResponse = await fetch(
          `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata/${viewable.guid}/properties`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        )
        const details = (await detailResponse.json()) as {
          data?: { collection?: Array<{ name: string; properties?: Record<string, any> }> }
        }

        if (details.data?.collection) {
          for (const item of details.data.collection) {
            if (item.name) {
              textEntities.push({
                text: item.name,
                type: 'label',
                layer: item.properties?.Layer?.toString(),
              })
            }
            // Extract text properties
            if (item.properties) {
              for (const [key, value] of Object.entries(item.properties)) {
                if (typeof value === 'string' && value.length > 0 && value.length < 1000) {
                  textEntities.push({
                    text: `${key}: ${value}`,
                    type: 'annotation',
                  })
                }
              }
            }
          }
        }
      } catch {
        // Skip failed property extraction
      }
    }
  }

  // Step 7: Get thumbnail
  let thumbnailUrl: string | null = null
  try {
    const thumbResponse = await fetch(
      `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/thumbnail`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (thumbResponse.ok) {
      // In production, save this to S3/Azure and return the URL
      thumbnailUrl = `data:image/png;base64,${Buffer.from(await thumbResponse.arrayBuffer()).toString('base64')}`
    }
  } catch {
    // Thumbnail not available
  }

  const combinedText = textEntities.map((e) => e.text).join('\n')

  return {
    textResult: {
      text: combinedText,
      method: 'autodesk_aps',
      confidence: 0.95,
      entities: textEntities,
    },
    spatialData: {
      layers: allLayers,
      blocks: [],
      dimensions: [],
      coordinates: [],
    },
    thumbnailUrl,
  }
}

// ==========================================
// AI Vision Strategy
// ==========================================

/**
 * Extract text from a DWG/image file using AI Vision (GPT-4o or Claude)
 */
export async function extractWithAIVision(
  imageUrl: string,
  apiKey: string,
  model = 'gpt-4o'
): Promise<ExtractedTextResult> {
  const prompt = `You are analyzing an engineering drawing / CAD file / technical image. 
Extract ALL visible text from this image, including:
- Title block information (drawing title, number, date, author, revision)
- Dimension values and units
- Labels, annotations, notes
- Part numbers, material specifications
- Layer names visible in the drawing
- Any other text content

Format your response as a structured list with categories:
TITLE_BLOCK: [text]
DIMENSIONS: [list of dimension values]
LABELS: [list of labels]
NOTES: [notes text]
PART_NUMBERS: [list]
OTHER_TEXT: [any remaining text]

Be thorough - extract every piece of text you can see.`

  if (model.startsWith('claude')) {
    // Anthropic Claude Vision
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
              {
                type: 'image',
                source: { type: 'url', url: imageUrl },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude Vision API failed: ${response.statusText}`)
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
      confidence: 0.75,
      entities: parseAIVisionOutput(text),
    }
  }
  // OpenAI GPT-4o Vision
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
    throw new Error(`GPT-4o Vision API failed: ${response.statusText}`)
  }

  const result = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  const text = result.choices[0]?.message?.content || ''

  return {
    text,
    method: 'ai_vision',
    confidence: 0.75,
    entities: parseAIVisionOutput(text),
  }
}

// ==========================================
// Main Processing Entry Point
// ==========================================

export interface DWGProcessingOptions {
  method: ExtractionMethod
  apiKey?: string // For AI Vision
  visionModel?: string
  apsConfig?: APSConfig
}

/**
 * Process a DWG file using the specified or auto-detected method
 */
export async function processDWGFile(
  filePath: string,
  options: DWGProcessingOptions
): Promise<{
  textResult: ExtractedTextResult
  spatialData: SpatialData
  thumbnailUrl: string | null
}> {
  const ext = path.extname(filePath).toLowerCase()
  let method = options.method

  // If auto, determine the best available method
  if (method === 'auto') {
    if (ext === '.dxf') {
      method = 'oda' // DXF can be parsed directly
    } else if (await isODAAvailable()) {
      method = 'oda'
    } else if (options.apsConfig?.clientId) {
      method = 'autodesk_aps'
    } else if (options.apiKey) {
      method = 'ai_vision'
    } else {
      throw new Error(
        'No DWG processing method available. Install ODA File Converter, configure Autodesk APS, or provide an AI API key.'
      )
    }
  }

  switch (method) {
    case 'oda': {
      let dxfPath: string
      if (ext === '.dxf') {
        dxfPath = filePath
      } else {
        dxfPath = await convertDWGtoDXF(filePath)
      }

      const { textResult, spatialData } = await parseDXFFile(dxfPath)
      textResult.method = 'oda'

      // Try to generate thumbnail
      const thumbnailUrl = await convertDWGtoThumbnail(filePath)

      // Clean up temp DXF if we created it
      if (ext !== '.dxf' && dxfPath !== filePath) {
        try {
          await fs.unlink(dxfPath)
          await fs.rmdir(path.dirname(dxfPath))
        } catch {
          // Cleanup is best-effort
        }
      }

      return { textResult, spatialData, thumbnailUrl }
    }

    case 'autodesk_aps': {
      if (!options.apsConfig) {
        throw new Error('Autodesk APS configuration required')
      }
      const fileBuffer = await fs.readFile(filePath)
      return extractWithAPS(fileBuffer, path.basename(filePath), options.apsConfig)
    }

    case 'ai_vision': {
      if (!options.apiKey) {
        throw new Error('API key required for AI Vision extraction')
      }

      // Convert to image first if DWG
      let imageUrl: string
      if (ext === '.dwg') {
        const thumbnailPath = await convertDWGtoThumbnail(filePath)
        if (thumbnailPath) {
          const imageBuffer = await fs.readFile(thumbnailPath)
          imageUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`
        } else {
          throw new Error('Cannot convert DWG to image for AI Vision processing')
        }
      } else {
        // DXF or image file — read as base64
        const fileBuffer = await fs.readFile(filePath)
        imageUrl = `data:image/png;base64,${fileBuffer.toString('base64')}`
      }

      const textResult = await extractWithAIVision(imageUrl, options.apiKey, options.visionModel)

      return {
        textResult,
        spatialData: {
          layers: [],
          blocks: [],
          dimensions: [],
          coordinates: [],
        },
        thumbnailUrl: null,
      }
    }

    default:
      throw new Error(`Unsupported extraction method: ${method}`)
  }
}

// ==========================================
// Helper Functions
// ==========================================

function parseLayerEntity(lines: string[], startIdx: number): LayerInfo | null {
  let name = ''
  let color = ''
  let lineType = ''
  let frozen = false
  let visible = true
  let i = startIdx + 1

  while (i < lines.length && !(lines[i] === '0' && i > startIdx + 1)) {
    const groupCode = Number.parseInt(lines[i], 10)
    const value = lines[i + 1]

    switch (groupCode) {
      case 2:
        name = value
        break
      case 62:
        color = value
        if (Number.parseInt(value, 10) < 0) visible = false
        break
      case 6:
        lineType = value
        break
      case 70: {
        const flags = Number.parseInt(value, 10)
        frozen = (flags & 1) !== 0
        break
      }
    }
    i += 2
  }

  if (!name) return null

  return { name, color, lineType, visible, frozen, entityCount: 0 }
}

function parseEntity(lines: string[], startIdx: number, entityType: string): DXFEntity | null {
  const entity: DXFEntity = { type: entityType }
  let i = startIdx + 1

  while (i < lines.length) {
    if (lines[i] === '0') break
    const groupCode = Number.parseInt(lines[i], 10)
    const value = lines[i + 1]

    if (Number.isNaN(groupCode) || value === undefined) {
      i += 2
      continue
    }

    switch (groupCode) {
      case 1:
        entity.text = value
        break
      case 2:
        entity.name = value
        break
      case 8:
        entity.layer = value
        break
      case 7:
        entity.style = value
        break
      case 10:
        entity.position = { ...entity.position, x: Number.parseFloat(value), y: 0 }
        entity.startPoint = { ...entity.startPoint, x: Number.parseFloat(value), y: 0 }
        break
      case 20:
        if (entity.position) entity.position.y = Number.parseFloat(value)
        if (entity.startPoint) entity.startPoint.y = Number.parseFloat(value)
        break
      case 30:
        if (entity.position) entity.position.z = Number.parseFloat(value)
        if (entity.startPoint) entity.startPoint.z = Number.parseFloat(value)
        break
      case 11:
        entity.endPoint = { x: Number.parseFloat(value), y: 0 }
        entity.insertionPoint = { x: Number.parseFloat(value), y: 0 }
        break
      case 21:
        if (entity.endPoint) entity.endPoint.y = Number.parseFloat(value)
        if (entity.insertionPoint) entity.insertionPoint.y = Number.parseFloat(value)
        break
      case 31:
        if (entity.endPoint) entity.endPoint.z = Number.parseFloat(value)
        if (entity.insertionPoint) entity.insertionPoint.z = Number.parseFloat(value)
        break
      case 40:
        entity.height = Number.parseFloat(value)
        break
      case 42:
        entity.value = Number.parseFloat(value) // For dimensions
        break
      case 50:
        entity.rotation = Number.parseFloat(value)
        break
    }

    i += 2
  }

  return entity
}

function cleanDXFText(text: string): string {
  // Remove DXF formatting codes: {\fArial|...;text} → text
  const cleaned = text
    .replace(/\\[Pp]/g, '\n') // Paragraph breaks
    .replace(/\\[Nn]/g, '\n') // Newlines
    .replace(/\{\\[^;]*;/g, '') // Font/style codes
    .replace(/\}/g, '')
    .replace(/\\U\+[0-9A-Fa-f]{4}/g, '') // Unicode escape
    .replace(/%%[dDpPcC]/g, '') // Special codes (degree, plus/minus, diameter)
    .replace(/\\/g, '') // Remaining backslashes
    .trim()

  return cleaned
}

function mapDimensionType(
  type?: string
): 'linear' | 'angular' | 'radial' | 'diameter' | 'ordinate' | 'aligned' {
  const t = Number.parseInt(type || '0', 10)
  switch (t & 0x07) {
    case 0:
      return 'linear'
    case 1:
      return 'aligned'
    case 2:
      return 'angular'
    case 3:
      return 'diameter'
    case 4:
      return 'radial'
    case 5:
      return 'ordinate'
    default:
      return 'linear'
  }
}

function parseAIVisionOutput(text: string): TextEntity[] {
  const entities: TextEntity[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Try to categorize based on prefixes
    let type: TextEntity['type'] = 'text'
    let content = trimmed

    if (trimmed.startsWith('TITLE_BLOCK:')) {
      type = 'title'
      content = trimmed.replace('TITLE_BLOCK:', '').trim()
    } else if (trimmed.startsWith('DIMENSIONS:')) {
      type = 'dimension'
      content = trimmed.replace('DIMENSIONS:', '').trim()
    } else if (trimmed.startsWith('LABELS:')) {
      type = 'label'
      content = trimmed.replace('LABELS:', '').trim()
    } else if (trimmed.startsWith('NOTES:')) {
      type = 'annotation'
      content = trimmed.replace('NOTES:', '').trim()
    } else if (trimmed.startsWith('PART_NUMBERS:')) {
      type = 'attribute'
      content = trimmed.replace('PART_NUMBERS:', '').trim()
    } else if (trimmed.startsWith('OTHER_TEXT:')) {
      type = 'text'
      content = trimmed.replace('OTHER_TEXT:', '').trim()
    }

    if (content.length > 0) {
      entities.push({ text: content, type })
    }
  }

  return entities
}
