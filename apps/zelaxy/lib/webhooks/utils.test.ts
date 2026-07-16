import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/api/auth/oauth/utils', () => ({
  getOAuthToken: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {},
}))

vi.mock('@/db/schema', () => ({
  webhook: {},
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}))

import {
  formatWebhookInput,
  validateGitLabToken,
  validateTypeformSignature,
  verifyProviderWebhook,
} from '@/lib/webhooks/utils'

function requestWith(headers: Record<string, string>) {
  return { headers: new Headers(headers), method: 'POST' } as any
}

describe('verifyProviderWebhook', () => {
  it('rejects a generic webhook that requires auth when no token is supplied', () => {
    const result = verifyProviderWebhook(
      { provider: 'generic', providerConfig: { requireAuth: true, token: 'super-secret' } },
      requestWith({}),
      'req-1'
    )

    expect(result).not.toBeNull()
    expect(result?.status).toBe(401)
  })

  it('rejects a generic webhook when the bearer token is wrong', () => {
    const result = verifyProviderWebhook(
      { provider: 'generic', providerConfig: { requireAuth: true, token: 'super-secret' } },
      requestWith({ authorization: 'Bearer wrong-token' }),
      'req-2'
    )

    expect(result?.status).toBe(401)
  })

  it('allows a generic webhook with the correct bearer token', () => {
    const result = verifyProviderWebhook(
      { provider: 'generic', providerConfig: { requireAuth: true, token: 'super-secret' } },
      requestWith({ authorization: 'Bearer super-secret' }),
      'req-3'
    )

    expect(result).toBeNull()
  })

  it('allows a generic webhook when the token arrives in the configured custom header', () => {
    const result = verifyProviderWebhook(
      {
        provider: 'generic',
        providerConfig: {
          requireAuth: true,
          token: 'super-secret',
          secretHeaderName: 'x-zelaxy-secret',
        },
      },
      requestWith({ 'x-zelaxy-secret': 'super-secret' }),
      'req-4'
    )

    expect(result).toBeNull()
  })

  it('forbids a generic webhook from an IP outside the allowlist', () => {
    const result = verifyProviderWebhook(
      { provider: 'generic', providerConfig: { allowedIps: ['10.0.0.1'] } },
      requestWith({ 'x-forwarded-for': '203.0.113.9' }),
      'req-5'
    )

    expect(result?.status).toBe(403)
  })

  it('allows a generic webhook from an allowlisted IP', () => {
    const result = verifyProviderWebhook(
      { provider: 'generic', providerConfig: { allowedIps: ['10.0.0.1'] } },
      requestWith({ 'x-forwarded-for': '10.0.0.1' }),
      'req-6'
    )

    expect(result).toBeNull()
  })

  it('does not gate providers that have no auth configured', () => {
    const result = verifyProviderWebhook(
      { provider: 'github', providerConfig: {} },
      requestWith({}),
      'req-7'
    )

    expect(result).toBeNull()
  })
})

describe('validateGitLabToken', () => {
  it('accepts a matching token', () => {
    expect(validateGitLabToken('secret-token', 'secret-token')).toBe(true)
  })

  it('rejects a mismatched token', () => {
    expect(validateGitLabToken('secret-token', 'other-token')).toBe(false)
  })

  it('rejects a missing token header', () => {
    expect(validateGitLabToken('secret-token', null)).toBe(false)
  })

  it('rejects when no secret is configured', () => {
    expect(validateGitLabToken('', 'anything')).toBe(false)
  })
})

describe('validateTypeformSignature', () => {
  const secret = 'typeform-secret'
  const body = '{"event_id":"abc","event_type":"form_response"}'
  // Precomputed at test time so the expectation tracks the real HMAC, not a copied constant
  const validSignature = `sha256=${require('crypto').createHmac('sha256', secret).update(body, 'utf8').digest('base64')}`

  it('accepts a correctly signed body', () => {
    expect(validateTypeformSignature(secret, validSignature, body)).toBe(true)
  })

  it('rejects a body that was tampered with after signing', () => {
    expect(validateTypeformSignature(secret, validSignature, `${body} tampered`)).toBe(false)
  })

  it('rejects a signature made with the wrong secret', () => {
    expect(validateTypeformSignature('other-secret', validSignature, body)).toBe(false)
  })

  it('rejects a signature missing the sha256= prefix', () => {
    expect(validateTypeformSignature(secret, validSignature.replace('sha256=', ''), body)).toBe(
      false
    )
  })

  it('rejects a missing signature header', () => {
    expect(validateTypeformSignature(secret, null, body)).toBe(false)
  })
})

