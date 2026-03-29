/**
 * DXF file parser using the `dxf-parser` npm package.
 *
 * Parses ASCII .dxf files and extracts text-bearing entities
 * (TEXT, MTEXT, DIMENSION, ATTDEF, ATTRIB), layer information,
 * and header variables — pure JavaScript, zero native dependencies.
 *
 * Enhanced with comprehensive ATTRIB extraction from INSERT entities,
 * structured title block output, and text deduplication.
 */

import { readFile } from 'fs/promises'
import type { FileParseResult, FileParser } from '@/lib/file-parsers/types'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('DxfParser')

/**
 * Strip MTEXT formatting codes to plain text.
 */
function stripMtextFormatting(raw: string | undefined | null): string {
  if (!raw) return ''
  let t = raw
  t = t.replace(/\{\\[^;]*;/g, '')
  t = t.replace(/\}/g, '')
  t = t.replace(/\\A\d;/g, '')
  t = t.replace(/\\H[\d.]+x?;/g, '')
  t = t.replace(/\\W[\d.]+;/g, '')
  t = t.replace(/\\Q[\d.]+;/g, '')
  t = t.replace(/\\T[\d.]+;/g, '')
  t = t.replace(/\\f[^;]*;/g, '')
  t = t.replace(/\\C\d+;/g, '')
  t = t.replace(/\\[LlOoKk]/g, '')
  t = t.replace(/\\S[^;]*;/g, (m) => m.slice(2, -1).replace(/[#^/]/g, '/'))
  t = t.replace(/\\P/gi, '\n')
  t = t.replace(/\\~/g, ' ')
  t = t.replace(/\\\\/g, '\\')
  t = t.replace(/\\[a-zA-Z][^;]*;/g, '')
  return t.trim()
}

interface ExtractedText {
  type: string
  layer: string
  text: string
  tag?: string
  blockName?: string
  measurement?: number
}

/**
 * Get text value from a DXF entity, trying multiple property paths.
 */
function getDxfEntityText(e: any): string {
  if (!e) return ''
  if (typeof e.text === 'string') return e.text
  if (typeof e.textString === 'string') return e.textString
  if (typeof e.text === 'object' && e.text?.text) return String(e.text.text)
  if (typeof e.value === 'string') return e.value
  return ''
}

function extractFromDxfEntities(entities: any[]): ExtractedText[] {
  const results: ExtractedText[] = []

  for (const e of entities) {
    if (!e || !e.type) continue
    const layer: string = e.layer ?? ''
    // Case-insensitive type matching
    const entityType = String(e.type).toUpperCase()

    switch (entityType) {
      case 'TEXT': {
        const t = getDxfEntityText(e)
        if (t) results.push({ type: 'TEXT', layer, text: t })
        break
      }
      case 'MTEXT': {
        const raw = getDxfEntityText(e)
        const cleaned = stripMtextFormatting(raw)
        if (cleaned) results.push({ type: 'MTEXT', layer, text: cleaned })
        break
      }
      case 'DIMENSION': {
        const raw = getDxfEntityText(e)
        const meas = e.actualMeasurement ?? e.measurement
        const displayText = raw && raw !== '<>' ? raw : meas != null ? String(meas) : ''
        if (displayText) {
          results.push({ type: 'DIMENSION', layer, text: displayText, measurement: meas })
        }
        break
      }
      case 'ATTDEF': {
        const t = getDxfEntityText(e)
        if (t) {
          results.push({ type: 'ATTDEF', layer, text: t, tag: e.tag })
        }
        break
      }
      case 'ATTRIB': {
        const t = getDxfEntityText(e)
        if (t) {
          results.push({ type: 'ATTRIB', layer, text: t, tag: e.tag })
        }
        break
      }
      case 'INSERT': {
        const blockName = e.name ?? e.blockName ?? ''
        // INSERT may carry ATTRIB sub-entities
        if (Array.isArray(e.attribs)) {
          for (const a of e.attribs) {
            const t = getDxfEntityText(a)
            if (t) results.push({ type: 'ATTRIB', layer, text: t, tag: a.tag, blockName })
          }
        }
        // Also check for 'attributes' property
        if (Array.isArray(e.attributes)) {
          for (const a of e.attributes) {
            const t = getDxfEntityText(a)
            if (t) results.push({ type: 'ATTRIB', layer, text: t, tag: a.tag, blockName })
          }
        }
        break
      }
      default: {
        // Generic fallback: try to extract text from unknown entity types
        const t = getDxfEntityText(e)
        if (t && t.length > 1) {
          results.push({ type: entityType, layer, text: t })
        }
        break
      }
    }
  }

  return results
}

async function parseDxfBuffer(buffer: Buffer): Promise<FileParseResult> {
  const { default: DxfParser } = await import('dxf-parser')
  const parser = new DxfParser()

  const text = buffer.toString('utf-8')
  let dxf: any

  try {
    dxf = parser.parseSync(text)
  } catch (parseErr) {
    logger.error('DXF parsing failed:', parseErr)
    return {
      content: `[DXF Parse Error] ${(parseErr as Error).message}`,
      metadata: { error: (parseErr as Error).message },
    }
  }

  if (!dxf) {
    return {
      content: '[DXF Parse Error] Parser returned null — file may be corrupt or binary DXF.',
      metadata: { error: 'parseSync returned null' },
    }
  }

  // ── layers ───────────────────────────────────────────────────────────
  const layers: string[] = []
  if (dxf.tables?.layer?.layers) {
    for (const [name] of Object.entries(dxf.tables.layer.layers)) {
      layers.push(name)
    }
  }

  // ── blocks ───────────────────────────────────────────────────────────
  const blockNames: string[] = []
  const blockEntities: any[] = []
  const blockInsertNames: string[] = []
  if (dxf.blocks) {
    for (const [name, block] of Object.entries(dxf.blocks) as [string, any][]) {
      if (!name.startsWith('*')) blockNames.push(name)
      if (Array.isArray(block?.entities)) {
        blockEntities.push(...block.entities)
      }
    }
  }

  // ── extract text ─────────────────────────────────────────────────────
  const modelEntities = dxf.entities ?? []

  // Track INSERT block names
  for (const e of modelEntities) {
    if (e?.type === 'INSERT' && (e.name || e.blockName)) {
      blockInsertNames.push(e.name ?? e.blockName)
    }
  }

  const allEntities = [...modelEntities, ...blockEntities]
  const extracted = extractFromDxfEntities(allEntities)

  // ── entity type stats ────────────────────────────────────────────────
  const typeCounts: Record<string, number> = {}
  for (const e of modelEntities) {
    if (e?.type) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
  }

  // ── header info ──────────────────────────────────────────────────────
  const headerInfo: Record<string, any> = {}
  if (dxf.header) {
    for (const key of ['$ACADVER', '$INSUNITS', '$MEASUREMENT', '$DWGCODEPAGE']) {
      if (dxf.header[key] != null) headerInfo[key] = dxf.header[key]
    }
  }

  // ── build structured output ──────────────────────────────────────────
  const sections: string[] = []

  sections.push('=== DXF FILE CONTENT ===\n')

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
  if (headerInfo.$ACADVER) {
    sections.push(`AutoCAD version: ${headerInfo.$ACADVER}`)
  }

  const typeList = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, c]) => `${t}: ${c}`)
    .join(', ')
  if (typeList) sections.push(`Entity types: ${typeList}`)

  sections.push('')

  // ── Title block / attribute data (structured key-value) ──────────────
  const attribs = extracted.filter((e) => e.type === 'ATTRIB' && e.tag)
  if (attribs.length > 0) {
    sections.push('--- Title Block / Attributes ---\n')
    const byBlock: Record<string, ExtractedText[]> = {}
    for (const a of attribs) {
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

  // ── Text content (non-ATTRIB, deduplicated) ──────────────────────────
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

  // ── Dimensions ──────────────────────────────────────────────────────
  const dims = extracted.filter((e) => e.type === 'DIMENSION')
  if (dims.length > 0) {
    sections.push('--- Dimensions ---')
    for (const d of dims) {
      sections.push(`  ${d.text}${d.measurement != null ? ` = ${d.measurement}` : ''}`)
    }
    sections.push('')
  }

  // no text at all
  if (extracted.length === 0) {
    sections.push('(No text entities found in this DXF file)')
    sections.push('')
  }

  const content = sections.join('\n')

  return {
    content,
    metadata: {
      format: 'DXF',
      layers,
      blockNames,
      blockReferences: [...new Set(blockInsertNames)],
      entityCounts: typeCounts,
      textEntityCount: extracted.length,
      attribCount: attribs.length,
      totalEntityCount: modelEntities.length,
      headerInfo,
      parser: 'dxf-parser',
    },
  }
}

export class DxfNativeParser implements FileParser {
  async parseFile(filePath: string): Promise<FileParseResult> {
    const buffer = await readFile(filePath)
    return parseDxfBuffer(buffer)
  }

  async parseBuffer(buffer: Buffer): Promise<FileParseResult> {
    return parseDxfBuffer(buffer)
  }
}
