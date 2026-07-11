/**
 * Request-builder tests for the Evernote tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { evernoteCreateNoteTool } from '@/tools/evernote/create_note'
import { evernoteDeleteNoteTool } from '@/tools/evernote/delete_note'
import { evernoteGetNoteTool } from '@/tools/evernote/get_note'
import { evernoteListNotebooksTool } from '@/tools/evernote/list_notebooks'
import { evernoteSearchNotesTool } from '@/tools/evernote/search_notes'
import { evernoteUpdateNoteTool } from '@/tools/evernote/update_note'

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

describe('Evernote tools', () => {
  it('evernote_create_note: builds its request', () => {
    expect(evernoteCreateNoteTool.id).toBe('evernote_create_note')
    expect(evernoteCreateNoteTool.request.method).toBe('POST')
    const u =
      typeof evernoteCreateNoteTool.request.url === 'function'
        ? (evernoteCreateNoteTool.request.url as any)(P)
        : evernoteCreateNoteTool.request.url
    expect(String(u)).toContain('/api/tools/evernote/')
    expect(Object.keys(evernoteCreateNoteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof evernoteCreateNoteTool.transformResponse).toBe('function')
  })

  it('evernote_delete_note: builds its request', () => {
    expect(evernoteDeleteNoteTool.id).toBe('evernote_delete_note')
    expect(evernoteDeleteNoteTool.request.method).toBe('POST')
    const u =
      typeof evernoteDeleteNoteTool.request.url === 'function'
        ? (evernoteDeleteNoteTool.request.url as any)(P)
        : evernoteDeleteNoteTool.request.url
    expect(String(u)).toContain('/api/tools/evernote/')
    expect(Object.keys(evernoteDeleteNoteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof evernoteDeleteNoteTool.transformResponse).toBe('function')
  })

  it('evernote_get_note: builds its request', () => {
    expect(evernoteGetNoteTool.id).toBe('evernote_get_note')
    expect(evernoteGetNoteTool.request.method).toBe('POST')
    const u =
      typeof evernoteGetNoteTool.request.url === 'function'
        ? (evernoteGetNoteTool.request.url as any)(P)
        : evernoteGetNoteTool.request.url
    expect(String(u)).toContain('/api/tools/evernote/')
    expect(Object.keys(evernoteGetNoteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof evernoteGetNoteTool.transformResponse).toBe('function')
  })

  it('evernote_list_notebooks: builds its request', () => {
    expect(evernoteListNotebooksTool.id).toBe('evernote_list_notebooks')
    expect(evernoteListNotebooksTool.request.method).toBe('POST')
    const u =
      typeof evernoteListNotebooksTool.request.url === 'function'
        ? (evernoteListNotebooksTool.request.url as any)(P)
        : evernoteListNotebooksTool.request.url
    expect(String(u)).toContain('/api/tools/evernote/')
    expect(Object.keys(evernoteListNotebooksTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof evernoteListNotebooksTool.transformResponse).toBe('function')
  })

  it('evernote_search_notes: builds its request', () => {
    expect(evernoteSearchNotesTool.id).toBe('evernote_search_notes')
    expect(evernoteSearchNotesTool.request.method).toBe('POST')
    const u =
      typeof evernoteSearchNotesTool.request.url === 'function'
        ? (evernoteSearchNotesTool.request.url as any)(P)
        : evernoteSearchNotesTool.request.url
    expect(String(u)).toContain('/api/tools/evernote/')
    expect(Object.keys(evernoteSearchNotesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof evernoteSearchNotesTool.transformResponse).toBe('function')
  })

  it('evernote_update_note: builds its request', () => {
    expect(evernoteUpdateNoteTool.id).toBe('evernote_update_note')
    expect(evernoteUpdateNoteTool.request.method).toBe('POST')
    const u =
      typeof evernoteUpdateNoteTool.request.url === 'function'
        ? (evernoteUpdateNoteTool.request.url as any)(P)
        : evernoteUpdateNoteTool.request.url
    expect(String(u)).toContain('/api/tools/evernote/')
    expect(Object.keys(evernoteUpdateNoteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof evernoteUpdateNoteTool.transformResponse).toBe('function')
  })
})
