import { describe, expect, it } from 'vitest'
import { extractFeedTitle, extractItemId, parseFeedItems, parseFeedItemsWithIds } from './parse'

const RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Example Blog</title>
  <link>https://example.com</link>
  <item>
    <title>Second post</title>
    <link>https://example.com/2</link>
    <guid isPermaLink="false">post-2</guid>
    <pubDate>Tue, 16 Jan 2024 09:00:00 GMT</pubDate>
    <description><![CDATA[Body &amp; more]]></description>
  </item>
  <item>
    <title>First post</title>
    <link>https://example.com/1</link>
    <guid isPermaLink="false">post-1</guid>
    <pubDate>Mon, 15 Jan 2024 13:14:15 GMT</pubDate>
    <description>Hello &lt;world&gt;</description>
  </item>
</channel></rss>`

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <entry>
    <title>Atom entry</title>
    <link href="https://example.com/atom-1" rel="alternate"/>
    <id>urn:uuid:atom-1</id>
    <updated>2024-01-15T13:14:15Z</updated>
    <summary>An entry</summary>
  </entry>
</feed>`

describe('rss parse', () => {
  it('reads the channel title without picking up an item title', () => {
    expect(extractFeedTitle(RSS)).toBe('Example Blog')
    expect(extractFeedTitle(ATOM)).toBe('Atom Feed')
  })

  it('parses RSS items and decodes entities and CDATA', () => {
    const items = parseFeedItems(RSS)

    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('Second post')
    expect(items[0].description).toBe('Body & more')
    expect(items[1].description).toBe('Hello <world>')
    expect(items[1].link).toBe('https://example.com/1')
  })

  it('parses Atom entries, reading the link from its href attribute', () => {
    const items = parseFeedItems(ATOM)

    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Atom entry')
    expect(items[0].link).toBe('https://example.com/atom-1')
    expect(items[0].pubDate).toBe('2024-01-15T13:14:15Z')
    expect(items[0].description).toBe('An entry')
  })

  it('prefers guid/id over link for item identity', () => {
    expect(parseFeedItemsWithIds(RSS)[0].id).toBe('post-2')
    expect(parseFeedItemsWithIds(ATOM)[0].id).toBe('urn:uuid:atom-1')
  })

  it('falls back to link, then title, when a feed omits guid', () => {
    const noGuid = '<item><title>T</title><link>https://example.com/x</link></item>'
    expect(extractItemId(noGuid)).toBe('https://example.com/x')

    const titleOnly = '<item><title>Only title</title></item>'
    expect(extractItemId(titleOnly)).toBe('Only title')
  })

  it('returns an empty list for a feed with no items rather than throwing', () => {
    expect(parseFeedItems('<rss><channel><title>Empty</title></channel></rss>')).toEqual([])
    expect(parseFeedItems('not xml at all')).toEqual([])
  })
})
