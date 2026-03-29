/**
 * DWG file parser using @mlightcad/libredwg-web (WASM-based LibreDWG).
 *
 * Parses binary .dwg files and extracts all text-bearing entities
 * (TEXT, MTEXT, DIMENSION, ATTRIB, ATTDEF, TABLE), layer names,
 * block records, and header metadata — entirely in Node.js with no
 * external CLI tools required.
 *
 * Includes a raw binary text extraction fallback for DWG versions
 * where the WASM module cannot fully parse ATTRIB entities.
 */

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'
import type { FileParseResult, FileParser } from '@/lib/file-parsers/types'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('DwgParser')

// Singleton – the WASM module is heavy so we reuse the instance.
let libredwgInstance: any = null

/**
 * Walk up from process.cwd() to find the installed WASM directory.
 * `require.resolve` is transformed by Turbopack into a virtual `[project]/…`
 * path that doesn't exist on disk, so we probe the filesystem directly.
 */
function findWasmDir(): string {
  const wasmSubpath = path.join('node_modules', '@mlightcad', 'libredwg-web', 'wasm')
  let dir = process.cwd()

  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, wasmSubpath)
    if (existsSync(path.join(candidate, 'libredwg-web.wasm'))) {
      return `${candidate}/`
    }
    const parent = path.dirname(dir)
    if (parent === dir) break // filesystem root
    dir = parent
  }

  throw new Error('Could not find @mlightcad/libredwg-web WASM files in any ancestor node_modules')
}

/**
 * Lazily initialise the LibreDWG WASM module once.
 */
async function getLibreDwg() {
  if (libredwgInstance) return libredwgInstance

  try {
    const { LibreDwg } = await import('@mlightcad/libredwg-web')
    const wasmDir = findWasmDir()
    logger.info('LibreDWG WASM directory resolved to:', wasmDir)
    libredwgInstance = await LibreDwg.create(wasmDir)
    logger.info('LibreDWG WASM module initialised')
    return libredwgInstance
  } catch (err) {
    logger.error('Failed to initialise LibreDWG WASM module:', err)
    throw err
  }
}

// ─── helpers to strip MTEXT formatting codes ────────────────────────────

/**
 * Strip AutoCAD MTEXT formatting codes so we get plain text.
 * Common codes:  \A1;  \fArial|b0|i0|…;  \H1.5x;  \P (newline)  { } etc.
 */
