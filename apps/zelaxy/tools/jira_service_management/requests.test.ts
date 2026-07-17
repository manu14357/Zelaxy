import { describe, expect, it } from 'vitest'
import { JiraServiceManagementBlock } from '@/blocks/blocks/jira_service_management'
import { tools as toolRegistry } from '@/tools/registry'

/**
 * Exercises every JSM tool's request builder. This cannot prove Atlassian accepts the call — only a
 * live site can — but it does prove each tool targets the right host, API surface and path shape,
 * and carries the bearer token. A wrong base URL or a lost token is otherwise invisible until a
 * real request 404s or 401s.
 */
const CLOUD_ID = 'cloud-abc-123'
const TOKEN = 'token-xyz'

const BASE = {
  serviceDesk: `https://api.atlassian.com/ex/jira/${CLOUD_ID}/rest/servicedeskapi`,
  forms: `https://api.atlassian.com/ex/jira/${CLOUD_ID}/forms`,
  assets: `https://api.atlassian.com/ex/jira/${CLOUD_ID}/jsm/assets/workspace/`,
}

// Params broad enough to satisfy any tool's url builder
const PARAMS: Record<string, any> = {
  accessToken: TOKEN,
  cloudId: CLOUD_ID,
  issueIdOrKey: 'SUP-1',
  serviceDeskId: '1',
  requestTypeId: '10',
  approvalId: '5',
  formId: 'form-1',
  projectIdOrKey: 'SUP',
  objectId: '42',
  objectTypeId: '7',
  schemaId: '3',
  organizationId: '2',
  accountIds: ['acc-1'],
  name: 'Acme',
  decision: 'approve',
  body: 'hello',
  qlQuery: 'objectType = "Laptop"',
  attributes: [],
  answers: {},
  targetIssueIdOrKey: 'SUP-2',
  sourceIssueIdOrKey: 'SUP-1',
  requestFieldValues: '{"summary":"x"}',
  id: '31',
}

const access = JiraServiceManagementBlock.tools.access as string[]
const urlTools = access.filter(
  (id) => typeof (toolRegistry as any)[id]?.request?.url === 'function'
)
const directTools = access.filter(
  (id) => typeof (toolRegistry as any)[id]?.directExecution === 'function'
)

describe('JSM tool requests', () => {
  it('covers all 43 tools between url builders and directExecution', () => {
    expect(new Set([...urlTools, ...directTools]).size).toBe(43)
  })

  it('every url-building tool targets api.atlassian.com for this cloudId', () => {
    const wrong = urlTools.filter((id) => {
      const url = (toolRegistry as any)[id].request.url(PARAMS)
      return !url.startsWith(`https://api.atlassian.com/ex/jira/${CLOUD_ID}/`)
    })
    expect(wrong).toEqual([])
  })

  it('every url-building tool hits a known JSM API surface', () => {
    const stray = urlTools.filter((id) => {
      const url = (toolRegistry as any)[id].request.url(PARAMS)
      return (
        !url.startsWith(BASE.serviceDesk) &&
        !url.startsWith(BASE.forms) &&
        !url.startsWith(BASE.assets)
      )
    })
    expect(stray).toEqual([])
  })

  it('every url-building tool sends the bearer token', () => {
    const missing = urlTools.filter((id) => {
      const h = (toolRegistry as any)[id].request.headers(PARAMS)
      return h.Authorization !== `Bearer ${TOKEN}`
    })
    expect(missing).toEqual([])
  })

  it('never leaks an undefined into a built URL', () => {
    const bad = urlTools
      .map((id) => [id, (toolRegistry as any)[id].request.url(PARAMS)] as const)
      .filter(([, url]) => url.includes('undefined') || url.includes('[object Object]'))
    expect(bad).toEqual([])
  })

  it('declares a valid HTTP method for every url-building tool', () => {
    const ok = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    const bad = urlTools.filter((id) => !ok.includes((toolRegistry as any)[id].request.method))
    expect(bad).toEqual([])
  })

  it('routes each group to the correct API surface', () => {
    const url = (id: string) => (toolRegistry as any)[id].request.url(PARAMS)

    expect(url('jira_service_management_get_queues').startsWith(BASE.serviceDesk)).toBe(true)
    expect(url('jira_service_management_get_queues')).toContain('/servicedesk/1/queue')
    expect(url('jira_service_management_get_comments')).toContain('/request/SUP-1/comment')
    expect(url('jira_service_management_get_form')).toContain('/forms')
  })

  it('encodes the issue key rather than interpolating it raw', () => {
    const url = (toolRegistry as any).jira_service_management_get_request.request.url({
      ...PARAMS,
      issueIdOrKey: 'SUP 1/2',
    })
    expect(url).not.toContain('SUP 1/2')
    expect(url).toContain(encodeURIComponent('SUP 1/2'))
  })
})

describe('JSM Assets tools', () => {
  it('use directExecution because resolving the workspace id needs async lookups', () => {
    expect(directTools.length).toBeGreaterThan(0)
    for (const id of directTools) {
      expect(id).toMatch(/object|aql|schema/)
    }
  })
})
