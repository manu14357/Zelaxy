/**
 * Request-builder tests for the Findymail tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { findEmailTool } from '@/tools/findymail/find_email'
import { findFromLinkedinTool } from '@/tools/findymail/find_from_linkedin'
import { verifyEmailTool } from '@/tools/findymail/verify_email'

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

describe('Findymail tools', () => {
  it('findymail_find_email: builds its request', () => {
    expect(findEmailTool.id).toBe('findymail_find_email')
    expect(findEmailTool.request.method).toBe('POST')
    const u =
      typeof findEmailTool.request.url === 'function'
        ? (findEmailTool.request.url as any)(P)
        : findEmailTool.request.url
    expect(String(u)).toContain('findymail')
    expect(Object.keys(findEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof findEmailTool.transformResponse).toBe('function')
  })

  it('findymail_find_from_linkedin: builds its request', () => {
    expect(findFromLinkedinTool.id).toBe('findymail_find_from_linkedin')
    expect(findFromLinkedinTool.request.method).toBe('POST')
    const u =
      typeof findFromLinkedinTool.request.url === 'function'
        ? (findFromLinkedinTool.request.url as any)(P)
        : findFromLinkedinTool.request.url
    expect(String(u)).toContain('findymail')
    expect(Object.keys(findFromLinkedinTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof findFromLinkedinTool.transformResponse).toBe('function')
  })

  it('findymail_verify_email: builds its request', () => {
    expect(verifyEmailTool.id).toBe('findymail_verify_email')
    expect(verifyEmailTool.request.method).toBe('POST')
    const u =
      typeof verifyEmailTool.request.url === 'function'
        ? (verifyEmailTool.request.url as any)(P)
        : verifyEmailTool.request.url
    expect(String(u)).toContain('findymail')
    expect(Object.keys(verifyEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof verifyEmailTool.transformResponse).toBe('function')
  })
})
