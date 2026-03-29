/**
 * STEP File Parser — Extracts meaningful metadata from ISO-10303-21 (STEP AP203/AP214/AP242) files.
 *
 * STEP files contain thousands of geometric entities (CARTESIAN_POINT, DIRECTION, EDGE_CURVE, etc.)
 * that are meaningless for text summarization and can easily exceed LLM token limits.
 *
 * Detection strategy (blocklist + heuristic, NOT hardcoded allowlist):
 *  1. HEADER section is always fully parsed.
 *  2. Known geometric-noise entities are blocklisted and skipped.
 *  3. Everything else is evaluated with a heuristic:
 *     - Entities whose type matches a semantic PATTERN (e.g. *PRODUCT*, *UNIT*, *COLOUR*)
 *       are always kept.
 *     - Entities whose arguments contain quoted strings (human-readable names / descriptions)
 *       are kept — pure-number entities are almost always geometry.
 *  This ensures unknown / new entity types from any AP schema are surfaced instead of silently dropped.
 */

import type { FileParseResult, FileParser } from '@/lib/file-parsers/types'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('StepParser')

// ────────────────────────────────────────────────
// Semantic PATTERNS — if an entity type contains any of these substrings
// it is always considered interesting regardless of exact name.
// This replaces the old hardcoded allowlist and automatically covers
// new / unknown entity types across AP203, AP214, AP242, etc.
// ────────────────────────────────────────────────
const SEMANTIC_PATTERNS: string[] = [
  'PRODUCT', // PRODUCT, PRODUCT_DEFINITION, PRODUCT_CATEGORY, …
  'APPLICATION', // APPLICATION_CONTEXT, APPLICATION_PROTOCOL_DEFINITION, …
  'UNIT', // SI_UNIT, NAMED_UNIT, CONVERSION_BASED_UNIT, LENGTH_UNIT, …
  'MEASURE', // UNCERTAINTY_MEASURE_WITH_UNIT, LENGTH_MEASURE_WITH_UNIT, …
  'TOLERANCE', // TOLERANCE_ZONE, GEOMETRIC_TOLERANCE, …
  'COLOUR', // COLOUR_RGB, DRAUGHTING_PRE_DEFINED_COLOUR, …
  'COLOR', // Alternate US spelling some exporters use
  'MATERIAL', // MATERIAL_DESIGNATION, MATERIAL_PROPERTY, …
  'ASSEMBLY', // NEXT_ASSEMBLY_USAGE_OCCURRENCE, ASSEMBLY_COMPONENT_USAGE, …
  'REPRESENTATION_CONTEXT', // GEOMETRIC_REPRESENTATION_CONTEXT, GLOBAL_…
  'SHAPE_REPRESENTATION', // SHAPE_REPRESENTATION, ADVANCED_BREP_SHAPE_REPRESENTATION
  'SHAPE_DEFINITION', // SHAPE_DEFINITION_REPRESENTATION
  'BREP', // MANIFOLD_SOLID_BREP, BREP_WITH_VOIDS, FACETED_BREP, …
  'SHELL_BASED', // SHELL_BASED_SURFACE_MODEL
  'PRESENTATION', // PRESENTATION_STYLE_ASSIGNMENT, MECHANICAL_DESIGN_GEOMETRIC_…
  'SURFACE_STYLE', // SURFACE_STYLE_USAGE, SURFACE_STYLE_RENDERING_WITH_PROPERTIES
  'DRAUGHTING', // DRAUGHTING_PRE_DEFINED_*, DRAUGHTING_MODEL, …
  'FILL_AREA_STYLE_COLOUR', // Specific fill colour entity
  'DATUM', // GD&T datums (AP242)
  'DIMENSION', // Dimensional tolerances (AP242)
  'ANNOTATION', // PMI / annotation entities (AP242)
  'DOCUMENT', // External document references
  'PROPERTY', // PROPERTY_DEFINITION, GENERAL_PROPERTY, …
  'SECURITY', // SECURITY_CLASSIFICATION
  'APPROVAL', // APPROVAL, APPROVAL_STATUS
  'DATE', // DATE_AND_TIME, CALENDAR_DATE, …
  'PERSON', // PERSON_AND_ORGANIZATION, …
  'ORGANIZATION', // ORGANIZATION, ORGANIZATIONAL_…
  'TRANSFORMATION', // ITEM_DEFINED_TRANSFORMATION
]

