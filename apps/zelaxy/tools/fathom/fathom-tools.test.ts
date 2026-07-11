/**
 * Request-builder tests for the Fathom tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getSummaryTool } from '@/tools/fathom/get_summary'
import { getTranscriptTool } from '@/tools/fathom/get_transcript'
import { listMeetingsTool } from '@/tools/fathom/list_meetings'
import { listTeamMembersTool } from '@/tools/fathom/list_team_members'
import { listTeamsTool } from '@/tools/fathom/list_teams'

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

describe('Fathom tools', () => {
  it('fathom_get_summary: builds its request', () => {
    expect(getSummaryTool.id).toBe('fathom_get_summary')
    expect(getSummaryTool.request.method).toBe('GET')
    const u =
      typeof getSummaryTool.request.url === 'function'
        ? (getSummaryTool.request.url as any)(P)
        : getSummaryTool.request.url
    expect(String(u)).toContain('api.fathom.ai/external/v1')
    expect(Object.keys(getSummaryTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getSummaryTool.transformResponse).toBe('function')
  })

  it('fathom_get_transcript: builds its request', () => {
    expect(getTranscriptTool.id).toBe('fathom_get_transcript')
    expect(getTranscriptTool.request.method).toBe('GET')
    const u =
      typeof getTranscriptTool.request.url === 'function'
        ? (getTranscriptTool.request.url as any)(P)
        : getTranscriptTool.request.url
    expect(String(u)).toContain('api.fathom.ai/external/v1')
    expect(Object.keys(getTranscriptTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getTranscriptTool.transformResponse).toBe('function')
  })

  it('fathom_list_meetings: builds its request', () => {
    expect(listMeetingsTool.id).toBe('fathom_list_meetings')
    expect(listMeetingsTool.request.method).toBe('GET')
    const u =
      typeof listMeetingsTool.request.url === 'function'
        ? (listMeetingsTool.request.url as any)(P)
        : listMeetingsTool.request.url
    expect(String(u)).toContain('api.fathom.ai/external/v1')
    expect(Object.keys(listMeetingsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listMeetingsTool.transformResponse).toBe('function')
  })

  it('fathom_list_team_members: builds its request', () => {
    expect(listTeamMembersTool.id).toBe('fathom_list_team_members')
    expect(listTeamMembersTool.request.method).toBe('GET')
    const u =
      typeof listTeamMembersTool.request.url === 'function'
        ? (listTeamMembersTool.request.url as any)(P)
        : listTeamMembersTool.request.url
    expect(String(u)).toContain('api.fathom.ai/external/v1')
    expect(Object.keys(listTeamMembersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listTeamMembersTool.transformResponse).toBe('function')
  })

  it('fathom_list_teams: builds its request', () => {
    expect(listTeamsTool.id).toBe('fathom_list_teams')
    expect(listTeamsTool.request.method).toBe('GET')
    const u =
      typeof listTeamsTool.request.url === 'function'
        ? (listTeamsTool.request.url as any)(P)
        : listTeamsTool.request.url
    expect(String(u)).toContain('api.fathom.ai/external/v1')
    expect(Object.keys(listTeamsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listTeamsTool.transformResponse).toBe('function')
  })
})
