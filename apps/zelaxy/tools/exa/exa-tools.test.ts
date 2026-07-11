/**
 * Request-builder tests for the Exa tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { answerTool } from '@/tools/exa/answer'
import { findSimilarLinksTool } from '@/tools/exa/find_similar_links'
import { getContentsTool } from '@/tools/exa/get_contents'
import { researchTool } from '@/tools/exa/research'
import { searchTool } from '@/tools/exa/search'

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

describe('Exa tools', () => {
  it('exa_answer: builds its request', () => {
    expect(answerTool.id).toBe('exa_answer')
    expect(answerTool.request.method).toBe('POST')
    const u =
      typeof answerTool.request.url === 'function'
        ? (answerTool.request.url as any)(P)
        : answerTool.request.url
    expect(String(u)).toContain('api.exa.ai')
    expect(Object.keys(answerTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof answerTool.transformResponse).toBe('function')
  })

  it('exa_find_similar_links: builds its request', () => {
    expect(findSimilarLinksTool.id).toBe('exa_find_similar_links')
    expect(findSimilarLinksTool.request.method).toBe('POST')
    const u =
      typeof findSimilarLinksTool.request.url === 'function'
        ? (findSimilarLinksTool.request.url as any)(P)
        : findSimilarLinksTool.request.url
    expect(String(u)).toContain('api.exa.ai')
    expect(Object.keys(findSimilarLinksTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof findSimilarLinksTool.transformResponse).toBe('function')
  })

  it('exa_get_contents: builds its request', () => {
    expect(getContentsTool.id).toBe('exa_get_contents')
    expect(getContentsTool.request.method).toBe('POST')
    const u =
      typeof getContentsTool.request.url === 'function'
        ? (getContentsTool.request.url as any)(P)
        : getContentsTool.request.url
    expect(String(u)).toContain('api.exa.ai')
    expect(Object.keys(getContentsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getContentsTool.transformResponse).toBe('function')
  })

  it('exa_research: builds its request', () => {
    expect(researchTool.id).toBe('exa_research')
    expect(researchTool.request.method).toBe('POST')
    const u =
      typeof researchTool.request.url === 'function'
        ? (researchTool.request.url as any)(P)
        : researchTool.request.url
    expect(String(u)).toContain('api.exa.ai')
    expect(Object.keys(researchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof researchTool.transformResponse).toBe('function')
  })

  it('exa_search: builds its request', () => {
    expect(searchTool.id).toBe('exa_search')
    expect(searchTool.request.method).toBe('POST')
    const u =
      typeof searchTool.request.url === 'function'
        ? (searchTool.request.url as any)(P)
        : searchTool.request.url
    expect(String(u)).toContain('api.exa.ai')
    expect(Object.keys(searchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof searchTool.transformResponse).toBe('function')
  })
})
