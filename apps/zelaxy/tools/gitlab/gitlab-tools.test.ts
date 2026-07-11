/**
 * Request-builder tests for the GitLab tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { createIssueTool } from '@/tools/gitlab/create_issue'
import { getFileTool } from '@/tools/gitlab/get_file'
import { getProjectTool } from '@/tools/gitlab/get_project'
import { listIssuesTool } from '@/tools/gitlab/list_issues'
import { listProjectsTool } from '@/tools/gitlab/list_projects'

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

describe('GitLab tools', () => {
  it('gitlab_create_issue: builds its request', () => {
    expect(createIssueTool.id).toBe('gitlab_create_issue')
    expect(createIssueTool.request.method).toBe('POST')
    const u =
      typeof createIssueTool.request.url === 'function'
        ? (createIssueTool.request.url as any)(P)
        : createIssueTool.request.url
    expect(String(u)).toContain('gitlab.com/api/v4')
    expect(Object.keys(createIssueTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof createIssueTool.transformResponse).toBe('function')
  })

  it('gitlab_get_file: builds its request', () => {
    expect(getFileTool.id).toBe('gitlab_get_file')
    expect(getFileTool.request.method).toBe('GET')
    const u =
      typeof getFileTool.request.url === 'function'
        ? (getFileTool.request.url as any)(P)
        : getFileTool.request.url
    expect(String(u)).toContain('gitlab.com/api/v4')
    expect(Object.keys(getFileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getFileTool.transformResponse).toBe('function')
  })

  it('gitlab_get_project: builds its request', () => {
    expect(getProjectTool.id).toBe('gitlab_get_project')
    expect(getProjectTool.request.method).toBe('GET')
    const u =
      typeof getProjectTool.request.url === 'function'
        ? (getProjectTool.request.url as any)(P)
        : getProjectTool.request.url
    expect(String(u)).toContain('gitlab.com/api/v4')
    expect(Object.keys(getProjectTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getProjectTool.transformResponse).toBe('function')
  })

  it('gitlab_list_issues: builds its request', () => {
    expect(listIssuesTool.id).toBe('gitlab_list_issues')
    expect(listIssuesTool.request.method).toBe('GET')
    const u =
      typeof listIssuesTool.request.url === 'function'
        ? (listIssuesTool.request.url as any)(P)
        : listIssuesTool.request.url
    expect(String(u)).toContain('gitlab.com/api/v4')
    expect(Object.keys(listIssuesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listIssuesTool.transformResponse).toBe('function')
  })

  it('gitlab_list_projects: builds its request', () => {
    expect(listProjectsTool.id).toBe('gitlab_list_projects')
    expect(listProjectsTool.request.method).toBe('GET')
    const u =
      typeof listProjectsTool.request.url === 'function'
        ? (listProjectsTool.request.url as any)(P)
        : listProjectsTool.request.url
    expect(String(u)).toContain('gitlab.com/api/v4')
    expect(Object.keys(listProjectsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listProjectsTool.transformResponse).toBe('function')
  })
})
