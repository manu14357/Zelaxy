/**
 * Request-builder tests for the Ashby tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ashbyCreateCandidateTool } from '@/tools/ashby/create_candidate'
import { ashbyGetCandidateTool } from '@/tools/ashby/get_candidate'
import { ashbyGetJobPostingsTool } from '@/tools/ashby/get_job_postings'
import { ashbyListApplicationsTool } from '@/tools/ashby/list_applications'
import { ashbyListCandidatesTool } from '@/tools/ashby/list_candidates'
import { ashbyUpdateCandidateTool } from '@/tools/ashby/update_candidate'

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

describe('Ashby tools', () => {
  it('ashby_create_candidate: builds its request', () => {
    expect(ashbyCreateCandidateTool.id).toBe('ashby_create_candidate')
    expect(ashbyCreateCandidateTool.request.method).toBe('POST')
    const u =
      typeof ashbyCreateCandidateTool.request.url === 'function'
        ? (ashbyCreateCandidateTool.request.url as any)(P)
        : ashbyCreateCandidateTool.request.url
    expect(String(u)).toContain('api.ashbyhq.com')
    expect(Object.keys(ashbyCreateCandidateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof ashbyCreateCandidateTool.transformResponse).toBe('function')
  })

  it('ashby_get_candidate: builds its request', () => {
    expect(ashbyGetCandidateTool.id).toBe('ashby_get_candidate')
    expect(ashbyGetCandidateTool.request.method).toBe('POST')
    const u =
      typeof ashbyGetCandidateTool.request.url === 'function'
        ? (ashbyGetCandidateTool.request.url as any)(P)
        : ashbyGetCandidateTool.request.url
    expect(String(u)).toContain('api.ashbyhq.com')
    expect(Object.keys(ashbyGetCandidateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof ashbyGetCandidateTool.transformResponse).toBe('function')
  })

  it('ashby_get_job_postings: builds its request', () => {
    expect(ashbyGetJobPostingsTool.id).toBe('ashby_get_job_postings')
    expect(ashbyGetJobPostingsTool.request.method).toBe('POST')
    const u =
      typeof ashbyGetJobPostingsTool.request.url === 'function'
        ? (ashbyGetJobPostingsTool.request.url as any)(P)
        : ashbyGetJobPostingsTool.request.url
    expect(String(u)).toContain('api.ashbyhq.com')
    expect(Object.keys(ashbyGetJobPostingsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof ashbyGetJobPostingsTool.transformResponse).toBe('function')
  })

  it('ashby_list_applications: builds its request', () => {
    expect(ashbyListApplicationsTool.id).toBe('ashby_list_applications')
    expect(ashbyListApplicationsTool.request.method).toBe('POST')
    const u =
      typeof ashbyListApplicationsTool.request.url === 'function'
        ? (ashbyListApplicationsTool.request.url as any)(P)
        : ashbyListApplicationsTool.request.url
    expect(String(u)).toContain('api.ashbyhq.com')
    expect(Object.keys(ashbyListApplicationsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof ashbyListApplicationsTool.transformResponse).toBe('function')
  })

  it('ashby_list_candidates: builds its request', () => {
    expect(ashbyListCandidatesTool.id).toBe('ashby_list_candidates')
    expect(ashbyListCandidatesTool.request.method).toBe('POST')
    const u =
      typeof ashbyListCandidatesTool.request.url === 'function'
        ? (ashbyListCandidatesTool.request.url as any)(P)
        : ashbyListCandidatesTool.request.url
    expect(String(u)).toContain('api.ashbyhq.com')
    expect(Object.keys(ashbyListCandidatesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof ashbyListCandidatesTool.transformResponse).toBe('function')
  })

  it('ashby_update_candidate: builds its request', () => {
    expect(ashbyUpdateCandidateTool.id).toBe('ashby_update_candidate')
    expect(ashbyUpdateCandidateTool.request.method).toBe('POST')
    const u =
      typeof ashbyUpdateCandidateTool.request.url === 'function'
        ? (ashbyUpdateCandidateTool.request.url as any)(P)
        : ashbyUpdateCandidateTool.request.url
    expect(String(u)).toContain('api.ashbyhq.com')
    expect(Object.keys(ashbyUpdateCandidateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof ashbyUpdateCandidateTool.transformResponse).toBe('function')
  })
})