// ────────────────────────────────────────────────
// Geometric-noise PATTERNS — instead of a 60+ entry hardcoded blocklist,
// we detect noise by keyword patterns in the entity type name.
// ISO 10303 follows strict naming: geometry/topology types always contain
// these substrings. This automatically covers future/unknown entity types.
// ────────────────────────────────────────────────
const NOISE_KEYWORDS = [
  'CARTESIAN_POINT', // exact — by far the most common entity
  'DIRECTION', // exact — second most common
  'AXIS2_PLACEMENT', // AXIS2_PLACEMENT_2D, AXIS2_PLACEMENT_3D
  'AXIS1_PLACEMENT',
  'VECTOR', // exact
  'VERTEX_POINT', // exact
  'VERTEX_LOOP',
  'EDGE_CURVE',
  'EDGE_LOOP',
  'ORIENTED_EDGE',
  'FACE_OUTER_BOUND',
  'FACE_BOUND',
  'ADVANCED_FACE',
  'FACE_SURFACE',
  'CLOSED_SHELL',
  'OPEN_SHELL',
  'ORIENTED_CLOSED_SHELL',
  'POLY_LOOP',
  'CONNECTED_FACE_SET',
  'MAPPED_ITEM',
  'REPRESENTATION_MAP',
  'DEFINITIONAL_REPRESENTATION',
]

/**
 * Pattern-based noise detection for entity type names.
 * Catches any entity type containing geometric keywords — no hardcoded list needed.
 * E.g. CYLINDRICAL_SURFACE, B_SPLINE_CURVE_WITH_KNOTS, RATIONAL_B_SPLINE_SURFACE, etc.
 */
const NOISE_TYPE_PATTERNS = [
  /^LINE$/, // exact match for LINE (avoid matching POLYLINE in semantic context)
  /^PLANE$/, // exact match for PLANE
  /^CIRCLE$/,
  /^ELLIPSE$/,
  /^HYPERBOLA$/,
  /^PARABOLA$/,
  /SURFACE(?!_STYLE)/, // *SURFACE* but NOT SURFACE_STYLE (which is metadata)
  /CURVE(?!_STYLE)/, // *CURVE* but NOT CURVE_STYLE
  /SPLINE/, // B_SPLINE_*, RATIONAL_B_SPLINE_*, QUASI_UNIFORM_*
  /PCURVE/,
  /SEAM_CURVE/,
  /POLYLINE/,
  /POINT_ON_/, // POINT_ON_CURVE, POINT_ON_SURFACE
  /OFFSET_CURVE/,
  /OFFSET_SURFACE/,
  /INTERSECTION_CURVE/,
  /COMPOSITE_CURVE/,
  /CURVE_STYLE_FONT/,
  /FILL_AREA_STYLE$/, // FILL_AREA_STYLE (not FILL_AREA_STYLE_COLOUR which is metadata)
  /STYLED_ITEM/, // STYLED_ITEM, OVER_RIDING_STYLED_ITEM
  /GEOMETRIC_SET/,
  /GEOMETRIC_CURVE_SET/,
]

/** Check if an entity type is geometric noise using exact-match + pattern-based detection. */
function isNoiseEntity(entityType: string): boolean {
  // Fast exact-match check for the most common noise types
  if (NOISE_KEYWORDS.includes(entityType)) return true
  // Pattern-based check catches the long tail of geometry entity types
  return NOISE_TYPE_PATTERNS.some((rx) => rx.test(entityType))
}

/**
 * Frequency threshold: entity types appearing more than this in a single file
 * are almost certainly repetitive geometric data, not human-readable metadata.
 * Applied as a post-filter after initial extraction.
 */
const FREQUENCY_CAP = 100

/** Max characters for the final summary to stay well within LLM token limits. */
const MAX_SUMMARY_CHARS = 60_000 // ~15K tokens

// ────────────────────────────────────────────────
// Header parsing
// ────────────────────────────────────────────────

interface StepHeader {
  fileDescription: string
  fileName: string
  timeStamp: string
  author: string
  organization: string
  preprocessorVersion: string
  originatingSystem: string
  authorization: string
  fileSchema: string
}

