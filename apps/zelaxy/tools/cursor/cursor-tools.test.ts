/**
 * Request-builder tests for the Cursor tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { cursorAddFollowupTool } from '@/tools/cursor/add_followup'
import { cursorGetAgentTool } from '@/tools/cursor/get_agent'
import { cursorGetConversationTool } from '@/tools/cursor/get_conversation'
import { cursorLaunchAgentTool } from '@/tools/cursor/launch_agent'
import { cursorListAgentsTool } from '@/tools/cursor/list_agents'
import { cursorStopAgentTool } from '@/tools/cursor/stop_agent'

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

describe('Cursor tools', () => {
  it('cursor_add_followup: builds its request', () => {
    expect(cursorAddFollowupTool.id).toBe('cursor_add_followup')
    expect(cursorAddFollowupTool.request.method).toBe('POST')
    const u =
      typeof cursorAddFollowupTool.request.url === 'function'
        ? (cursorAddFollowupTool.request.url as any)(P)
        : cursorAddFollowupTool.request.url
    expect(String(u)).toContain('api.cursor.com/v0')
    expect(Object.keys(cursorAddFollowupTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cursorAddFollowupTool.transformResponse).toBe('function')
  })

  it('cursor_get_agent: builds its request', () => {
    expect(cursorGetAgentTool.id).toBe('cursor_get_agent')
    expect(cursorGetAgentTool.request.method).toBe('GET')
    const u =
      typeof cursorGetAgentTool.request.url === 'function'
        ? (cursorGetAgentTool.request.url as any)(P)
        : cursorGetAgentTool.request.url
    expect(String(u)).toContain('api.cursor.com/v0')
    expect(Object.keys(cursorGetAgentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cursorGetAgentTool.transformResponse).toBe('function')
  })

  it('cursor_get_conversation: builds its request', () => {
    expect(cursorGetConversationTool.id).toBe('cursor_get_conversation')
    expect(cursorGetConversationTool.request.method).toBe('GET')
    const u =
      typeof cursorGetConversationTool.request.url === 'function'
        ? (cursorGetConversationTool.request.url as any)(P)
        : cursorGetConversationTool.request.url
    expect(String(u)).toContain('api.cursor.com/v0')
    expect(Object.keys(cursorGetConversationTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cursorGetConversationTool.transformResponse).toBe('function')
  })

  it('cursor_launch_agent: builds its request', () => {
    expect(cursorLaunchAgentTool.id).toBe('cursor_launch_agent')
    expect(cursorLaunchAgentTool.request.method).toBe('POST')
    const u =
      typeof cursorLaunchAgentTool.request.url === 'function'
        ? (cursorLaunchAgentTool.request.url as any)(P)
        : cursorLaunchAgentTool.request.url
    expect(String(u)).toContain('api.cursor.com/v0')
    expect(Object.keys(cursorLaunchAgentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cursorLaunchAgentTool.transformResponse).toBe('function')
  })

  it('cursor_list_agents: builds its request', () => {
    expect(cursorListAgentsTool.id).toBe('cursor_list_agents')
    expect(cursorListAgentsTool.request.method).toBe('GET')
    const u =
      typeof cursorListAgentsTool.request.url === 'function'
        ? (cursorListAgentsTool.request.url as any)(P)
        : cursorListAgentsTool.request.url
    expect(String(u)).toContain('api.cursor.com/v0')
    expect(Object.keys(cursorListAgentsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cursorListAgentsTool.transformResponse).toBe('function')
  })

  it('cursor_stop_agent: builds its request', () => {
    expect(cursorStopAgentTool.id).toBe('cursor_stop_agent')
    expect(cursorStopAgentTool.request.method).toBe('POST')
    const u =
      typeof cursorStopAgentTool.request.url === 'function'
        ? (cursorStopAgentTool.request.url as any)(P)
        : cursorStopAgentTool.request.url
    expect(String(u)).toContain('api.cursor.com/v0')
    expect(Object.keys(cursorStopAgentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cursorStopAgentTool.transformResponse).toBe('function')
  })
})
