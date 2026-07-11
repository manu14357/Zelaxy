/**
 * Request-builder tests for the GitHub tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { commentTool } from '@/tools/github/comment'
import { latestCommitTool } from '@/tools/github/latest_commit'
import { prTool } from '@/tools/github/pr'
import { repoInfoTool } from '@/tools/github/repo_info'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  owner: 'o',
  repo: 'r',
  issueNumber: '1',
  pullNumber: '1',
  body: 'b',
  title: 't',
  projectId: 'p',
  filePath: 'f.txt',
  ref: 'main',
  branch: 'main',
  messageId: 'm',
  threadId: 'th',
  calendarId: 'primary',
  eventId: 'e',
  documentId: 'd',
  customerId: '123',
  datasetId: 'ds',
  tableId: 'tb',
  volumeId: 'v',
  resourceName: 'people/c1',
  personFields: 'names',
  query: 'q',
  attendees: 'a@x.com',
  contactId: 'c',
  content: 'c',
  campaignId: 'cmp',
  sql: 'SELECT 1',
  id: 'id',
  name: 'n',
  to: 'a@x.com',
  subject: 's',
  maxResults: 5,
  pageToken: 'pt',
  summary: 'sum',
  startDateTime: '2026-01-01T00:00:00Z',
  endDateTime: '2026-01-01T01:00:00Z',
}

describe('GitHub tools', () => {
  it('github_comment: builds its request', () => {
    expect(commentTool.id).toBe('github_comment')
    expect(commentTool.request.method).toBe('POST')
    const u =
      typeof commentTool.request.url === 'function'
        ? (commentTool.request.url as any)(P)
        : commentTool.request.url
    expect(String(u)).toContain('api.github.com/repos')
    expect(Object.keys(commentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof commentTool.transformResponse).toBe('function')
  })

  it('github_latest_commit: builds its request', () => {
    expect(latestCommitTool.id).toBe('github_latest_commit')
    expect(latestCommitTool.request.method).toBe('GET')
    const u =
      typeof latestCommitTool.request.url === 'function'
        ? (latestCommitTool.request.url as any)(P)
        : latestCommitTool.request.url
    expect(String(u)).toContain('api.github.com/repos')
    expect(Object.keys(latestCommitTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof latestCommitTool.transformResponse).toBe('function')
  })

  it('github_pr: builds its request', () => {
    expect(prTool.id).toBe('github_pr')
    expect(prTool.request.method).toBe('GET')
    const u =
      typeof prTool.request.url === 'function' ? (prTool.request.url as any)(P) : prTool.request.url
    expect(String(u)).toContain('api.github.com/repos')
    expect(Object.keys(prTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof prTool.transformResponse).toBe('function')
  })

  it('github_repo_info: builds its request', () => {
    expect(repoInfoTool.id).toBe('github_repo_info')
    expect(repoInfoTool.request.method).toBe('GET')
    const u =
      typeof repoInfoTool.request.url === 'function'
        ? (repoInfoTool.request.url as any)(P)
        : repoInfoTool.request.url
    expect(String(u)).toContain('api.github.com/repos')
    expect(Object.keys(repoInfoTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof repoInfoTool.transformResponse).toBe('function')
  })
})
