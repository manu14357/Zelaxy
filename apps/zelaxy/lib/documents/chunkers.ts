/**
 * Chunking strategies.
 *
 * The base {@link TextChunker} (in ./chunker) is the hierarchical recursive splitter used for
 * prose. This module adds the rest of the strategy set described in the docs and a factory that
 * routes by strategy — plus `auto`, which inspects the file's MIME type / extension and picks the
 * right chunker on its own:
 *
 *   - auto      → inspect file, route to structural (json/yaml) / row-grouped (csv) / text
 *   - text      → TextChunker (RecursiveCharacterTextSplitter-style), the prose default
 *   - recursive → TextChunker with a custom separator hierarchy or a built-in recipe
 *   - sentence  → split on sentence boundaries, pack whole sentences up to the chunk size
 *   - token     → fixed-size sliding window aligned to word boundaries
 *   - regex     → split on a user regex; optional strict boundaries (one match per chunk)
 *
 * Every strategy returns the same {@link Chunk} shape so the processing pipeline is agnostic.
 */

import { type Chunk, type ChunkerOptions, TextChunker } from './chunker'

export type ChunkingStrategy = 'auto' | 'text' | 'recursive' | 'sentence' | 'token' | 'regex'

export interface AdvancedChunkerOptions extends ChunkerOptions {
  strategy?: ChunkingStrategy
  /** recursive: explicit separator hierarchy (largest semantic unit first). */
  separators?: string[]
  /** recursive: built-in separator recipe. Ignored when `separators` is provided. */
  recipe?: 'plain' | 'markdown' | 'code'
  /** regex: the split pattern. */
  pattern?: string
  /** regex: pattern flags (default 'g'). */
  flags?: string
  /** regex: when true, each match becomes its own chunk — no merging, overlap disabled. */
  strictBoundaries?: boolean
}

export interface FileMeta {
  mimeType?: string
  filename?: string
}

export interface Chunker {
  chunk(text: string): Promise<Chunk[]>
}

// Built-in separator recipes for the recursive strategy (inspired by Chonkie).
const RECIPES: Record<NonNullable<AdvancedChunkerOptions['recipe']>, string[]> = {
  plain: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '],
  markdown: [
    '\n## ',
    '\n### ',
    '\n#### ',
    '\n##### ',
    '\n###### ',
    '\n# ',
    '\n\n',
    '\n',
    '. ',
    ' ',
  ],
  code: ['\nclass ', '\ndef ', '\nfunction ', '\n\tfunction ', '\n\n', '\n', ' '],
}

const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'vs',
  'etc',
  'eg',
  'ie',
  'no',
  'inc',
  'ltd',
  'co',
  'corp',
  'fig',
  'al',
])

/**
 * Token estimate — mirrors the heuristic in TextChunker so chunk sizes are consistent
 * across every strategy. ~1 token per short word, more for longer words.
 */
export function estimateTokens(text: string): number {
  if (!text?.trim()) return 0
  let tokenCount = 0
  for (const word of text.trim().split(/\s+/)) {
    if (word.length === 0) continue
    if (word.length <= 4) tokenCount += 1
    else if (word.length <= 8) tokenCount += Math.ceil(word.length / 5)
    else tokenCount += Math.ceil(word.length / 4)
  }
  return tokenCount
}

function toChunks(texts: string[], minChunkSize: number): Chunk[] {
  const out: Chunk[] = []
  let cursor = 0
  for (const raw of texts) {
    const text = raw.trim()
    if (text.length < Math.max(1, minChunkSize)) continue
    out.push({
      text,
      tokenCount: estimateTokens(text),
      metadata: { startIndex: cursor, endIndex: cursor + text.length },
    })
    cursor += text.length
  }
  return out
}

function applyWordOverlap(chunks: string[], overlap: number): string[] {
  if (overlap <= 0 || chunks.length <= 1) return chunks
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk
    const prevWords = chunks[i - 1].split(/\s+/)
    const overlapWords = prevWords.slice(-Math.min(overlap, prevWords.length))
    return overlapWords.length > 0 ? `${overlapWords.join(' ')} ${chunk}` : chunk
  })
}

