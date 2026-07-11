/**
 * Request-builder tests for the Extend tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getRunTool } from '@/tools/extend/get_run'
import { parseTool } from '@/tools/extend/parse'

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

describe('Extend tools', () => {
  it('extend_get_run: builds its request', () => {
    expect(getRunTool.id).toBe('extend_get_run')
    expect(getRunTool.request.method).toBe('GET')
    const u =
      typeof getRunTool.request.url === 'function'
        ? (getRunTool.request.url as any)(P)
        : getRunTool.request.url
    expect(String(u)).toContain('api.extend.ai')
    expect(Object.keys(getRunTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getRunTool.transformResponse).toBe('function')
  })

  it('extend_parse: builds its request', () => {
    expect(parseTool.id).toBe('extend_parse')
    expect(parseTool.request.method).toBe('POST')
    const u =
      typeof parseTool.request.url === 'function'
        ? (parseTool.request.url as any)(P)
        : parseTool.request.url
    expect(String(u)).toContain('api.extend.ai')
    expect(Object.keys(parseTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof parseTool.transformResponse).toBe('function')
  })
})
