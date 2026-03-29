import * as fs from 'fs'
import * as path from 'path'
import { createLogger } from '@/lib/logs/console/logger'
import { BaseCopilotTool } from '../base'

interface DocsSearchParams {
  query: string
  topK?: number
}

interface DocumentationSearchResult {
  id: number
  title: string
  url: string
  content: string
  similarity: number
}

interface DocsSearchResult {
  results: DocumentationSearchResult[]
  query: string
  totalResults: number
}

class SearchDocsTool extends BaseCopilotTool<DocsSearchParams, DocsSearchResult> {
  readonly id = 'search_documentation'
  readonly displayName = 'Searching documentation'

  protected async executeImpl(params: DocsSearchParams): Promise<DocsSearchResult> {
    return searchDocs(params)
  }
}

// Export the tool instance
export const searchDocsTool = new SearchDocsTool()

/**
 * Resolve the docs content directory path.
 * Works in both development and production environments.
 */
function getDocsContentDir(): string {
  // Try relative paths from the app root
  const candidates = [
    path.resolve(process.cwd(), '..', 'docs', 'content', 'docs'),
    path.resolve(process.cwd(), 'apps', 'docs', 'content', 'docs'),
    path.resolve(process.cwd(), '..', '..', 'apps', 'docs', 'content', 'docs'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  // Fallback: workspace root
  return path.resolve(process.cwd(), '..', 'docs', 'content', 'docs')
}

/**
 * Parse MDX frontmatter to extract title and description
 */
function parseFrontmatter(content: string): { title: string; description: string; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/m)
  if (!match) {
    return { title: '', description: '', body: content }
  }

  const frontmatter = match[1]
  const body = match[2]

  let title = ''
  let description = ''

  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m)
  if (titleMatch) title = titleMatch[1].trim().replace(/^['"]|['"]$/g, '')

  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  if (descMatch) description = descMatch[1].trim().replace(/^['"]|['"]$/g, '')

  return { title, description, body }
}

/**
 * Strip MDX/Markdown syntax to get plain text for searching
 */
function stripMdx(content: string): string {
  return (
    content
      // Remove import statements
      .replace(/^import\s+.*$/gm, '')
      // Remove JSX components but keep text content
      .replace(/<[^>]+>/g, ' ')
      // Remove code blocks but keep content
      .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, ''))
      // Remove inline code backticks
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown headers markers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Remove horizontal rules
      .replace(/^---+$/gm, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Recursively find all .mdx files in a directory
 */
function findMdxFiles(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findMdxFiles(fullPath))
    } else if (entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Calculate a relevance score between a query and document content
 * Uses term frequency matching with title/description boosting
 */
function calculateRelevance(
  query: string,
  title: string,
  description: string,
  body: string
): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)

  if (queryTerms.length === 0) return 0

  const titleLower = title.toLowerCase()
  const descLower = description.toLowerCase()
  const bodyLower = body.toLowerCase()

  let score = 0
  let matchedTerms = 0

  for (const term of queryTerms) {
    let termScore = 0

    // Exact match in title (highest weight)
    if (titleLower.includes(term)) {
      termScore += 10
      // Bonus for exact word match in title
      if (new RegExp(`\\b${escapeRegex(term)}\\b`, 'i').test(title)) {
        termScore += 5
      }
    }

    // Match in description
    if (descLower.includes(term)) {
      termScore += 5
    }

    // Match in body - count occurrences
    const bodyMatches = bodyLower.split(term).length - 1
    if (bodyMatches > 0) {
      termScore += Math.min(bodyMatches, 10) // Cap at 10 occurrences
    }

    if (termScore > 0) {
      matchedTerms++
      score += termScore
    }
  }

  // Bonus for matching all query terms
  if (matchedTerms === queryTerms.length && queryTerms.length > 1) {
    score *= 1.5
  }

  // Bonus for exact phrase match
  const queryLower = query.toLowerCase()
  if (titleLower.includes(queryLower)) {
    score += 20
  }
  if (descLower.includes(queryLower)) {
    score += 10
  }
  if (bodyLower.includes(queryLower)) {
    score += 5
  }

  // Normalize by number of query terms
  return matchedTerms > 0 ? score / queryTerms.length : 0
}

/**
 * Get the docs URL path from a file path
 */
function getDocsUrl(filePath: string, docsDir: string): string {
  const relative = path.relative(docsDir, filePath)
  const withoutExt = relative.replace(/\.mdx$/, '')
  const urlPath = withoutExt.replace(/\\/g, '/').replace(/\/index$/, '')
  return `/docs/${urlPath}`
}

/**
 * Extract a relevant snippet from the content around the matching terms
 */
function extractSnippet(body: string, query: string, maxLength = 1000): string {
  const bodyLower = body.toLowerCase()
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)

  // Try to find the best matching section
  let bestStart = 0
  let bestScore = 0

  // Search in chunks of ~500 chars
  const chunkSize = 500
  for (let i = 0; i < body.length - 100; i += 100) {
    const chunk = bodyLower.substring(i, i + chunkSize)
    let chunkScore = 0
    for (const term of queryTerms) {
      const matches = chunk.split(term).length - 1
      chunkScore += matches
    }
    if (chunkScore > bestScore) {
      bestScore = chunkScore
      bestStart = i
    }
  }

  // Extract snippet around best match
  const start = Math.max(0, bestStart - 100)
  const end = Math.min(body.length, start + maxLength)
  let snippet = body.substring(start, end)

  // Clean up snippet boundaries
  if (start > 0) snippet = `...${snippet.substring(snippet.indexOf(' ') + 1)}`
  if (end < body.length) snippet = `${snippet.substring(0, snippet.lastIndexOf(' '))}...`

  return snippet.trim()
}

// Cache for loaded docs to avoid re-reading on every search
let docsCache: Array<{
  filePath: string
  title: string
  description: string
  plainBody: string
  rawBody: string
  url: string
}> | null = null
let docsCacheTime = 0
const CACHE_TTL = 60_000 // 1 minute cache

/**
 * Load all documentation files from the docs directory
 */
function loadDocs(docsDir: string): NonNullable<typeof docsCache> {
  const now = Date.now()
  if (docsCache && now - docsCacheTime < CACHE_TTL) {
    return docsCache
  }

  const files = findMdxFiles(docsDir)
  const docs = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { title, description, body } = parseFrontmatter(raw)
    const plainBody = stripMdx(body)
    const url = getDocsUrl(filePath, docsDir)

    return { filePath, title, description, plainBody, rawBody: body, url }
  })

  docsCache = docs
  docsCacheTime = now
  return docs
}