/** Pack adjacent pieces together up to the chunk size (the standard merge behavior). */
function packBySize(pieces: string[], chunkSize: number): string[] {
  const chunks: string[] = []
  let current = ''
  for (const piece of pieces) {
    const candidate = current ? `${current} ${piece}` : piece
    if (estimateTokens(candidate) <= chunkSize) {
      current = candidate
    } else {
      if (current) chunks.push(current)
      // A single oversized piece is split at word boundaries.
      if (estimateTokens(piece) > chunkSize) {
        chunks.push(...splitOversizedByWords(piece, chunkSize))
        current = ''
      } else {
        current = piece
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function splitOversizedByWords(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (estimateTokens(candidate) <= chunkSize) {
      current = candidate
    } else {
      if (current) chunks.push(current)
      current = word
    }
  }
  if (current) chunks.push(current)
  return chunks
}

// ─── Sentence ──────────────────────────────────────────────────────────────
class SentenceChunker implements Chunker {
  constructor(private opts: AdvancedChunkerOptions) {}

  private splitSentences(text: string): string[] {
    const sentences: string[] = []
    // Candidate boundaries: terminal punctuation followed by whitespace + a capital/quote/digit.
    const re = /([.!?]+)(\s+)(?=["'([]?[A-Z0-9])/g
    let last = 0
    let m: RegExpExecArray | null
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
    while ((m = re.exec(text)) !== null) {
      const end = m.index + m[1].length
      const candidate = text.slice(last, end)
      // Don't break on a known abbreviation immediately before the period.
      const wordBefore = candidate
        .trim()
        .split(/\s+/)
        .pop()
        ?.replace(/[.!?]+$/, '')
        .toLowerCase()
      if (wordBefore && ABBREVIATIONS.has(wordBefore)) continue
      sentences.push(candidate.trim())
      last = end + m[2].length
    }
    const tail = text.slice(last).trim()
    if (tail) sentences.push(tail)
    return sentences.filter(Boolean)
  }

  async chunk(text: string): Promise<Chunk[]> {
    if (!text?.trim()) return []
    const size = this.opts.chunkSize ?? 512
    const sentences = this.splitSentences(text)
    let packed = packBySize(sentences, size)
    packed = applyWordOverlap(packed, this.opts.overlap ?? 0)
    return toChunks(packed, this.opts.minChunkSize ?? 1)
  }
}

// ─── Token (fixed-size sliding window over words) ────────────────────────────
class TokenChunker implements Chunker {
  constructor(private opts: AdvancedChunkerOptions) {}

  async chunk(text: string): Promise<Chunk[]> {
    if (!text?.trim()) return []
    const size = this.opts.chunkSize ?? 512
    const overlap = Math.min(this.opts.overlap ?? 0, size - 1)
    const words = text.trim().split(/\s+/)
    const chunks: string[] = []
    // Approximate word window from the token budget (avg ~1.3 tokens/word).
    const windowWords = Math.max(1, Math.round(size / 1.3))
    const stepWords = Math.max(1, windowWords - Math.round(overlap / 1.3))
    for (let i = 0; i < words.length; i += stepWords) {
      const slice = words.slice(i, i + windowWords).join(' ')
      if (slice.trim()) chunks.push(slice)
      if (i + windowWords >= words.length) break
    }
    return toChunks(chunks, this.opts.minChunkSize ?? 1)
  }
}

// ─── Regex ───────────────────────────────────────────────────────────────────
class RegexChunker implements Chunker {
  constructor(private opts: AdvancedChunkerOptions) {}

  async chunk(text: string): Promise<Chunk[]> {
    if (!text?.trim()) return []
    const size = this.opts.chunkSize ?? 512
    const pattern = this.opts.pattern || '\\n\\n'
    let splits: string[]
    try {
      const re = new RegExp(pattern, this.opts.flags ?? 'g')
      splits = text.split(re).filter((s) => s?.trim())
    } catch {
      // Invalid regex → fall back to paragraph splits rather than erroring the upload.
      splits = text.split(/\n\n+/).filter((s) => s.trim())
    }

    if (this.opts.strictBoundaries) {
      // Each match is its own chunk; no merge, no overlap; oversized splits sub-split by words.
      const out: string[] = []
      for (const s of splits) {
        if (estimateTokens(s) > size) out.push(...splitOversizedByWords(s, size))
        else out.push(s)
      }
      return toChunks(out, this.opts.minChunkSize ?? 1)
    }

    let packed = packBySize(splits, size)
    packed = applyWordOverlap(packed, this.opts.overlap ?? 0)
    return toChunks(packed, this.opts.minChunkSize ?? 1)
  }
}

// ─── Structural (JSON / JSONL / YAML records, CSV/TSV rows) ──────────────────
class StructuralChunker implements Chunker {
  constructor(
    private opts: AdvancedChunkerOptions,
    private kind: 'json' | 'csv'
  ) {}

  private records(text: string): string[] {
    if (this.kind === 'csv') {
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length === 0) return []
      const header = lines[0]
      // Each data row becomes a record, header preserved for context.
      return lines.slice(1).map((row) => `${header}\n${row}`)
    }
    // json / jsonl / yaml
    const trimmed = text.trim()
    // JSONL: one JSON value per line.
    if (trimmed.includes('\n') && !trimmed.startsWith('[') && !trimmed.startsWith('{\n')) {
      const lines = trimmed.split(/\r?\n/).filter((l) => l.trim())
      const parsedLines = lines.map((l) => {
        try {
          JSON.parse(l)
          return l
        } catch {
          return null
        }
      })
      if (parsedLines.every(Boolean)) return parsedLines as string[]
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map((r) => JSON.stringify(r))
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).map(([k, v]) => JSON.stringify({ [k]: v }))
      }
    } catch {
      // Not valid JSON — treat top-level blocks (YAML-ish) as records.
      const blocks = trimmed.split(/\n(?=\S)/).filter((b) => b.trim())
      if (blocks.length > 1) return blocks
    }
    return [trimmed]
  }

  async chunk(text: string): Promise<Chunk[]> {
    if (!text?.trim()) return []
    const size = this.opts.chunkSize ?? 1024
    // Records are never split mid-way; small records may batch together up to the size.
    const packed = packBySize(this.records(text), size)
    return toChunks(packed, this.opts.minChunkSize ?? 1)
  }
}

// ─── Auto routing ─────────────────────────────────────────────────────────────
function extOf(meta?: FileMeta): string {
  const name = meta?.filename || ''
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
}

/** Resolve `auto` to a concrete chunker based on MIME type / extension and content shape. */
export function routeAuto(opts: AdvancedChunkerOptions, meta?: FileMeta): Chunker {
  const ext = extOf(meta)
  const mime = (meta?.mimeType || '').toLowerCase()

  if (
    ['json', 'jsonl', 'yaml', 'yml'].includes(ext) ||
    mime.includes('json') ||
    mime.includes('yaml')
  ) {
    return new StructuralChunker(opts, 'json')
  }
  if (['csv', 'tsv'].includes(ext) || mime.includes('csv') || mime.includes('tab-separated')) {
    return new StructuralChunker(opts, 'csv')
  }
  // Everything else (pdf, docx, txt, md, html, pptx, …) → prose Text strategy.
  return new TextChunker(opts)
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createChunker(opts: AdvancedChunkerOptions = {}, meta?: FileMeta): Chunker {
  const strategy: ChunkingStrategy = opts.strategy ?? 'auto'
  switch (strategy) {
    case 'auto':
      return routeAuto(opts, meta)
    case 'recursive': {
      const separators = opts.separators ?? (opts.recipe ? RECIPES[opts.recipe] : undefined)
      // TextChunker accepts a custom separator hierarchy via options.
      return new TextChunker({ ...opts, separators } as ChunkerOptions)
    }
    case 'sentence':
      return new SentenceChunker(opts)
    case 'token':
      return new TokenChunker(opts)
    case 'regex':
      return new RegexChunker(opts)
    default:
      return new TextChunker(opts)
  }
}

export async function chunkText(
  text: string,
  opts: AdvancedChunkerOptions = {},
  meta?: FileMeta
): Promise<Chunk[]> {
  return createChunker(opts, meta).chunk(text)
}
