import type { RssFeedItem } from '@/tools/rss/types'

/**
 * Shared RSS/Atom parsing.
 *
 * Lives here rather than inside a single tool so the rss_fetch_feed tool and the RSS polling
 * service read feeds identically — two parsers would drift, and the poller decides what counts
 * as a "new item" based on what it parses.
 */

export function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

export function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeXmlEntities(match[1]) : ''
}

export function extractLink(block: string): string {
  // RSS <link>...</link>
  const rss = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
  if (rss?.[1].trim()) return decodeXmlEntities(rss[1])
  // Atom <link href="..." />
  const atom = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i)
  return atom ? decodeXmlEntities(atom[1]) : ''
}

/** Channel/feed title — read from the head of the document, before the first item/entry. */
export function extractFeedTitle(xml: string): string {
  return extractTag(xml.split(/<item[\s>]/i)[0].split(/<entry[\s>]/i)[0], 'title') || ''
}

/**
 * A stable identity for a feed item, used to tell new items from ones already seen.
 *
 * Prefers the feed's own guid/id, since link and title can both change in place after
 * publication. Falls back to link, then title, so items still de-duplicate on feeds that omit
 * a guid entirely.
 */
export function extractItemId(block: string): string {
  return (
    extractTag(block, 'guid') ||
    extractTag(block, 'id') ||
    extractLink(block) ||
    extractTag(block, 'title')
  )
}

export function parseFeedItems(xml: string): RssFeedItem[] {
  const blocks: string[] = []
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi)
  const entryMatches = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi)
  if (itemMatches) blocks.push(...itemMatches)
  if (entryMatches) blocks.push(...entryMatches)

  return blocks.map((block) => ({
    title: extractTag(block, 'title'),
    link: extractLink(block),
    pubDate:
      extractTag(block, 'pubDate') ||
      extractTag(block, 'published') ||
      extractTag(block, 'updated'),
    description: extractTag(block, 'description') || extractTag(block, 'summary'),
  }))
}

/** Same as parseFeedItems, but also returns each item's stable id for de-duplication. */
export function parseFeedItemsWithIds(xml: string): Array<RssFeedItem & { id: string }> {
  const blocks: string[] = []
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi)
  const entryMatches = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi)
  if (itemMatches) blocks.push(...itemMatches)
  if (entryMatches) blocks.push(...entryMatches)

  return blocks.map((block) => ({
    id: extractItemId(block),
    title: extractTag(block, 'title'),
    link: extractLink(block),
    pubDate:
      extractTag(block, 'pubDate') ||
      extractTag(block, 'published') ||
      extractTag(block, 'updated'),
    description: extractTag(block, 'description') || extractTag(block, 'summary'),
  }))
}
