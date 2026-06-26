import { existsSync, readFileSync } from 'fs'
import { join, normalize, resolve, sep } from 'path'
import type { NextRequest } from 'next/server'

/**
 * Returns the raw Markdown source of a docs page so users (and LLMs) can copy or open it.
 * Powers the "Copy as Markdown" / "View as Markdown" / "Open in ChatGPT|Claude" page actions.
 *
 *   GET /api/md?slug=blocks/agent   → text/markdown of content/docs/blocks/agent.mdx
 *   GET /api/md                     → content/docs/index.mdx
 */
const CONTENT_ROOT = resolve(process.cwd(), 'content', 'docs')

export function GET(request: NextRequest) {
  const slugParam = request.nextUrl.searchParams.get('slug') ?? ''
  // Sanitise: split on '/', drop empties and any traversal segments.
  const parts = slugParam
    .split('/')
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p !== '.' && p !== '..')

  const rel = parts.length === 0 ? 'index' : parts.join(sep)
  const candidate = normalize(join(CONTENT_ROOT, `${rel}.mdx`))

  // Guard against path traversal — the resolved file must stay inside content/docs.
  if (!candidate.startsWith(CONTENT_ROOT + sep) && candidate !== join(CONTENT_ROOT, 'index.mdx')) {
    return new Response('Not found', { status: 404 })
  }
  if (!existsSync(candidate)) {
    return new Response('Not found', { status: 404 })
  }

  let raw = readFileSync(candidate, 'utf-8')
  // Strip YAML frontmatter; keep title as an H1 so the markdown is self-describing.
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (fm) {
    const title = fm[1].match(/^title:\s*(.+)$/m)?.[1]?.trim()
    raw = raw.slice(fm[0].length)
    if (title && !/^#\s/m.test(raw.split('\n').slice(0, 3).join('\n'))) {
      raw = `# ${title}\n\n${raw.replace(/^\s+/, '')}`
    }
  }

  return new Response(raw, {
    status: 200,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