/**
 * Main search implementation - searches MDX documentation files directly
 */
async function searchDocs(params: DocsSearchParams): Promise<DocsSearchResult> {
  const logger = createLogger('DocsSearch')
  const { query, topK = 5 } = params

  if (!query || query.trim().length === 0) {
    return { results: [], query: query || '', totalResults: 0 }
  }

  logger.info('Searching documentation files', { query, topK })

  try {
    const docsDir = getDocsContentDir()
    logger.info('Using docs directory', { docsDir, exists: fs.existsSync(docsDir) })

    if (!fs.existsSync(docsDir)) {
      logger.error('Documentation directory not found', { docsDir })
      return { results: [], query, totalResults: 0 }
    }

    const docs = loadDocs(docsDir)
    if (!docs || docs.length === 0) {
      logger.warn('No documentation files found')
      return { results: [], query, totalResults: 0 }
    }

    logger.info(`Loaded ${docs.length} documentation files`)

    // Score each document
    const scored = docs
      .map((doc) => ({
        ...doc,
        score: calculateRelevance(query, doc.title, doc.description, doc.plainBody),
      }))
      .filter((doc) => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    const results: DocumentationSearchResult[] = scored.map((doc, index) => ({
      id: index + 1,
      title: doc.title || path.basename(doc.filePath, '.mdx'),
      url: doc.url,
      content: `${doc.description ? `${doc.description}\n\n` : ''}${extractSnippet(doc.plainBody, query, 5000)}`,
      similarity: Math.min(doc.score / 20, 1), // Normalize to 0-1 range
    }))

    logger.info(`Found ${results.length} documentation results for "${query}"`)

    return {
      results,
      query,
      totalResults: results.length,
    }
  } catch (error) {
    logger.error('Documentation search failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
    })
    return { results: [], query, totalResults: 0 }
  }
}
