/**
 * Request-builder tests for the Fireflies tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getTranscriptTool } from '@/tools/fireflies/get_transcript'
import { getUserTool } from '@/tools/fireflies/get_user'
import { listTranscriptsTool } from '@/tools/fireflies/list_transcripts'

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

describe('Fireflies tools', () => {
  it('fireflies_get_transcript: builds its request', () => {
    expect(getTranscriptTool.id).toBe('fireflies_get_transcript')
    expect(getTranscriptTool.request.method).toBe('POST')
    const u =
      typeof getTranscriptTool.request.url === 'function'
        ? (getTranscriptTool.request.url as any)(P)
        : getTranscriptTool.request.url
    expect(String(u)).toContain('api.fireflies.ai/graphql')
    expect(Object.keys(getTranscriptTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getTranscriptTool.transformResponse).toBe('function')
  })

  it('fireflies_get_user: builds its request', () => {
    expect(getUserTool.id).toBe('fireflies_get_user')
    expect(getUserTool.request.method).toBe('POST')
    const u =
      typeof getUserTool.request.url === 'function'
        ? (getUserTool.request.url as any)(P)
        : getUserTool.request.url
    expect(String(u)).toContain('api.fireflies.ai/graphql')
    expect(Object.keys(getUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getUserTool.transformResponse).toBe('function')
  })

  it('fireflies_list_transcripts: builds its request', () => {
    expect(listTranscriptsTool.id).toBe('fireflies_list_transcripts')
    expect(listTranscriptsTool.request.method).toBe('POST')
    const u =
      typeof listTranscriptsTool.request.url === 'function'
        ? (listTranscriptsTool.request.url as any)(P)
        : listTranscriptsTool.request.url
    expect(String(u)).toContain('api.fireflies.ai/graphql')
    expect(Object.keys(listTranscriptsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listTranscriptsTool.transformResponse).toBe('function')
  })
})
