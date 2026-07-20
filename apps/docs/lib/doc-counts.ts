import { source } from '@/lib/source'

/**
 * Live counts of documented blocks/tools, derived from whatever MDX pages actually exist under
 * content/docs/blocks and content/docs/tools — never hand-typed. New docs added under either
 * directory are picked up automatically on the next build; nothing here needs updating by hand.
 */
export function getDocCounts(): { blocks: number; tools: number } {
  const pages = source.getPages()
  const blocks = pages.filter(
    (p) => p.url.startsWith('/docs/blocks/') && p.url !== '/docs/blocks'
  ).length
  const tools = pages.filter(
    (p) => p.url.startsWith('/docs/tools/') && p.url !== '/docs/tools'
  ).length
  return { blocks, tools }
}
