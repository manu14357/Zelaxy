/**
 * Request-builder tests for the Dub tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { dubCreateLinkTool } from '@/tools/dub/create_link'
import { dubDeleteLinkTool } from '@/tools/dub/delete_link'
import { dubGetAnalyticsTool } from '@/tools/dub/get_analytics'
import { dubGetLinkTool } from '@/tools/dub/get_link'
import { dubListLinksTool } from '@/tools/dub/list_links'
import { dubUpdateLinkTool } from '@/tools/dub/update_link'

const P: any = {
  apiKey: 'k',
  baseUrl: 'https://mydspy.example.com',
  url: 'https://mycluster.es.local:9200',
  index: 'idx',
  linkId: 'l',
  domain: 'x.com',
  query: 'q',
  email: 'e@x.com',
  documentId: 'd',
  id: 'id',
  input: 'hello',
  text: 'hi',
  voiceId: 'v',
  personId: 'p',
  companyName: 'Acme',
  phone: '123',
  resultId: 'r',
  batchId: 'b',
  linkedinUrl: 'https://linkedin.com/in/x',
  name: 'n',
  fullName: 'n',
  model: 'm',
}

describe('Dub tools', () => {
  it('dub_create_link: builds its request', () => {
    expect(dubCreateLinkTool.id).toBe('dub_create_link')
    expect(dubCreateLinkTool.request.method).toBe('POST')
    const u =
      typeof dubCreateLinkTool.request.url === 'function'
        ? (dubCreateLinkTool.request.url as any)(P)
        : dubCreateLinkTool.request.url
    expect(String(u)).toContain('api.dub.co')
    expect(Object.keys(dubCreateLinkTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dubCreateLinkTool.transformResponse).toBe('function')
  })

  it('dub_delete_link: builds its request', () => {
    expect(dubDeleteLinkTool.id).toBe('dub_delete_link')
    expect(dubDeleteLinkTool.request.method).toBe('DELETE')
    const u =
      typeof dubDeleteLinkTool.request.url === 'function'
        ? (dubDeleteLinkTool.request.url as any)(P)
        : dubDeleteLinkTool.request.url
    expect(String(u)).toContain('api.dub.co')
    expect(Object.keys(dubDeleteLinkTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dubDeleteLinkTool.transformResponse).toBe('function')
  })

  it('dub_get_analytics: builds its request', () => {
    expect(dubGetAnalyticsTool.id).toBe('dub_get_analytics')
    expect(dubGetAnalyticsTool.request.method).toBe('GET')
    const u =
      typeof dubGetAnalyticsTool.request.url === 'function'
        ? (dubGetAnalyticsTool.request.url as any)(P)
        : dubGetAnalyticsTool.request.url
    expect(String(u)).toContain('api.dub.co')
    expect(Object.keys(dubGetAnalyticsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dubGetAnalyticsTool.transformResponse).toBe('function')
  })

  it('dub_get_link: builds its request', () => {
    expect(dubGetLinkTool.id).toBe('dub_get_link')
    expect(dubGetLinkTool.request.method).toBe('GET')
    const u =
      typeof dubGetLinkTool.request.url === 'function'
        ? (dubGetLinkTool.request.url as any)(P)
        : dubGetLinkTool.request.url
    expect(String(u)).toContain('api.dub.co')
    expect(Object.keys(dubGetLinkTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dubGetLinkTool.transformResponse).toBe('function')
  })

  it('dub_list_links: builds its request', () => {
    expect(dubListLinksTool.id).toBe('dub_list_links')
    expect(dubListLinksTool.request.method).toBe('GET')
    const u =
      typeof dubListLinksTool.request.url === 'function'
        ? (dubListLinksTool.request.url as any)(P)
        : dubListLinksTool.request.url
    expect(String(u)).toContain('api.dub.co')
    expect(Object.keys(dubListLinksTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dubListLinksTool.transformResponse).toBe('function')
  })

  it('dub_update_link: builds its request', () => {
    expect(dubUpdateLinkTool.id).toBe('dub_update_link')
    expect(dubUpdateLinkTool.request.method).toBe('PATCH')
    const u =
      typeof dubUpdateLinkTool.request.url === 'function'
        ? (dubUpdateLinkTool.request.url as any)(P)
        : dubUpdateLinkTool.request.url
    expect(String(u)).toContain('api.dub.co')
    expect(Object.keys(dubUpdateLinkTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dubUpdateLinkTool.transformResponse).toBe('function')
  })
})