function parseHeader(headerBlock: string): StepHeader {
  const h: StepHeader = {
    fileDescription: '',
    fileName: '',
    timeStamp: '',
    author: '',
    organization: '',
    preprocessorVersion: '',
    originatingSystem: '',
    authorization: '',
    fileSchema: '',
  }

  // FILE_DESCRIPTION(('description'),'implementation_level');
  const descMatch = headerBlock.match(/FILE_DESCRIPTION\s*\(\s*\(([^)]*)\)/i)
  if (descMatch) {
    h.fileDescription = cleanStepString(descMatch[1])
  }

  // FILE_NAME('name','timestamp',('author'),('org'),'preprocessor','originating','auth');
  const nameMatch = headerBlock.match(
    /FILE_NAME\s*\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*\(([^)]*)\)\s*,\s*\(([^)]*)\)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'/i
  )
  if (nameMatch) {
    h.fileName = nameMatch[1]
    h.timeStamp = nameMatch[2]
    h.author = cleanStepString(nameMatch[3])
    h.organization = cleanStepString(nameMatch[4])
    h.preprocessorVersion = nameMatch[5]
    h.originatingSystem = nameMatch[6]
    h.authorization = nameMatch[7]
  }

  // FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
  const schemaMatch = headerBlock.match(/FILE_SCHEMA\s*\(\s*\(([^)]*)\)/i)
  if (schemaMatch) {
    h.fileSchema = cleanStepString(schemaMatch[1])
  }

  return h
}

function cleanStepString(s: string): string {
  return s.replace(/'/g, '').replace(/\s+/g, ' ').trim()
}

// ────────────────────────────────────────────────
// Data section parsing — extract only interesting entities
// ────────────────────────────────────────────────

interface StepEntity {
  id: string
  type: string
  args: string
}

/**
 * Heuristic: does this entity's argument string contain meaningful
 * human-readable content (quoted strings)?  Pure geometry entities
 * almost never have quoted names — they only contain numbers and #refs.
 */
function hasQuotedContent(args: string): boolean {
  // Match a quoted string that is non-empty and not just whitespace / empty
  const matches = args.match(/'([^']*)'/g)
  if (!matches) return false
  return matches.some((m) => {
    const inner = m.slice(1, -1).trim()
    // Filter out placeholder-only values like '', ' ', or '*'
    return inner.length > 0 && inner !== '*' && inner !== '$'
  })
}

/**
 * Does the entity type match any of the semantic patterns?
 * This replaces the old exact-match allowlist.
 */
function matchesSemanticPattern(entityType: string): boolean {
  return SEMANTIC_PATTERNS.some((pattern) => entityType.includes(pattern))
}

function extractInterestingEntities(dataBlock: string): StepEntity[] {
  const raw: StepEntity[] = []
  const typeCounts = new Map<string, number>()

  // ── Pass 1: Collect candidates using heuristics ──

  const entityRegex = /#(\d+)\s*=\s*([A-Z_][A-Z0-9_]*(?:\s+[A-Z_][A-Z0-9_]*)*)\s*\(([^;]*)\)\s*;/gi
  let match: RegExpExecArray | null

  // Count every entity type for frequency analysis
  const allTypeCounts = new Map<string, number>()
  const allEntityRegex = /#\d+\s*=\s*([A-Z_][A-Z0-9_]*)\s*\(/gi
  let tm: RegExpExecArray | null
  while ((tm = allEntityRegex.exec(dataBlock)) !== null) {
    const t = tm[1].toUpperCase()
    allTypeCounts.set(t, (allTypeCounts.get(t) || 0) + 1)
  }

  while ((match = entityRegex.exec(dataBlock)) !== null) {
    const id = `#${match[1]}`
    const rawType = match[2].trim().toUpperCase()
    const args = match[3].trim()

    // 1. Quick reject — pattern-based noise detection (no hardcoded list!)
    if (isNoiseEntity(rawType)) continue

    // 2. Frequency guard — types appearing 100+ times are geometric repetition
    const freq = allTypeCounts.get(rawType) || 0
    if (freq > FREQUENCY_CAP && !matchesSemanticPattern(rawType)) continue

    // 3. Keep if type matches a semantic keyword pattern
    if (matchesSemanticPattern(rawType)) {
      raw.push({ id, type: rawType, args })
      typeCounts.set(rawType, (typeCounts.get(rawType) || 0) + 1)
      continue
    }

    // 4. Heuristic fallback — keep if arguments contain human-readable strings
    //    This catches entity types we've never seen before that carry metadata.
    if (hasQuotedContent(args)) {
      raw.push({ id, type: rawType, args })
      typeCounts.set(rawType, (typeCounts.get(rawType) || 0) + 1)
    }
  }

  // Also handle compound entity patterns like:
  //   #140=(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT...);
  const compoundRegex = /#(\d+)\s*=\s*\(([^;]+)\)\s*;/g
  while ((match = compoundRegex.exec(dataBlock)) !== null) {
    const id = `#${match[1]}`
    const body = match[2].trim().toUpperCase()

    const hasInteresting = SEMANTIC_PATTERNS.some((pattern) => body.includes(pattern))
    if (hasInteresting) {
      raw.push({ id, type: 'COMPOUND', args: match[2].trim() })
    }
  }

  // ── Pass 2: Post-filter — cap any single type that exploded via hasQuotedContent ──
  const capPerType = 50
  const typeEmitted = new Map<string, number>()
  const entities: StepEntity[] = []
  for (const e of raw) {
    const n = typeEmitted.get(e.type) || 0
    if (n >= capPerType) continue
    typeEmitted.set(e.type, n + 1)
    entities.push(e)
  }

  return entities
}

