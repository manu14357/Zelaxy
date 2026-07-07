/**
 * Functional tests for the SixtyFour tools — request-builder + transform logic.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  sixtyfourEnrichLeadTool,
  sixtyfourFindEmailTool,
  sixtyfourFindPhoneTool,
} from '@/tools/sixtyfour'

const jsonResponse = (body: any, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as unknown as Response

describe('sixtyfour_find_phone tool', () => {
  it('POSTs to find-phone with the x-api-key header', () => {
    const p: any = { apiKey: 'api_x', name: 'Ada' }
    expect(sixtyfourFindPhoneTool.request.url).toBe('https://api.sixtyfour.ai/find-phone')
    expect(sixtyfourFindPhoneTool.request.method).toBe('POST')
    expect((sixtyfourFindPhoneTool.request.headers as any)(p)['x-api-key']).toBe('api_x')
  })

  it('wraps the lead fields into a lead object', () => {
    const body: any = sixtyfourFindPhoneTool.request.body!({
      apiKey: 'k',
      name: 'Ada Lovelace',
      company: 'Analytical',
      domain: 'analytical.co',
    } as any)
    expect(body.lead.name).toBe('Ada Lovelace')
    expect(body.lead.company).toBe('Analytical')
    expect(body.lead.domain).toBe('analytical.co')
  })
})

describe('sixtyfour_find_email tool', () => {
  it('builds a lead body and sends the x-api-key header', () => {
    const p: any = { apiKey: 'api_x', name: 'Grace', title: 'Admiral' }
    expect((sixtyfourFindEmailTool.request.headers as any)(p)['x-api-key']).toBe('api_x')
    const body: any = sixtyfourFindEmailTool.request.body!(p)
    expect(body.lead.name).toBe('Grace')
    expect(body.lead.title).toBe('Admiral')
  })
})

describe('sixtyfour_enrich_lead tool', () => {
  it('parses JSON-string leadInfo and struct into snake_case body', () => {
    const body: any = sixtyfourEnrichLeadTool.request.body!({
      apiKey: 'k',
      leadInfo: '{"name":"Ada"}',
      struct: '{"email":"the email"}',
    } as any)
    expect(body.lead_info).toEqual({ name: 'Ada' })
    expect(body.struct).toEqual({ email: 'the email' })
  })

  it('throws on invalid leadInfo JSON', () => {
    expect(() =>
      sixtyfourEnrichLeadTool.request.body!({
        apiKey: 'k',
        leadInfo: '{not json',
        struct: '{}',
      } as any)
    ).toThrow(/leadInfo must be valid JSON/)
  })

  it('transforms an error response into a thrown error', async () => {
    await expect(
      sixtyfourFindEmailTool.transformResponse!(
        jsonResponse({ error: 'bad key' }, false, 401),
        {} as any
      )
    ).rejects.toThrow(/bad key/)
  })
})
