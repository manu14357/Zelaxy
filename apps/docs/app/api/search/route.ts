import { structure } from 'fumadocs-core/mdx-plugins'
import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

// Serve a STATIC search index built at compile time. The client (Orama) fetches it once and
// searches entirely in-browser, so results are instant — no per-keystroke round trip to the
// server (which is what made the previous `fetch` search feel slow across 500+ pages).
export const revalidate = false

// Section tag so search can be filtered to a single area (Blocks, Tools, Guides, …).
function sectionTag(url: string): string {
  if (url.startsWith('/docs/blocks')) return 'blocks'
  if (url.startsWith('/docs/tools')) return 'tools'
  if (url.startsWith('/docs/triggers')) return 'triggers'
  if (url.startsWith('/docs/guides')) return 'guides'
  if (url.startsWith('/docs/enterprise')) return 'enterprise'
  return 'get-started'
}

export const { staticGET: GET } = createFromSource(source, {
  buildIndex: async (page) => {
    const structured = structure(await page.data.getText('raw'))

    return {
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      tag: sectionTag(page.url),
      // Index titles, descriptions and section HEADINGS only — deliberately dropping full page
      // body text. Indexing every paragraph of 500+ block/tool pages produced a ~45MB static
      // index that hung the browser. Headings + titles cover the way people actually search a
      // reference ("workday", "slack send", "access token") while keeping the index small enough
      // to ship and search instantly client-side.
      structuredData: { headings: structured.headings, contents: [] },
    }
  },
})
