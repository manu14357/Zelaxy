/**
 * Functional tests for the AgentMail tools — request-builder logic only.
 * The outward send path is asserted here but never actually fired.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { agentmailGetThreadTool } from '@/tools/agentmail/get_thread'
import { agentmailListThreadsTool } from '@/tools/agentmail/list_threads'
import { agentmailSendMessageTool } from '@/tools/agentmail/send_message'

describe('agentmail_list_threads tool', () => {
  it('GETs the inbox threads endpoint with a bearer token', () => {
    const p: any = { inboxId: 'zelaxy@agentmail.to ', apiKey: 'am_x', limit: 3 }
    const url = (agentmailListThreadsTool.request.url as any)(p)
    expect(url).toContain('/v0/inboxes/zelaxy@agentmail.to/threads')
    expect(agentmailListThreadsTool.request.method).toBe('GET')
    expect((agentmailListThreadsTool.request.headers as any)(p).Authorization).toBe('Bearer am_x')
  })
})

describe('agentmail_get_thread tool', () => {
  it('is a GET request', () => {
    expect(agentmailGetThreadTool.request.method).toBe('GET')
  })
})

describe('agentmail_send_message tool', () => {
  it('POSTs to the inbox send endpoint with a bearer token', () => {
    const p: any = { inboxId: 'zelaxy@agentmail.to', apiKey: 'am_x' }
    expect((agentmailSendMessageTool.request.url as any)(p)).toBe(
      'https://api.agentmail.to/v0/inboxes/zelaxy@agentmail.to/messages/send'
    )
    expect(agentmailSendMessageTool.request.method).toBe('POST')
    expect((agentmailSendMessageTool.request.headers as any)(p).Authorization).toBe('Bearer am_x')
  })

  it('splits comma-separated recipients and includes the body text', () => {
    const body: any = agentmailSendMessageTool.request.body!({
      inboxId: 'i',
      apiKey: 'k',
      to: 'a@x.com, b@y.com',
      subject: 'hi',
      text: 'hello',
      cc: 'c@z.com',
    } as any)
    expect(body.to).toEqual(['a@x.com', 'b@y.com'])
    expect(body.subject).toBe('hi')
    expect(body.text).toBe('hello')
    expect(body.cc).toEqual(['c@z.com'])
  })
})
