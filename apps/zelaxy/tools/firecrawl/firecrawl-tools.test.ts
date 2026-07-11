/**
 * Request-builder tests for the Firecrawl tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { crawlTool } from '@/tools/firecrawl/crawl'
import { scrapeTool } from '@/tools/firecrawl/scrape'
import { searchTool } from '@/tools/firecrawl/search'

const P: any = {
  apiKey: 'k',
  noteGuid: 'ng',
  notebookGuid: 'nb',
  query: 'q',
  runId: 'r',
  documentId: 'd',
  meetingId: 'm',
  recordingId: 'rec',
  teamId: 't',
  email: 'e@x.com',
  linkedinUrl: 'https://linkedin.com/in/x',
  path: '/p',
  content: 'c',
  fileName: 'f',
  url: 'https://x.com',
  transcriptId: 'tr',
  generationId: 'g',
  id: 'id',
  name: 'n',
  prompt: 'p',
  text: 't',
  urls: 'https://x.com',
  input: 'i',
}

describe('Firecrawl tools', () => {
  it('firecrawl_crawl: builds its request', () => {
    expect(crawlTool.id).toBe('firecrawl_crawl')
    expect(crawlTool.request.method).toBe('POST')
    const u =
      typeof crawlTool.request.url === 'function'
        ? (crawlTool.request.url as any)(P)
        : crawlTool.request.url
    expect(String(u)).toContain('api.firecrawl.dev/v1')
    expect(Object.keys(crawlTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof crawlTool.transformResponse).toBe('function')
  })

  it('firecrawl_scrape: builds its request', () => {
    expect(scrapeTool.id).toBe('firecrawl_scrape')
    expect(scrapeTool.request.method).toBe('POST')
    const u =
      typeof scrapeTool.request.url === 'function'
        ? (scrapeTool.request.url as any)(P)
        : scrapeTool.request.url
    expect(String(u)).toContain('api.firecrawl.dev/v1')
    expect(Object.keys(scrapeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof scrapeTool.transformResponse).toBe('function')
  })

  it('firecrawl_search: builds its request', () => {
    expect(searchTool.id).toBe('firecrawl_search')
    expect(searchTool.request.method).toBe('POST')
    const u =
      typeof searchTool.request.url === 'function'
        ? (searchTool.request.url as any)(P)
        : searchTool.request.url
    expect(String(u)).toContain('api.firecrawl.dev/v1')
    expect(Object.keys(searchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof searchTool.transformResponse).toBe('function')
  })
})
