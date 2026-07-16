import { RssIcon } from '@/components/icons/rss-icon'
import type { BlockConfig } from '@/blocks/types'
import type { RssResponse } from '@/tools/rss/types'

export const RssBlock: BlockConfig<RssResponse> = {
  type: 'rss',
  name: 'RSS',
  description: 'Fetch and parse RSS and Atom feeds',
  longDescription:
    'Fetch an RSS or Atom feed by URL and parse it into a list of items (title, link, date, description), or read channel-level feed info. No authentication required.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F26522',
  icon: RssIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Fetch feed', id: 'rss_fetch_feed' },
        { label: 'Get feed info', id: 'rss_get_feed_info' },
      ],
      value: () => 'rss_fetch_feed',
    },
    {
      id: 'url',
      title: 'Feed URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com/feed.xml',
      required: true,
      condition: { field: 'operation', value: ['rss_fetch_feed', 'rss_get_feed_info'] },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'rss_fetch_feed' },
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'rss',
      availableTriggers: ['rss_poller'],
    },
  ],
  tools: {
    access: ['rss_fetch_feed', 'rss_get_feed_info'],
    config: {
      tool: (params) => params.operation || 'rss_fetch_feed',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    url: { type: 'string', description: 'RSS or Atom feed URL' },
    limit: { type: 'number', description: 'Maximum number of items to return' },
  },
  outputs: {
    data: { type: 'json', description: 'Parsed feed items or feed info' },
    metadata: { type: 'json', description: 'Response metadata' },
    title: { type: 'string', description: 'Item title (trigger events)' },
    link: { type: 'string', description: 'Item link' },
    pub_date: { type: 'string', description: 'Item publication date' },
    item_id: { type: 'string', description: 'Stable item identifier' },
    feed_url: { type: 'string', description: 'The feed the item came from' },
  },
  triggers: {
    enabled: true,
    available: ['rss_poller'],
  },
}
