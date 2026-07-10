/**
 * Request-builder tests for the Context.dev tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { crawlTool } from '@/tools/context_dev/crawl'
import { scrapeMarkdownTool } from '@/tools/context_dev/scrape_markdown'
import { searchTool } from '@/tools/context_dev/search'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  userId: 'u',
  organizationId: 'org',
  sessionId: 's',
  zoneId: 'z',
  recordId: 'r',
  host: 'https://h.clickhouse.cloud:8443',
  sql: 'SELECT 1',
  username: 'u',
  password: 'p',
  deploymentUrl: 'https://a.convex.cloud',
  adminKey: 'ak',
  path: 'p',
  url: 'https://example.com/page',
  query: 'q',
  agentId: 'ag',
  pageId: 'pg',
  stackName: 'st',
  id: 'id',
}

describe('Context.dev tools', () => {
  it('context_dev_crawl: builds its request', () => {
    expect(crawlTool.id).toBe('context_dev_crawl')
    expect(crawlTool.request.method).toBe('POST')
    const u =
      typeof crawlTool.request.url === 'function'
        ? (crawlTool.request.url as any)(P)
        : crawlTool.request.url
    expect(String(u)).toContain('api.context.dev')
    expect(Object.keys(crawlTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof crawlTool.transformResponse).toBe('function')
  })

  it('context_dev_scrape_markdown: builds its request', () => {
    expect(scrapeMarkdownTool.id).toBe('context_dev_scrape_markdown')
    expect(scrapeMarkdownTool.request.method).toBe('GET')
    const u =
      typeof scrapeMarkdownTool.request.url === 'function'
        ? (scrapeMarkdownTool.request.url as any)(P)
        : scrapeMarkdownTool.request.url
    expect(String(u)).toContain('api.context.dev')
    expect(Object.keys(scrapeMarkdownTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof scrapeMarkdownTool.transformResponse).toBe('function')
  })

  it('context_dev_search: builds its request', () => {
    expect(searchTool.id).toBe('context_dev_search')
    expect(searchTool.request.method).toBe('POST')
    const u =
      typeof searchTool.request.url === 'function'
        ? (searchTool.request.url as any)(P)
        : searchTool.request.url
    expect(String(u)).toContain('api.context.dev')
    expect(Object.keys(searchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof searchTool.transformResponse).toBe('function')
  })
})
