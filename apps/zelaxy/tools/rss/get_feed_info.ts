import type { RssBaseParams, RssFeedInfoResponse } from '@/tools/rss/types'
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
  const rss = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
  if (rss?.[1].trim()) return decodeXmlEntities(rss[1])
  const atom = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i)
  return atom ? decodeXmlEntities(atom[1]) : ''
}

export const getFeedInfoTool: ToolConfig<RssBaseParams, RssFeedInfoResponse> = {
  id: 'rss_get_feed_info',
  name: 'RSS Get Feed Info',
  description:
    'Fetch an RSS or Atom feed and return its channel-level title, link, and description',
  version: '1.0.0',

  params: {
    url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'URL of the RSS or Atom feed to fetch',
    },
  },

  request: {
    url: (params) => params.url,
    method: 'GET',
    headers: () => ({
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
    }),
  },

  transformResponse: async (response) => {
    const xml = await response.text()
    const header = xml.split(/<item[\s>]/i)[0].split(/<entry[\s>]/i)[0]
    const itemCount =
      (xml.match(/<item[\s>]/gi)?.length ?? 0) + (xml.match(/<entry[\s>]/gi)?.length ?? 0)

    return {
      success: true,
      output: {
        data: {
          title: extractTag(header, 'title'),
          link: extractLink(header),
          description: extractTag(header, 'description') || extractTag(header, 'subtitle'),
        },
        metadata: { itemCount },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Channel title, link, and description' },
    metadata: {
      type: 'json',
      description: 'Feed metadata',
      properties: {
        itemCount: { type: 'number', description: 'Number of items in the feed' },
      },
    },
  },
}
