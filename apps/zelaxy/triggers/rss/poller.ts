import { RssIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const rssPollingTrigger: TriggerConfig = {
  id: 'rss_poller',
  name: 'RSS Feed',
  provider: 'rss',
  description: 'Trigger workflow when a new item is published to an RSS or Atom feed',
  version: '1.0.0',
  icon: RssIcon,

  configFields: {
    feedUrl: {
      type: 'string',
      label: 'Feed URL',
      placeholder: 'https://example.com/feed.xml',
      description: 'The RSS or Atom feed to watch. Zelaxy polls it and runs once per new item.',
      required: true,
    },
  },

  // Flattened by formatWebhookInput's rss case
  outputs: {
    title: { type: 'string', description: 'Item title (also used as the workflow input)' },
    link: { type: 'string', description: 'Item link' },
    description: { type: 'string', description: 'Item description or summary' },
    pub_date: { type: 'string', description: 'Item publication date as given by the feed' },
    item_id: { type: 'string', description: 'Stable item identifier (guid, id, or link)' },
    feed_url: { type: 'string', description: 'The feed the item came from' },
    item: { type: 'object', description: 'The parsed item object' },
    raw: { type: 'object', description: 'Complete payload as delivered by the poller' },
  },

  instructions: [
    'Enter the <strong>Feed URL</strong> of any RSS or Atom feed above.',
    'Unlike the other triggers, this one has no webhook URL to register — Zelaxy polls the feed for you.',
    'The workflow runs <strong>once per new item</strong>, oldest first.',
    '<strong>Connecting a feed does not replay its history:</strong> the first poll records what is already published and triggers nothing. Only items that appear afterwards start a run.',
    'Items are identified by their <code>guid</code> (or <code>id</code>/link), so editing a title will not re-trigger.',
  ],

  samplePayload: {
    feedUrl: 'https://example.com/feed.xml',
    item: {
      id: 'https://example.com/posts/hello-world',
      title: 'Hello world',
      link: 'https://example.com/posts/hello-world',
      pubDate: 'Mon, 15 Jan 2024 13:14:15 GMT',
      description: 'Our first post.',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
