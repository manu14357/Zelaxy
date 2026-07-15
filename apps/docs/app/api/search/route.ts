import { structure } from 'fumadocs-core/mdx-plugins'
import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

// Serve a STATIC search index built at compile time. The client (Orama) fetches it once and
// searches entirely in-browser, so results are instant — no per-keystroke round trip to the
// server (which is what made the previous `fetch` search feel slow across 500+ pages).
export const revalidate = false

export const { staticGET: GET } = createFromSource(source, {
  buildIndex: async (page) => {
    const structured = structure(await page.data.getText('raw'))

    return {
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      // Index titles, descriptions and section HEADINGS only — deliberately dropping full page
      // body text. Indexing every paragraph of 500+ block/tool pages produced a ~45MB static
      // index that hung the browser. Headings + titles cover the way people actually search a
      // reference ("workday", "slack send", "access token") while keeping the index small enough
      // to ship and search instantly client-side.
      structuredData: { headings: structured.headings, contents: [] },
    }
  },
})