// ────────────────────────────────────────────────
// Build a human-readable summary from extracted data
// ────────────────────────────────────────────────

function buildSummary(header: StepHeader, entities: StepEntity[], fileSizeBytes: number): string {
  const lines: string[] = []

  lines.push('=== STEP File Summary ===')
  lines.push('')

  // Header info
  lines.push('## File Information')
  if (header.fileName) lines.push(`  File Name: ${header.fileName}`)
  if (header.timeStamp) lines.push(`  Created: ${header.timeStamp}`)
  if (header.fileDescription) lines.push(`  Description: ${header.fileDescription}`)
  if (header.originatingSystem) lines.push(`  Software: ${header.originatingSystem}`)
  if (header.preprocessorVersion) lines.push(`  Preprocessor: ${header.preprocessorVersion}`)
  if (header.author) lines.push(`  Author: ${header.author}`)
  if (header.organization) lines.push(`  Organization: ${header.organization}`)
  if (header.fileSchema) lines.push(`  Schema: ${header.fileSchema}`)
  lines.push(`  File Size: ${(fileSizeBytes / 1024).toFixed(1)} KB`)
  lines.push('')

  // Track which entities were already rendered in a named section
  const rendered = new Set<string>()

  // Products (part names)
  const products = entities.filter((e) => e.type === 'PRODUCT' && !e.type.includes('CATEGORY'))
  if (products.length > 0) {
    lines.push('## Products / Parts')
    for (const p of products) {
      rendered.add(p.id)
      const nameMatch = p.args.match(/'([^']*)'/)
      const descMatch = p.args.match(/'[^']*'\s*,\s*'([^']*)'/)
      const name = nameMatch ? nameMatch[1] : 'Unknown'
      const desc = descMatch?.[1] ? descMatch[1] : ''
      lines.push(`  - ${name}${desc ? ` — ${desc}` : ''} (${p.id})`)
    }
    lines.push('')
  }

  // Shape representations
  const shapes = entities.filter((e) => e.type.includes('SHAPE_REPRESENTATION'))
  if (shapes.length > 0) {
    lines.push('## Shape Representations')
    for (const s of shapes) {
      rendered.add(s.id)
      const nameMatch = s.args.match(/'([^']*)'/)
      const name = nameMatch ? nameMatch[1] : 'Unnamed'
      lines.push(`  - ${name} (${s.id}, ${s.type})`)
    }
    lines.push('')
  }

  // Solid bodies / features
  const solids = entities.filter((e) => e.type.includes('BREP') || e.type.includes('SHELL_BASED'))
  if (solids.length > 0) {
    lines.push('## Solid Bodies / Features')
    for (const s of solids) {
      rendered.add(s.id)
      const nameMatch = s.args.match(/'([^']*)'/)
      const name = nameMatch ? nameMatch[1] : 'Unnamed'
      lines.push(`  - ${name} (${s.id}, ${s.type})`)
    }
    lines.push('')
  }

  // Assembly structure
  const assemblies = entities.filter((e) => e.type.includes('ASSEMBLY'))
  if (assemblies.length > 0) {
    lines.push('## Assembly Structure')
    lines.push(`  Total assembly relations: ${assemblies.length}`)
    for (const a of assemblies.slice(0, 20)) {
      // cap at 20
      rendered.add(a.id)
      const nameMatch = a.args.match(/'([^']*)'/)
      const name = nameMatch ? nameMatch[1] : 'Unnamed'
      lines.push(`  - ${name} (${a.id})`)
    }
    if (assemblies.length > 20) {
      lines.push(`  ... and ${assemblies.length - 20} more`)
    }
    lines.push('')
  }

  // Units
  const units = entities.filter((e) => e.type.includes('UNIT'))
  if (units.length > 0) {
    lines.push('## Units of Measurement')
    const seen = new Set<string>()
    for (const u of units) {
      rendered.add(u.id)
      const summary = describeUnit(u)
      if (summary && !seen.has(summary)) {
        seen.add(summary)
        lines.push(`  - ${summary}`)
      }
    }
    lines.push('')
  }

  // Tolerance / uncertainty
  const tolerances = entities.filter(
    (e) => e.type.includes('UNCERTAINTY') || e.type.includes('TOLERANCE')
  )
  if (tolerances.length > 0) {
    lines.push('## Tolerances')
    for (const t of tolerances) {
      const valMatch = t.args.match(/([\d.eE+-]+)/)
      const nameMatch = t.args.match(/'([^']*)'/)
      const val = valMatch ? valMatch[1] : '?'
      const name = nameMatch ? nameMatch[1] : ''
      rendered.add(t.id)
      lines.push(`  - ${name || 'Uncertainty'}: ${val}`)
    }
    lines.push('')
  }

  // Colours (if present)
  const colours = entities.filter((e) => e.type.includes('COLOUR') || e.type.includes('COLOR'))
  if (colours.length > 0) {
    lines.push('## Colours')
    const seen = new Set<string>()
    for (const c of colours.slice(0, 10)) {
      const nameMatch = c.args.match(/'([^']*)'/)
      const name = nameMatch ? nameMatch[1] : ''
      if (c.type === 'COLOUR_RGB') {
        const nums = c.args.match(/[\d.]+/g)
        const desc = name
          ? `${name} (RGB: ${nums?.slice(0, 3).join(', ') || '?'})`
          : `RGB(${nums?.slice(0, 3).join(', ') || '?'})`
        rendered.add(c.id)
        if (!seen.has(desc)) {
          seen.add(desc)
          lines.push(`  - ${desc}`)
        }
      } else {
        rendered.add(c.id)
        if (name && !seen.has(name)) {
          seen.add(name)
          lines.push(`  - ${name}`)
        }
      }
    }
    lines.push('')
  }

  // Application protocol
  const protocols = entities.filter((e) => e.type === 'APPLICATION_PROTOCOL_DEFINITION')
  if (protocols.length > 0) {
    lines.push('## Application Protocol')
    for (const p of protocols) {
      rendered.add(p.id)
      const parts = p.args.match(/'([^']*)'/g)?.map((s) => s.replace(/'/g, '')) || []
      lines.push(`  - ${parts.join(' / ')}`)
    }
    lines.push('')
  }

  // Geometric context (dimensions)
  const contexts = entities.filter(
    (e) => e.type.includes('REPRESENTATION_CONTEXT') || e.type === 'COMPOUND'
  )
  if (contexts.length > 0) {
    for (const ctx of contexts) rendered.add(ctx.id)
    const dimMatch = contexts[0].args.match(/(\d)\s*\)?\s*GLOBAL/)
    if (dimMatch) {
      lines.push(`## Geometry Context: ${dimMatch[1]}D`)
      lines.push('')
    }
  }

  // Other entities discovered by heuristic (not in any named section above)
  const other = entities.filter((e) => !rendered.has(e.id))
  if (other.length > 0) {
    lines.push('## Other Metadata')
    const otherByType = new Map<string, StepEntity[]>()
    for (const e of other) {
      const arr = otherByType.get(e.type) || []
      arr.push(e)
      otherByType.set(e.type, arr)
    }
    for (const [type, ents] of [...otherByType.entries()].sort(
      (a, b) => b[1].length - a[1].length
    )) {
      lines.push(`  ${type} (${ents.length}):`)
      for (const e of ents.slice(0, 5)) {
        const nameMatch = e.args.match(/'([^']*)'/)
        if (nameMatch?.[1]) {
          lines.push(`    - ${nameMatch[1]} (${e.id})`)
        } else {
          lines.push(`    - ${e.id}`)
        }
      }
      if (ents.length > 5) lines.push(`    ... and ${ents.length - 5} more`)
    }
    lines.push('')
  }

  // Entity count summary
  lines.push('## Entity Statistics')
  const typeCounts = new Map<string, number>()
  for (const e of entities) {
    typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1)
  }
  for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${type}: ${count}`)
  }
  lines.push('')

  // ── Safety cap: truncate if the summary is still too large ──
  let result = lines.join('\n')
  if (result.length > MAX_SUMMARY_CHARS) {
    result = result.slice(0, MAX_SUMMARY_CHARS)
    result += '\n\n[... output truncated to stay within token limits]'
  }

  return result
}

function describeUnit(entity: StepEntity): string {
  const args = entity.args.toUpperCase()

  // SI_UNIT(*,prefix,unitType) — e.g. SI_UNIT(*,.MILLI.,.METRE.)
  if (entity.type === 'SI_UNIT') {
    const prefixMatch = args.match(/\.\s*([A-Z]+)\s*\./)
    const unitMatch =
      args.match(/\.\s*([A-Z]+)\s*\.\s*\)?\s*$/) || args.match(/\.\s*([A-Z]+)\s*\.\s*,/)
    // Actually more reliable: grab all dot-delimited tokens
    const tokens = args.match(/\.([A-Z_]+)\./g)?.map((t) => t.replace(/\./g, '')) || []

    if (tokens.length >= 2) {
      return `${tokens[0]} ${tokens[1]}`
    }
    if (tokens.length === 1) {
      return tokens[0]
    }
    return ''
  }

  // CONVERSION_BASED_UNIT('unit_name',...)
  if (entity.type === 'CONVERSION_BASED_UNIT') {
    const nameMatch = entity.args.match(/'([^']*)'/)
    return nameMatch ? nameMatch[1] : ''
  }

  return ''
}

// ────────────────────────────────────────────────
// Parser class
// ────────────────────────────────────────────────

export class StepParser implements FileParser {
  async parseFile(filePath: string): Promise<FileParseResult> {
    const fs = await import('fs/promises')
    const buffer = await fs.readFile(filePath)
    return this.parseBuffer(buffer)
  }

  async parseBuffer(buffer: Buffer): Promise<FileParseResult> {
    const raw = buffer.toString('utf-8')
    const sizeBytes = buffer.length

    logger.info(`Parsing STEP file (${(sizeBytes / 1024).toFixed(1)} KB, ${raw.length} chars)`)

    // Validate it's actually a STEP file
    if (!raw.includes('ISO-10303-21') && !raw.includes('STEP;') && !raw.includes('FILE_SCHEMA')) {
      logger.warn('File does not appear to be a valid STEP file')
      return {
        content: `[STEP file — ${sizeBytes} bytes. File does not appear to be valid ISO-10303-21 format.]`,
        metadata: { error: 'Not a valid STEP file' },
      }
    }

    // Split into HEADER and DATA sections
    const headerStart = raw.indexOf('HEADER;')
    const headerEnd = raw.indexOf('ENDSEC;', headerStart)
    const dataStart = raw.indexOf('DATA;')
    const dataEnd = raw.lastIndexOf('ENDSEC;')

    const headerBlock =
      headerStart >= 0 && headerEnd > headerStart ? raw.substring(headerStart, headerEnd) : ''

    const dataBlock = dataStart >= 0 && dataEnd > dataStart ? raw.substring(dataStart, dataEnd) : ''

    // Parse header
    const header = parseHeader(headerBlock)

    // Extract only interesting entities from data section
    const entities = extractInterestingEntities(dataBlock)

    // Count total entities for statistics
    const totalEntityCount = (dataBlock.match(/#\d+\s*=/g) || []).length

    logger.info(
      `STEP parsing complete: ${entities.length} interesting entities out of ${totalEntityCount} total (${((entities.length / Math.max(totalEntityCount, 1)) * 100).toFixed(1)}% kept)`
    )

    // Build human-readable summary
    const summary = buildSummary(header, entities, sizeBytes)

    return {
      content: summary,
      metadata: {
        format: 'STEP (ISO-10303-21)',
        schema: header.fileSchema || 'Unknown',
        originatingSystem: header.originatingSystem || 'Unknown',
        timestamp: header.timeStamp || 'Unknown',
        fileName: header.fileName || 'Unknown',
        totalEntities: totalEntityCount,
        extractedEntities: entities.length,
        products: entities.filter((e) => e.type === 'PRODUCT').length,
        solidBodies: entities.filter(
          (e) => e.type === 'MANIFOLD_SOLID_BREP' || e.type === 'SHELL_BASED_SURFACE_MODEL'
        ).length,
        fileSizeKB: Math.round(sizeBytes / 1024),
      },
    }
  }
}