function stripMtextFormatting(raw: string | undefined | null): string {
  if (!raw) return ''
  let t = raw
  // {\fArial|b0|i0|c0|p34;  ...}
  t = t.replace(/\{\\[^;]*;/g, '')
  // closing braces
  t = t.replace(/\}/g, '')
  // \A0;  \A1;  \A2;  (alignment)
  t = t.replace(/\\A\d;/g, '')
  // \H1.5x;  (text height)
  t = t.replace(/\\H[\d.]+x?;/g, '')
  // \W0.8;  (width factor)
  t = t.replace(/\\W[\d.]+;/g, '')
  // \Q15;  (oblique angle)
  t = t.replace(/\\Q[\d.]+;/g, '')
  // \T1.5;  (tracking)
  t = t.replace(/\\T[\d.]+;/g, '')
  // \f...; (font)
  t = t.replace(/\\f[^;]*;/g, '')
  // \C1; (color)
  t = t.replace(/\\C\d+;/g, '')
  // \L \l (underline on/off)  \O \o (overline)  \K \k (strikethrough)
  t = t.replace(/\\[LlOoKk]/g, '')
  // \S (stacked fraction) e.g. \S1/2;
  t = t.replace(/\\S[^;]*;/g, (match) => {
    const inner = match.slice(2, -1)
    return inner.replace(/[#^/]/g, '/')
  })
  // \P = newline
  t = t.replace(/\\P/gi, '\n')
  // \~ = non-breaking space
  t = t.replace(/\\~/g, ' ')
  // \\ = literal backslash
  t = t.replace(/\\\\/g, '\\')
  // remaining backslash-letter sequences
  t = t.replace(/\\[a-zA-Z][^;]*;/g, '')
  return t.trim()
}

// ─── entity text extraction ─────────────────────────────────────────────

interface ExtractedText {
  type: string
  layer: string
  text: string
  tag?: string
  blockName?: string
  measurement?: number
}

/**
 * Extract text from a single entity's text property.
 * Handles both DwgTextBase objects ({text: string}) and plain strings.
 */
function getEntityText(e: any): string {
  if (!e) return ''
  if (typeof e.text === 'string') return e.text
  if (typeof e.text === 'object' && e.text?.text) return String(e.text.text)
  // Some entities may have textString or value properties
  if (typeof e.textString === 'string') return e.textString
  if (typeof e.value === 'string') return e.value
  return ''
}

function extractTextsFromEntities(entities: any[]): ExtractedText[] {
  const results: ExtractedText[] = []

  for (const e of entities) {
    if (!e || !e.type) continue
    const layer = e.layer ?? ''
    // Normalize type for case-insensitive matching
    const entityType = String(e.type).toUpperCase()

    switch (entityType) {
      case 'TEXT': {
        const t = getEntityText(e)
        if (t) results.push({ type: 'TEXT', layer, text: t })
        break
      }
      case 'MTEXT': {
        const raw = getEntityText(e)
        const cleaned = stripMtextFormatting(raw)
        if (cleaned) results.push({ type: 'MTEXT', layer, text: cleaned })
        break
      }
      case 'DIMENSION': {
        const raw = getEntityText(e)
        const meas = e.measurement ?? e.actualMeasurement
        const displayText = raw && raw !== '<>' ? raw : meas != null ? String(meas) : ''
        if (displayText) {
          results.push({
            type: 'DIMENSION',
            layer,
            text: displayText,
            measurement: meas,
          })
        }
        break
      }
      case 'ATTRIB': {
        const t = getEntityText(e)
        if (t) {
          results.push({ type: 'ATTRIB', layer, text: t, tag: e.tag ?? e.attrTag })
        }
        break
      }
      case 'ATTDEF': {
        const t = getEntityText(e)
        if (t) {
          results.push({ type: 'ATTDEF', layer, text: t, tag: e.tag ?? e.attrTag })
        }
        break
      }
      case 'TABLE': {
        if (Array.isArray(e.cells)) {
          for (const cell of e.cells) {
            if (cell?.text) {
              results.push({ type: 'TABLE_CELL', layer, text: cell.text })
            }
          }
        }
        break
      }
      case 'INSERT': {
        const blockName = e.name ?? e.blockName ?? ''
        // INSERT blocks may contain nested ATTRIB entities
        if (Array.isArray(e.attribs) && e.attribs.length > 0) {
          for (const a of e.attribs) {
            const t = getEntityText(a)
            if (t) {
              results.push({
                type: 'ATTRIB',
                layer,
                text: t,
                tag: a.tag ?? a.attrTag,
                blockName,
              })
            }
          }
        }
        // Also check for 'attributes' property (some export formats use this)
        if (Array.isArray(e.attributes) && e.attributes.length > 0) {
          for (const a of e.attributes) {
            const t = getEntityText(a)
            if (t) {
              results.push({
                type: 'ATTRIB',
                layer,
                text: t,
                tag: a.tag ?? a.attrTag,
                blockName,
              })
            }
          }
        }
        break
      }
      default: {
        // Generic fallback: try to extract text from any entity with text-like properties
        const t = getEntityText(e)
        if (t && t.length > 1) {
          results.push({ type: entityType, layer, text: t })
        }
        break
      }
    }
  }

  return results
}

// ─── Low-level ATTRIB extraction via WASM dynapi ────────────────────────

const DWG_TYPE_ATTRIB = 2
const DWG_TYPE_ATTDEF = 3

/**
 * Decode a Dwg_Field_Value into a plain string.
 * The WASM module returns { success: boolean, data?: string, bin?: {0:n, 1:n, ...} }.
 * When the DWG codepage is non-UTF-8 (e.g. Shift-JIS for Japanese drawings),
 * `data` may be garbage but `bin` contains the raw bytes which we can decode
 * with the appropriate TextDecoder.
 */
function decodeFieldValue(fv: any): string {
  if (!fv || !fv.success) return ''

  // If `data` is a clean printable string, use it directly
  if (typeof fv.data === 'string' && fv.data.length > 0) {
    // Quick check: if it looks reasonable (mostly printable), return it
    const printable = fv.data.replace(/[^\x20-\x7e]/g, '')
    if (printable.length >= fv.data.length * 0.8) {
      return fv.data.trim()
    }
  }

  // Fall back to raw binary decoding if `bin` is present
  if (fv.bin && typeof fv.bin === 'object') {
    // Convert the bin object {0: byte, 1: byte, ...} to Uint8Array
    const keys = Object.keys(fv.bin).filter((k) => !Number.isNaN(Number(k)))
    if (keys.length > 0) {
      const bytes = new Uint8Array(keys.length)
      for (let i = 0; i < keys.length; i++) {
        bytes[i] = fv.bin[i] ?? 0
      }
      // Strip trailing nulls
      let end = bytes.length
      while (end > 0 && bytes[end - 1] === 0) end--
      if (end === 0) return ''
      const trimmedBytes = bytes.slice(0, end)

      // Try Shift-JIS first (common for Japanese DWGs), then fallback to UTF-8
      const decoders = ['shift_jis', 'utf-8', 'windows-1252']
      for (const encoding of decoders) {
        try {
          const decoded = new TextDecoder(encoding, { fatal: true }).decode(trimmedBytes)
          const clean = decoded.trim()
          if (clean.length > 0) return clean
        } catch {}
      }
    }
  }

  // Last resort: return data as-is if we have it
  if (typeof fv.data === 'string') return fv.data.trim()
  return ''
}

interface LowLevelAttrib {
  tag: string
  value: string
}

/**
 * Extract ATTRIB entities using the low-level WASM dynapi.
 *
 * The high-level `convert()` method calls `dwg_entity_insert_get_attribs()`
 * on INSERT entities, which returns empty for some DWG versions (e.g. R13/AC1012)
 * because the ATTRIB→INSERT pointer linkage is broken in those formats.
 *
 * However, the ATTRIBs DO exist as standalone entities in the DWG structure.
 * Using `dwg_getall_entity_by_type(ptr, DWG_TYPE_ATTRIB)` we can find them
 * directly and use `dwg_dynapi_entity_value()` to read their tag and text_value.
 */
function extractAttribsLowLevel(libredwg: any, dwgDataPtr: any): LowLevelAttrib[] {
  const attribs: LowLevelAttrib[] = []

  try {
    // Get all ATTRIB entities (type 2)
    const attribEntities = libredwg.dwg_getall_entity_by_type(dwgDataPtr, DWG_TYPE_ATTRIB)
    if (!attribEntities || !Array.isArray(attribEntities) || attribEntities.length === 0) {
      logger.info('No ATTRIB entities found via low-level API')
      return attribs
    }

    logger.info(`Found ${attribEntities.length} ATTRIB entities via low-level API`)

    for (const entityTio of attribEntities) {
      try {
        const tagFV = libredwg.dwg_dynapi_entity_value(entityTio, 'tag')
        const valueFV = libredwg.dwg_dynapi_entity_value(entityTio, 'text_value')

        const tag = decodeFieldValue(tagFV)
        const value = decodeFieldValue(valueFV)

        if (tag) {
          attribs.push({ tag, value })
        }
      } catch (entityErr) {}
    }
  } catch (err) {
    logger.warn('Low-level ATTRIB extraction failed:', err)
  }

  // Also try ATTDEF entities (type 3) for tag definitions with default values
  try {
    const attdefEntities = libredwg.dwg_getall_entity_by_type(dwgDataPtr, DWG_TYPE_ATTDEF)
    if (attdefEntities && Array.isArray(attdefEntities) && attdefEntities.length > 0) {
      logger.info(`Found ${attdefEntities.length} ATTDEF entities via low-level API`)

      for (const entityTio of attdefEntities) {
        try {
          const tagFV = libredwg.dwg_dynapi_entity_value(entityTio, 'tag')
          const valueFV = libredwg.dwg_dynapi_entity_value(entityTio, 'default_value')

          const tag = decodeFieldValue(tagFV)
          const value = decodeFieldValue(valueFV)

          if (tag && value) {
            // Only add ATTDEF values if we don't already have this tag from ATTRIB
            const existingTags = new Set(attribs.map((a) => a.tag))
            if (!existingTags.has(tag)) {
              attribs.push({ tag, value })
            }
          }
        } catch {}
      }
    }
  } catch {
    // ATTDEF extraction is optional
  }

  return attribs
}

/**
 * Deduplicate ATTRIBs by tag name.
 * When multiple ATTRIBs have the same tag, prefer the one with a non-empty value.
 * If all have equal values, keep only one.
 */
function deduplicateAttribs(attribs: LowLevelAttrib[]): LowLevelAttrib[] {
  const byTag = new Map<string, LowLevelAttrib[]>()
  for (const a of attribs) {
    const key = a.tag.toUpperCase()
    if (!byTag.has(key)) byTag.set(key, [])
    byTag.get(key)!.push(a)
  }

  const result: LowLevelAttrib[] = []
  for (const [, items] of byTag) {
    // Prefer entries with non-empty values
    const withValue = items.filter((a) => a.value.length > 0)
    if (withValue.length > 0) {
      // Deduplicate identical values
      const uniqueValues = new Map<string, LowLevelAttrib>()
      for (const a of withValue) {
        if (!uniqueValues.has(a.value)) {
          uniqueValues.set(a.value, a)
        }
      }
      result.push(...uniqueValues.values())
    } else {
      // All empty — keep one entry
      result.push(items[0])
    }
  }

  return result
}

// ─── main parse function ────────────────────────────────────────────────

async function parseDwgBuffer(buffer: Buffer): Promise<FileParseResult> {
  const libredwg = await getLibreDwg()

  // dwg_read_data accepts ArrayBuffer
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  const dwgDataPtr = libredwg.dwg_read_data(arrayBuffer, 0) // 0 = DWG file type
  if (dwgDataPtr == null) {
    logger.warn('dwg_read_data returned null — unable to parse DWG file')
    return {
      content:
        '=== DWG FILE CONTENT ===\n\n(Unable to parse this DWG file — the WASM module could not read the data.)\n',
      metadata: {
        format: 'DWG',
        parser: 'libredwg-web (WASM)',
        error: 'dwg_read_data returned null',
      },
    }
  }

  // IMPORTANT: Do NOT free dwgDataPtr yet — we may need it for low-level extraction
  let db: any = null
  try {
    db = libredwg.convert(dwgDataPtr)
  } catch (convertErr) {
    logger.error('LibreDWG convert() failed:', convertErr)
    // convert() failed but dwgDataPtr is valid — try low-level extraction directly
  }

  // ── gather metadata from convert() result ────────────────────────────
  const layers: string[] = []
  const blockNames: string[] = []
  const blockEntities: any[] = []
  const blockInsertNames: string[] = []
  let modelEntities: any[] = []
  let extracted: ExtractedText[] = []
  const typeCounts: Record<string, number> = {}

  if (db) {
    // Layers
    try {
      const layerEntries = db.tables?.LAYER?.entries ?? []
      for (const l of layerEntries) {
        if (l.name) layers.push(l.name)
      }
    } catch {
      /* ignore */
    }

    // Block records
    try {
      const blockEntries = db.tables?.BLOCK_RECORD?.entries ?? []
      for (const b of blockEntries) {
        if (b.name && !b.name.startsWith('*')) {
          blockNames.push(b.name)
        }
        if (Array.isArray(b.entities)) {
          blockEntities.push(...b.entities)
        }
      }
    } catch {
      /* ignore */
    }

    // Model-space entities
    modelEntities = db.entities ?? []
    for (const e of modelEntities) {
      if (e?.type === 'INSERT' && (e.name || e.blockName)) {
        blockInsertNames.push(e.name ?? e.blockName)
      }
      if (e?.type) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
    }

    // Extract text via high-level API
    const allEntities = [...modelEntities, ...blockEntities]
    extracted = extractTextsFromEntities(allEntities)
  }

  // ── check if we need low-level ATTRIB extraction ─────────────────────
  const hasInserts = (typeCounts.INSERT ?? 0) > 0
  const hasHighLevelAttribs = extracted.some((e) => e.type === 'ATTRIB')
  let lowLevelAttribs: LowLevelAttrib[] = []

  if (!hasHighLevelAttribs) {
    // High-level API missed ATTRIBs — use low-level dynapi
    logger.info(
      hasInserts
        ? `DWG has ${typeCounts.INSERT} INSERT entities but 0 ATTRIBs from convert() — using low-level extraction`
        : 'No ATTRIBs from convert() — trying low-level extraction'
    )
    lowLevelAttribs = extractAttribsLowLevel(libredwg, dwgDataPtr)
    lowLevelAttribs = deduplicateAttribs(lowLevelAttribs)
  }

  // NOW we can free the DWG data pointer
  try {
    libredwg.dwg_free(dwgDataPtr)
  } catch {
    /* non-critical */
  }

  // ── build structured output ──────────────────────────────────────────
  const sections: string[] = []

  sections.push('=== DWG FILE CONTENT ===\n')

  // Summary
  sections.push(`Total entities: ${modelEntities.length}`)
  sections.push(`Layers: ${layers.length > 0 ? layers.join(', ') : '(none)'}`)
  if (blockNames.length > 0) {
    sections.push(`Blocks: ${blockNames.join(', ')}`)
  }
  if (blockInsertNames.length > 0) {
    const uniqueInserts = [...new Set(blockInsertNames)]
    sections.push(`Block references: ${uniqueInserts.join(', ')}`)
  }

  // Entity breakdown
  const typeList = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, c]) => `${t}: ${c}`)
    .join(', ')
  if (typeList) sections.push(`Entity types: ${typeList}`)

  sections.push('')

  // ── Title block / attribute data ─────────────────────────────────────
  // First: high-level ATTRIBs from convert()
  const highLevelAttribs = extracted.filter((e) => e.type === 'ATTRIB' && e.tag)
  if (highLevelAttribs.length > 0) {
    sections.push('--- Title Block / Attributes ---\n')
    const byBlock: Record<string, ExtractedText[]> = {}
    for (const a of highLevelAttribs) {
      const key = a.blockName || '_default'
      if (!byBlock[key]) byBlock[key] = []
      byBlock[key].push(a)
    }
    for (const [block, items] of Object.entries(byBlock)) {
      if (block !== '_default') {
        sections.push(`[Block: ${block}]`)
      }
      for (const item of items) {
        sections.push(`  ${item.tag}: ${item.text}`)
      }
      sections.push('')
    }
  }

  // Second: low-level ATTRIBs (when high-level extraction missed them)
  if (lowLevelAttribs.length > 0) {
    sections.push('--- Title Block / Attributes ---\n')
    for (const a of lowLevelAttribs) {
      if (a.value) {
        sections.push(`  ${a.tag}: ${a.value}`)
      } else {
        sections.push(`  ${a.tag}: (empty)`)
      }
    }
    sections.push('')
  }

  // ── Text content (non-ATTRIB entities) ───────────────────────────────
  const nonAttribTexts = extracted.filter((e) => e.type !== 'ATTRIB' && e.type !== 'ATTDEF')
  const seenTexts = new Set<string>()
  const uniqueTexts = nonAttribTexts.filter((e) => {
    const key = `${e.type}:${e.text}:${e.layer}`
    if (seenTexts.has(key)) return false
    seenTexts.add(key)
    return true
  })

  if (uniqueTexts.length > 0) {
    sections.push('--- Text Content ---\n')
    const textByType: Record<string, ExtractedText[]> = {}
    for (const e of uniqueTexts) {
      if (!textByType[e.type]) textByType[e.type] = []
      textByType[e.type].push(e)
    }
    for (const [type, items] of Object.entries(textByType)) {
      sections.push(`[${type}]`)
      for (const item of items) {
        let line = `  • ${item.text}`
        if (item.measurement != null) line += ` (measurement: ${item.measurement})`
        if (item.layer) line += ` [layer: ${item.layer}]`
        sections.push(line)
      }
      sections.push('')
    }
  }

  // ── Dimension summary ────────────────────────────────────────────────
  const dims = extracted.filter((e) => e.type === 'DIMENSION')
  if (dims.length > 0) {
    sections.push('--- Dimensions ---')
    for (const d of dims) {
      sections.push(`  ${d.text}${d.measurement != null ? ` = ${d.measurement}` : ''}`)
    }
    sections.push('')
  }

  // No text at all
  const totalAttribs = highLevelAttribs.length + lowLevelAttribs.length
  if (extracted.length === 0 && lowLevelAttribs.length === 0) {
    sections.push('(No text entities found in this DWG file)')
    sections.push('')
  }

  const content = sections.join('\n')

  return {
    content,
    metadata: {
      format: 'DWG',
      layers,
      blockNames,
      blockReferences: [...new Set(blockInsertNames)],
      entityCounts: typeCounts,
      textEntityCount: extracted.length,
      attribCount: totalAttribs,
      highLevelAttribs: highLevelAttribs.length,
      lowLevelAttribs: lowLevelAttribs.length,
      totalEntityCount: modelEntities.length,
      usedLowLevelExtraction: lowLevelAttribs.length > 0,
      parser: 'libredwg-web (WASM)',
    },
  }
}

// ─── FileParser interface ───────────────────────────────────────────────

export class DwgParser implements FileParser {
  async parseFile(filePath: string): Promise<FileParseResult> {
    const buffer = await readFile(filePath)
    return parseDwgBuffer(buffer)
  }

  async parseBuffer(buffer: Buffer): Promise<FileParseResult> {
    return parseDwgBuffer(buffer)
  }
}
