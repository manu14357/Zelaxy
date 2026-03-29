import { structure } from 'fumadocs-core/mdx-plugins'
import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

export const { GET } = createFromSource(source, {
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
