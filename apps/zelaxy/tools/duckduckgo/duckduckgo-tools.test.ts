/**
 * Request-builder tests for the DuckDuckGo tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { imagesSearchTool } from '@/tools/duckduckgo/images_search'
import { newsSearchTool } from '@/tools/duckduckgo/news_search'
import { textSearchTool } from '@/tools/duckduckgo/text_search'

const P: any = {
  apiKey: 'k',
  baseUrl: 'https://mydspy.example.com',
  url: 'https://mycluster.es.local:9200',
  index: 'idx',
  linkId: 'l',
  domain: 'x.com',
  query: 'q',
  email: 'e@x.com',
  documentId: 'd',
  id: 'id',
  input: 'hello',
  text: 'hi',
  voiceId: 'v',
  personId: 'p',
  companyName: 'Acme',
  phone: '123',
  resultId: 'r',
  batchId: 'b',
  linkedinUrl: 'https://linkedin.com/in/x',
  name: 'n',
  fullName: 'n',
  model: 'm',
}

describe('DuckDuckGo tools', () => {
  it('duckduckgo_images_search: builds its request', () => {
    expect(imagesSearchTool.id).toBe('duckduckgo_images_search')
    expect(imagesSearchTool.request.method).toBe('GET')
    const u =
      typeof imagesSearchTool.request.url === 'function'
        ? (imagesSearchTool.request.url as any)(P)
        : imagesSearchTool.request.url
    expect(String(u)).toContain('duckduckgo.com')
    expect(Object.keys(imagesSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof imagesSearchTool.transformResponse).toBe('function')
  })

  it('duckduckgo_news_search: builds its request', () => {
    expect(newsSearchTool.id).toBe('duckduckgo_news_search')
    expect(newsSearchTool.request.method).toBe('GET')
    const u =
      typeof newsSearchTool.request.url === 'function'
        ? (newsSearchTool.request.url as any)(P)
        : newsSearchTool.request.url
    expect(String(u)).toContain('duckduckgo.com')
    expect(Object.keys(newsSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof newsSearchTool.transformResponse).toBe('function')
  })

  it('duckduckgo_text_search: builds its request', () => {
    expect(textSearchTool.id).toBe('duckduckgo_text_search')
    expect(textSearchTool.request.method).toBe('GET')
    const u =
      typeof textSearchTool.request.url === 'function'
        ? (textSearchTool.request.url as any)(P)
        : textSearchTool.request.url
    expect(String(u)).toContain('duckduckgo.com')
    expect(Object.keys(textSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof textSearchTool.transformResponse).toBe('function')
  })
})
