import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://docs.zelaxy.in'

  const pages = source.getPages()

  const docsEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 1.0 : 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...docsEntries,
  ]
}
