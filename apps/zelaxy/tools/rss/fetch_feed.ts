import { extractFeedTitle, parseFeedItems } from '@/tools/rss/parse'
import type { RssFeedItem, RssFeedResponse, RssFetchFeedParams } from '@/tools/rss/types'
import type { ToolConfig } from '@/tools/types'

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

    const channelTitle = extractFeedTitle(xml)
    let items: RssFeedItem[] = parseFeedItems(xml)

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
