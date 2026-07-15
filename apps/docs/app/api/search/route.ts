import { structure } from 'fumadocs-core/mdx-plugins'
import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

// Serve a STATIC search index built at compile time. The client (Orama) fetches it once and
// searches entirely in-browser, so results are instant — no per-keystroke round trip to the
// server (which is what made the previous `fetch` search feel slow across 500+ pages).
export const revalidate = false

export const { staticGET: GET } = createFromSource(source, {
  buildIndex: async (page) => {
    const rawText = await page.data.getText('raw')
    const structuredData = structure(rawText)

    return {
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData,
    }
  },
})
