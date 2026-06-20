import type { RssFeedItem, RssFeedResponse, RssFetchFeedParams } from '@/tools/rss/types'
import type { ToolConfig } from '@/tools/types'

function decodeXmlEntities(value: string): string {
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

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeXmlEntities(match[1]) : ''
}

function extractLink(block: string): string {
  // RSS <link>...</link>
  const rss = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
  if (rss?.[1].trim()) return decodeXmlEntities(rss[1])
  // Atom <link href="..." />
  const atom = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i)
  return atom ? decodeXmlEntities(atom[1]) : ''
}

export const fetchFeedTool: ToolConfig<RssFetchFeedParams, RssFeedResponse> = {
  id: 'rss_fetch_feed',
  name: 'RSS Fetch Feed',
  description: 'Fetch and parse an RSS or Atom feed into a list of items',
  version: '1.0.0',

  params: {
    url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'URL of the RSS or Atom feed to fetch',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items to return',
    },
  },

  request: {
    url: (params) => params.url,
    method: 'GET',
    headers: () => ({
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
    }),
  },

  transformResponse: async (response, params) => {
    const xml = await response.text()

    const channelTitle =
      extractTag(xml.split(/<item[\s>]/i)[0].split(/<entry[\s>]/i)[0], 'title') || ''

    const blocks: string[] = []
    const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi
    const entryRegex = /<entry[\s>][\s\S]*?<\/entry>/gi
    const itemMatches = xml.match(itemRegex)
    const entryMatches = xml.match(entryRegex)
    if (itemMatches) blocks.push(...itemMatches)
    if (entryMatches) blocks.push(...entryMatches)

    let items: RssFeedItem[] = blocks.map((block) => ({
      title: extractTag(block, 'title'),
      link: extractLink(block),
      pubDate:
        extractTag(block, 'pubDate') ||
        extractTag(block, 'published') ||
        extractTag(block, 'updated'),
      description: extractTag(block, 'description') || extractTag(block, 'summary'),
    }))

    if (typeof params?.limit === 'number' && params.limit > 0) {
      items = items.slice(0, params.limit)
    }

    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, title: channelTitle },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of parsed feed items' },
    metadata: {
      type: 'json',
      description: 'Feed metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        title: { type: 'string', description: 'Feed (channel) title' },
      },
    },
  },
}
