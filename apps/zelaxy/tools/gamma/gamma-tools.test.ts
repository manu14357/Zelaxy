/**
 * Request-builder tests for the Gamma tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  gammaCheckStatusTool,
  gammaGenerateFromTemplateTool,
  gammaGenerateTool,
  gammaListFoldersTool,
  gammaListThemesTool,
} from '@/tools/gamma'

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

describe('Gamma tools', () => {
  it('gamma_generate: builds its request', () => {
    expect(gammaGenerateTool.id).toBe('gamma_generate')
    expect(gammaGenerateTool.request.method).toBe('POST')
    const u =
      typeof gammaGenerateTool.request.url === 'function'
        ? (gammaGenerateTool.request.url as any)(P)
        : gammaGenerateTool.request.url
    expect(String(u)).toContain('gamma.app')
    expect(Object.keys(gammaGenerateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gammaGenerateTool.transformResponse).toBe('function')
  })

  it('gamma_generate_from_template: builds its request', () => {
    expect(gammaGenerateFromTemplateTool.id).toBe('gamma_generate_from_template')
    expect(gammaGenerateFromTemplateTool.request.method).toBe('POST')
    const u =
      typeof gammaGenerateFromTemplateTool.request.url === 'function'
        ? (gammaGenerateFromTemplateTool.request.url as any)(P)
        : gammaGenerateFromTemplateTool.request.url
    expect(String(u)).toContain('gamma.app')
    expect(Object.keys(gammaGenerateFromTemplateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gammaGenerateFromTemplateTool.transformResponse).toBe('function')
  })

  it('gamma_check_status: builds its request', () => {
    expect(gammaCheckStatusTool.id).toBe('gamma_check_status')
    expect(gammaCheckStatusTool.request.method).toBe('GET')
    const u =
      typeof gammaCheckStatusTool.request.url === 'function'
        ? (gammaCheckStatusTool.request.url as any)(P)
        : gammaCheckStatusTool.request.url
    expect(String(u)).toContain('gamma.app')
    expect(Object.keys(gammaCheckStatusTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gammaCheckStatusTool.transformResponse).toBe('function')
  })

  it('gamma_list_themes: builds its request', () => {
    expect(gammaListThemesTool.id).toBe('gamma_list_themes')
    expect(gammaListThemesTool.request.method).toBe('GET')
    const u =
      typeof gammaListThemesTool.request.url === 'function'
        ? (gammaListThemesTool.request.url as any)(P)
        : gammaListThemesTool.request.url
    expect(String(u)).toContain('gamma.app')
    expect(Object.keys(gammaListThemesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gammaListThemesTool.transformResponse).toBe('function')
  })

  it('gamma_list_folders: builds its request', () => {
    expect(gammaListFoldersTool.id).toBe('gamma_list_folders')
    expect(gammaListFoldersTool.request.method).toBe('GET')
    const u =
      typeof gammaListFoldersTool.request.url === 'function'
        ? (gammaListFoldersTool.request.url as any)(P)
        : gammaListFoldersTool.request.url
    expect(String(u)).toContain('gamma.app')
    expect(Object.keys(gammaListFoldersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gammaListFoldersTool.transformResponse).toBe('function')
  })
})