describe('formatWebhookInput (typeform)', () => {
  it('flattens the form_response envelope and keys answers by question title', () => {
    const payload = {
      event_id: 'evt_123',
      event_type: 'form_response',
      form_response: {
        form_id: 'lT4Z3j',
        token: 'resp_abc',
        landed_at: '2024-01-15T13:10:00Z',
        submitted_at: '2024-01-15T13:14:15Z',
        definition: {
          id: 'lT4Z3j',
          title: 'Customer Feedback',
          fields: [
            { id: 'f_email', ref: 'ref_email', type: 'email', title: 'What is your email?' },
            { id: 'f_rating', ref: 'ref_rating', type: 'number', title: 'Rate us' },
            { id: 'f_plan', ref: 'ref_plan', type: 'choice', title: 'Which plan?' },
          ],
        },
        answers: [
          { type: 'email', email: 'ada@example.com', field: { id: 'f_email', type: 'email' } },
          { type: 'number', number: 9, field: { id: 'f_rating', type: 'number' } },
          {
            type: 'choice',
            choice: { label: 'Enterprise' },
            field: { id: 'f_plan', type: 'choice' },
          },
        ],
        hidden: { utm_source: 'newsletter' },
      },
    }

    const result = formatWebhookInput(
      { provider: 'typeform', path: 'tf-hook', providerConfig: {} },
      { id: 'workflow-123' },
      payload,
      { headers: new Headers({ 'content-type': 'application/json' }), method: 'POST' } as any
    )

    // Flattened to top level so the declared trigger outputs resolve
    expect(result.event_id).toBe('evt_123')
    expect(result.form_id).toBe('lT4Z3j')
    expect(result.form_title).toBe('Customer Feedback')
    expect(result.token).toBe('resp_abc')
    expect(result.submitted_at).toBe('2024-01-15T13:14:15Z')
    expect(result.answer_count).toBe(3)
    expect(result.hidden.utm_source).toBe('newsletter')

    // Answers unwrapped and keyed by question title
    expect(result.fields['What is your email?']).toBe('ada@example.com')
    expect(result.fields['Rate us']).toBe(9)
    expect(result.fields['Which plan?']).toBe('Enterprise')

    // Raw payload preserved
    expect(result.raw).toEqual(payload)
    expect(result.webhook.data.provider).toBe('typeform')
  })

  it('handles a submission with no answers without throwing', () => {
    const result = formatWebhookInput(
      { provider: 'typeform', path: 'tf-hook', providerConfig: {} },
      { id: 'workflow-123' },
      { event_id: 'evt_empty', event_type: 'form_response', form_response: { form_id: 'x' } },
      { headers: new Headers(), method: 'POST' } as any
    )

    expect(result.answer_count).toBe(0)
    expect(result.fields).toEqual({})
    expect(result.form_id).toBe('x')
  })
})

describe('formatWebhookInput', () => {
  it('should preserve the full Telegram chat id across preferred and legacy paths', () => {
    const payload = {
      update_id: 987654321,
      message: {
        message_id: 321,
        from: {
          id: 550198060,
          is_bot: false,
          first_name: 'Manu',
          username: 'manu14357',
          language_code: 'en',
        },
        chat: {
          id: 5550198060,
          first_name: 'Manu',
          username: 'manu14357',
          type: 'private',
        },
        date: 1710000000,
        text: 'hello',
      },
    }

    const result = formatWebhookInput(
      {
        provider: 'telegram',
        path: 'telegram-test-webhook',
        providerConfig: {},
      },
      { id: 'workflow-123' },
      payload,
      {
        headers: new Headers({ 'content-type': 'application/json' }),
        method: 'POST',
      } as any
    )

    expect(String(result.chatId)).toHaveLength(10)
    expect(result.chatId).toBe(5550198060)
    expect(result.chat.id).toBe(5550198060)
    expect(result.telegram.chat.id).toBe(5550198060)

    expect(result.message.chat_id).toBe(5550198060)
    expect(result.telegram.message.chat_id).toBe(5550198060)
    expect(result.message.message_id).toBe(321)
    expect(result.message.update_id).toBe(987654321)

    expect(result.sender.id).toBe(550198060)
    expect(result.message.from_id).toBe(550198060)
  })
})
