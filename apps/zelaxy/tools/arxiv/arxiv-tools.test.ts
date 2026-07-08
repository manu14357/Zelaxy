/**
 * Request-builder tests for the ArXiv tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getAuthorPapersTool } from '@/tools/arxiv/get_author_papers'
import { getPaperTool } from '@/tools/arxiv/get_paper'
import { searchTool } from '@/tools/arxiv/search'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  objectType: 'people',
  objectId: 'o',
  recordId: 'r',
  noteId: 'n',
  taskGid: 'tg',
  authorId: 'a',
  id: 'id',
  paperId: 'p',
  applicationId: 'app',
  environmentId: 'env',
  configurationProfileId: 'cp',
  secretId: 's',
  secretName: 'sec',
  queryExecutionId: 'q',
  pipelineName: 'pipe',
  userName: 'u',
  groupId: 'g',
  query: 'q',
  searchQuery: 'q',
  ids: 'x',
}

describe('ArXiv tools', () => {
  it('arxiv_search: builds its request', () => {
    expect(searchTool.id).toBe('arxiv_search')
    expect(searchTool.request.method).toBe('GET')
    const u =
      typeof searchTool.request.url === 'function'
        ? (searchTool.request.url as any)(P)
        : searchTool.request.url
    expect(String(u)).toContain('export.arxiv.org/api/query')
    expect(Object.keys(searchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof searchTool.transformResponse).toBe('function')
  })

  it('arxiv_get_paper: builds its request', () => {
    expect(getPaperTool.id).toBe('arxiv_get_paper')
    expect(getPaperTool.request.method).toBe('GET')
    const u =
      typeof getPaperTool.request.url === 'function'
        ? (getPaperTool.request.url as any)(P)
        : getPaperTool.request.url
    expect(String(u)).toContain('export.arxiv.org/api/query')
    expect(Object.keys(getPaperTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getPaperTool.transformResponse).toBe('function')
  })

  it('arxiv_get_author_papers: builds its request', () => {
    expect(getAuthorPapersTool.id).toBe('arxiv_get_author_papers')
    expect(getAuthorPapersTool.request.method).toBe('GET')
    const u =
      typeof getAuthorPapersTool.request.url === 'function'
        ? (getAuthorPapersTool.request.url as any)(P)
        : getAuthorPapersTool.request.url
    expect(String(u)).toContain('export.arxiv.org/api/query')
    expect(Object.keys(getAuthorPapersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getAuthorPapersTool.transformResponse).toBe('function')
  })
})
