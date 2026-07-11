/**
 * Request-builder tests for the File tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { fileAppendTool } from '@/tools/file/append'
import { fileParserTool } from '@/tools/file/parser'
import { fileWriteTool } from '@/tools/file/write'

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

describe('File tools', () => {
  it('file_append: builds its request', () => {
    expect(fileAppendTool.id).toBe('file_append')
    expect(fileAppendTool.request.method).toBe('POST')
    const u =
      typeof fileAppendTool.request.url === 'function'
        ? (fileAppendTool.request.url as any)(P)
        : fileAppendTool.request.url
    expect(String(u)).toContain('/api/files/')
    expect(Object.keys(fileAppendTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof fileAppendTool.transformResponse).toBe('function')
  })

  it('file_parser: builds its request', () => {
    expect(fileParserTool.id).toBe('file_parser')
    expect(fileParserTool.request.method).toBe('POST')
    const u =
      typeof fileParserTool.request.url === 'function'
        ? (fileParserTool.request.url as any)(P)
        : fileParserTool.request.url
    expect(String(u)).toContain('/api/files/')
    expect(Object.keys(fileParserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof fileParserTool.transformResponse).toBe('function')
  })

  it('file_write: builds its request', () => {
    expect(fileWriteTool.id).toBe('file_write')
    expect(fileWriteTool.request.method).toBe('POST')
    const u =
      typeof fileWriteTool.request.url === 'function'
        ? (fileWriteTool.request.url as any)(P)
        : fileWriteTool.request.url
    expect(String(u)).toContain('/api/files/')
    expect(Object.keys(fileWriteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof fileWriteTool.transformResponse).toBe('function')
  })
})
