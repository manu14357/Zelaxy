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
  getExternalRequestUrl,
  handleZoomUrlValidation,
  validateCalcomSignature,
  validateCalendlySignature,
  validateGitLabToken,
  validatePagerDutySignature,
  validateSentrySignature,
  validateSvixSignature,
  validateTwilioSignature,
  validateTypeformSignature,
  validateVercelSignature,
  validateZoomSignature,
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

describe('batch-1 signature validators', () => {
  const crypto = require('crypto')
  const body = '{"hello":"world"}'

  it('validateSentrySignature accepts a correct hex HMAC-SHA256 and rejects tampering', () => {
    const secret = 'sentry-secret'
    const sig = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    expect(validateSentrySignature(secret, sig, body)).toBe(true)
    expect(validateSentrySignature(secret, sig, `${body} tampered`)).toBe(false)
    expect(validateSentrySignature('wrong-secret', sig, body)).toBe(false)
    expect(validateSentrySignature(secret, null, body)).toBe(false)
  })

  it('validateCalendlySignature verifies the t=<ts>,v1=<sig> scheme over `ts.body`', () => {
    const key = 'calendly-key'
    const ts = '1705324455'
    const sig = crypto.createHmac('sha256', key).update(`${ts}.${body}`, 'utf8').digest('hex')

    expect(validateCalendlySignature(key, `t=${ts},v1=${sig}`, body)).toBe(true)
    // A signature computed without the timestamp prefix must not pass
    const noTs = crypto.createHmac('sha256', key).update(body, 'utf8').digest('hex')
    expect(validateCalendlySignature(key, `t=${ts},v1=${noTs}`, body)).toBe(false)
    // Replaying a valid signature against a different timestamp must not pass
    expect(validateCalendlySignature(key, `t=9999999999,v1=${sig}`, body)).toBe(false)
    expect(validateCalendlySignature(key, 'malformed-header', body)).toBe(false)
  })

  it('validatePagerDutySignature accepts any of the comma-separated v1 signatures', () => {
    const secret = 'pd-secret'
    const sig = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    expect(validatePagerDutySignature(secret, `v1=${sig}`, body)).toBe(true)
    // During secret rotation PagerDuty sends several; matching any one is valid
    expect(validatePagerDutySignature(secret, `v1=deadbeef,v1=${sig}`, body)).toBe(true)
    expect(validatePagerDutySignature(secret, 'v1=deadbeef', body)).toBe(false)
    // A correct hash under the wrong version prefix must not pass
    expect(validatePagerDutySignature(secret, `v2=${sig}`, body)).toBe(false)
  })

  it('validateVercelSignature uses SHA-1, not SHA-256', () => {
    const secret = 'vercel-secret'
    const sha1 = crypto.createHmac('sha1', secret).update(body, 'utf8').digest('hex')
    const sha256 = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    expect(validateVercelSignature(secret, sha1, body)).toBe(true)
    expect(validateVercelSignature(secret, sha256, body)).toBe(false)
    expect(validateVercelSignature(secret, sha1, `${body} tampered`)).toBe(false)
  })
})

describe('batch-2 signature validators', () => {
  const crypto = require('crypto')
  const body = '{"hello":"world"}'

  it('validateZoomSignature signs `v0:<timestamp>:<body>` and is bound to the timestamp', () => {
    const secret = 'zoom-secret'
    const ts = '1705324455'
    const sig = `v0=${crypto.createHmac('sha256', secret).update(`v0:${ts}:${body}`, 'utf8').digest('hex')}`

    expect(validateZoomSignature(secret, sig, ts, body)).toBe(true)
    // Replaying against a different timestamp must fail
    expect(validateZoomSignature(secret, sig, '9999999999', body)).toBe(false)
    // A signature over the bare body (no v0: prefix) must fail
    const bare = `v0=${crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`
    expect(validateZoomSignature(secret, bare, ts, body)).toBe(false)
    expect(validateZoomSignature(secret, sig, null, body)).toBe(false)
  })

  it('validateSvixSignature verifies `<id>.<ts>.<body>` with a base64-decoded whsec_ secret', () => {
    const rawKey = crypto.randomBytes(24).toString('base64')
    const secret = `whsec_${rawKey}`
    const id = 'msg_abc'
    const ts = '1705324455'
    const expected = crypto
      .createHmac('sha256', Buffer.from(rawKey, 'base64'))
      .update(`${id}.${ts}.${body}`, 'utf8')
      .digest('base64')

    expect(validateSvixSignature(secret, id, ts, `v1,${expected}`, body)).toBe(true)
    // The whsec_ prefix is optional — the raw key must work too
    expect(validateSvixSignature(rawKey, id, ts, `v1,${expected}`, body)).toBe(true)
    // Svix sends several space-separated signatures during rotation; any match is valid
    expect(validateSvixSignature(secret, id, ts, `v1,AAAA v1,${expected}`, body)).toBe(true)
    // Bound to id and timestamp
    expect(validateSvixSignature(secret, 'msg_other', ts, `v1,${expected}`, body)).toBe(false)
    expect(validateSvixSignature(secret, id, '1', `v1,${expected}`, body)).toBe(false)
    expect(validateSvixSignature(secret, id, ts, `v1,${expected}`, `${body} tampered`)).toBe(false)
  })

  it('validateCalcomSignature accepts a correct hex HMAC-SHA256', () => {
    const secret = 'cal-secret'
    const sig = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    expect(validateCalcomSignature(secret, sig, body)).toBe(true)
    expect(validateCalcomSignature(secret, sig, `${body} tampered`)).toBe(false)
    expect(validateCalcomSignature('wrong', sig, body)).toBe(false)
  })
})

describe('handleZoomUrlValidation', () => {
  it('answers the challenge with the HMAC of plainToken', () => {
    const secret = 'zoom-secret'
    const res = handleZoomUrlValidation(
      { event: 'endpoint.url_validation', payload: { plainToken: 'abc123' } },
      secret
    )

    expect(res).not.toBeNull()
    expect(res?.status).toBe(200)
  })

  it('returns null for a normal event so processing continues', () => {
    expect(handleZoomUrlValidation({ event: 'meeting.started' }, 'zoom-secret')).toBeNull()
  })

  it('fails the challenge when no secret token is configured', () => {
    const res = handleZoomUrlValidation(
      { event: 'endpoint.url_validation', payload: { plainToken: 'abc123' } },
      undefined
    )

    expect(res?.status).toBe(400)
  })
})

describe('validateTwilioSignature', () => {
  const crypto = require('crypto')
  const token = 'twilio-auth-token'
  const url = 'https://zelaxy.in/api/webhooks/trigger/abc'
  const params = { To: '+15559876543', From: '+15551234567', Body: 'Hello' }

  // Twilio signs url + params sorted by key, appended as key+value with no separators
  const sign = (u: string, p: Record<string, string>) =>
    crypto
      .createHmac('sha1', token)
      .update(
        Buffer.from(
          Object.keys(p)
            .sort()
            .reduce((a, k) => a + k + p[k], u),
          'utf8'
        )
      )
      .digest('base64')

  it('accepts a correctly signed request', () => {
    expect(validateTwilioSignature(token, sign(url, params), url, params)).toBe(true)
  })

  it('is bound to the URL — the same params at a different URL must fail', () => {
    const sig = sign(url, params)
    expect(validateTwilioSignature(token, sig, 'https://evil.example/api', params)).toBe(false)
  })

  it('rejects tampered params', () => {
    const sig = sign(url, params)
    expect(validateTwilioSignature(token, sig, url, { ...params, Body: 'Changed' })).toBe(false)
  })

  it('depends on sorted key order, not insertion order', () => {
    const sig = sign(url, params)
    // Same pairs, different insertion order — must still validate
    const reordered = { Body: 'Hello', From: '+15551234567', To: '+15559876543' }
    expect(validateTwilioSignature(token, sig, url, reordered)).toBe(true)
  })

  it('rejects a wrong auth token and a missing signature', () => {
    expect(validateTwilioSignature('wrong', sign(url, params), url, params)).toBe(false)
    expect(validateTwilioSignature(token, null, url, params)).toBe(false)
  })
})

describe('getExternalRequestUrl', () => {
  it('prefers the forwarded host and proto a provider actually called', () => {
    const req = {
      url: 'http://internal-host:3000/api/webhooks/trigger/abc',
      headers: new Headers({ 'x-forwarded-host': 'zelaxy.in', 'x-forwarded-proto': 'https' }),
    } as any

    expect(getExternalRequestUrl(req)).toBe('https://zelaxy.in/api/webhooks/trigger/abc')
  })

  it('takes the first proto when the header carries a chain', () => {
    const req = {
      url: 'http://internal/api/x',
      headers: new Headers({ 'x-forwarded-host': 'zelaxy.in', 'x-forwarded-proto': 'https,http' }),
    } as any

    expect(getExternalRequestUrl(req)).toBe('https://zelaxy.in/api/x')
  })

  it('falls back to the request URL when nothing is forwarded', () => {
    const req = { url: 'https://zelaxy.in/api/x', headers: new Headers() } as any
    expect(getExternalRequestUrl(req)).toBe('https://zelaxy.in/api/x')
  })
})

describe('formatWebhookInput (twilio)', () => {
  const req = () => ({ headers: new Headers(), method: 'POST' }) as any

  it('exposes Twilio PascalCase form fields under snake_case names', () => {
    const result = formatWebhookInput(
      { provider: 'twilio', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        MessageSid: 'SM123',
        AccountSid: 'AC123',
        From: '+15551234567',
        To: '+15559876543',
        Body: 'Hello from Twilio',
        NumMedia: '0',
        FromCity: 'SAN FRANCISCO',
        SmsStatus: 'received',
      },
      req()
    )

    expect(result.message_sid).toBe('SM123')
    expect(result.from).toBe('+15551234567')
    expect(result.body).toBe('Hello from Twilio')
    expect(result.message_status).toBe('received')
    expect(result.from_city).toBe('SAN FRANCISCO')
    expect(result.num_media).toBe(0)
    // The message text becomes the workflow input
    expect(result.input).toBe('Hello from Twilio')
  })

  it('collects the numbered MMS Media* fields into an array', () => {
    const result = formatWebhookInput(
      { provider: 'twilio', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        MessageSid: 'SM123',
        From: '+1555',
        To: '+1666',
        Body: 'pics',
        NumMedia: '2',
        MediaUrl0: 'https://api.twilio.com/m0',
        MediaContentType0: 'image/jpeg',
        MediaUrl1: 'https://api.twilio.com/m1',
        MediaContentType1: 'image/png',
      },
      req()
    )

    expect(result.num_media).toBe(2)
    expect(result.media).toEqual([
      { url: 'https://api.twilio.com/m0', content_type: 'image/jpeg' },
      { url: 'https://api.twilio.com/m1', content_type: 'image/png' },
    ])
  })

  it('flattens a twilio_voice call event', () => {
    const result = formatWebhookInput(
      { provider: 'twilio_voice', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        CallSid: 'CA123',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        Direction: 'inbound',
      },
      req()
    )

    expect(result.call_sid).toBe('CA123')
    expect(result.call_status).toBe('ringing')
    expect(result.direction).toBe('inbound')
    expect(result.input).toContain('ringing')
  })
})

describe('formatWebhookInput (batch-2 providers)', () => {
  const req = (headers: Record<string, string> = {}) =>
    ({ headers: new Headers(headers), method: 'POST' }) as any

  it('flattens a Zoom participant event', () => {
    const result = formatWebhookInput(
      { provider: 'zoom', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        event: 'meeting.participant_joined',
        event_ts: 1705324455000,
        payload: {
          account_id: 'acc1',
          object: {
            id: '81234567890',
            topic: 'Weekly Standup',
            participant: {
              user_name: 'Ada Lovelace',
              email: 'ada@example.com',
              join_time: '2024-01-15T13:00:00Z',
            },
          },
        },
      },
      req()
    )

    expect(result.event_type).toBe('meeting.participant_joined')
    expect(result.topic).toBe('Weekly Standup')
    expect(result.participant_name).toBe('Ada Lovelace')
    expect(result.participant_email).toBe('ada@example.com')
  })

  it('resolves the Clerk primary email rather than just the first', () => {
    const result = formatWebhookInput(
      { provider: 'clerk', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        type: 'user.created',
        data: {
          id: 'user_1',
          first_name: 'Ada',
          last_name: 'Lovelace',
          primary_email_address_id: 'idn_2',
          email_addresses: [
            { id: 'idn_1', email_address: 'old@example.com' },
            { id: 'idn_2', email_address: 'primary@example.com' },
          ],
        },
      },
      req()
    )

    expect(result.event_type).toBe('user.created')
    expect(result.object_id).toBe('user_1')
    expect(result.email).toBe('primary@example.com')
    expect(result.full_name).toBe('Ada Lovelace')
  })

  it('unwraps Cal.com {label,value} responses into plain answers', () => {
    const result = formatWebhookInput(
      { provider: 'calcom', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        triggerEvent: 'BOOKING_CREATED',
        payload: {
          bookingId: 123,
          uid: 'abc',
          title: '30 Min Meeting',
          startTime: '2024-01-20T15:00:00Z',
          status: 'ACCEPTED',
          organizer: { name: 'Ada', email: 'ada@example.com' },
          attendees: [{ name: 'Alan', email: 'alan@example.com', timeZone: 'Europe/London' }],
          responses: { name: { label: 'your_name', value: 'Alan Turing' }, plain: 'raw-value' },
        },
      },
      req()
    )

    expect(result.event_type).toBe('BOOKING_CREATED')
    expect(result.attendee_email).toBe('alan@example.com')
    expect(result.organizer_email).toBe('ada@example.com')
    expect(result.answers.name).toBe('Alan Turing')
    // A response that is already a plain value passes through unchanged
    expect(result.answers.plain).toBe('raw-value')
  })

  it('flattens a Resend click event and normalises `to` to an array', () => {
    const result = formatWebhookInput(
      { provider: 'resend', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        type: 'email.clicked',
        created_at: '2024-01-15T13:14:15.000Z',
        data: {
          email_id: 'em_1',
          from: 'noreply@zelaxy.in',
          to: 'ada@example.com',
          subject: 'Welcome',
          click: { link: 'https://zelaxy.in/start', timestamp: '2024-01-15T13:20:00.000Z' },
        },
      },
      req()
    )

    expect(result.event_type).toBe('email.clicked')
    expect(result.to).toEqual(['ada@example.com'])
    expect(result.to_email).toBe('ada@example.com')
    expect(result.click_link).toBe('https://zelaxy.in/start')
  })
})

describe('formatWebhookInput (batch-1 providers)', () => {
  const req = (headers: Record<string, string> = {}) =>
    ({ headers: new Headers(headers), method: 'POST' }) as any

  it('flattens a Sentry issue event', () => {
    const payload = {
      action: 'created',
      data: {
        issue: {
          id: '123',
          shortId: 'PROJ-1',
          title: 'TypeError: undefined',
          culprit: 'app/checkout',
          status: 'unresolved',
          level: 'error',
          count: '3',
          userCount: 2,
          permalink: 'https://sentry.io/issues/123/',
          project: { slug: 'my-project' },
        },
      },
      actor: { name: 'Sentry' },
    }

    const result = formatWebhookInput(
      { provider: 'sentry', path: 'p', providerConfig: {} },
      { id: 'wf' },
      payload,
      req({ 'sentry-hook-resource': 'issue' })
    )

    expect(result.action).toBe('created')
    expect(result.resource).toBe('issue')
    expect(result.issue_id).toBe('123')
    expect(result.issue_title).toBe('TypeError: undefined')
    expect(result.issue_url).toBe('https://sentry.io/issues/123/')
    expect(result.short_id).toBe('PROJ-1')
    expect(result.user_count).toBe(2)
    expect(result.project_slug).toBe('my-project')
    expect(result.raw).toEqual(payload)
  })

  it('flattens a Calendly invitee.created event and keys answers by question', () => {
    const payload = {
      event: 'invitee.created',
      payload: {
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        status: 'active',
        timezone: 'America/New_York',
        rescheduled: false,
        questions_and_answers: [{ question: 'Topic?', answer: 'Pricing', position: 0 }],
        scheduled_event: {
          name: '30 Minute Meeting',
          status: 'active',
          start_time: '2024-01-20T15:00:00Z',
          end_time: '2024-01-20T15:30:00Z',
          location: { type: 'google_conference', join_url: 'https://meet.google.com/x' },
        },
      },
    }

    const result = formatWebhookInput(
      { provider: 'calendly', path: 'p', providerConfig: {} },
      { id: 'wf' },
      payload,
      req()
    )

    expect(result.event).toBe('invitee.created')
    expect(result.invitee_email).toBe('ada@example.com')
    expect(result.event_name).toBe('30 Minute Meeting')
    expect(result.start_time).toBe('2024-01-20T15:00:00Z')
    expect(result.join_url).toBe('https://meet.google.com/x')
    expect(result.answers.Topic).toBeUndefined()
    expect(result.answers['Topic?']).toBe('Pricing')
  })

  it('surfaces the cancellation reason on a Calendly invitee.canceled event', () => {
    const result = formatWebhookInput(
      { provider: 'calendly', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        event: 'invitee.canceled',
        payload: {
          email: 'ada@example.com',
          status: 'canceled',
          cancellation: { reason: 'Conflict', canceled_by: 'Ada', canceler_type: 'invitee' },
        },
      },
      req()
    )

    expect(result.invitee_status).toBe('canceled')
    expect(result.cancel_reason).toBe('Conflict')
    expect(result.cancellation.canceler_type).toBe('invitee')
  })

  it('flattens a PagerDuty v3 incident event including assignee names', () => {
    const result = formatWebhookInput(
      { provider: 'pagerduty', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        event: {
          id: 'evt1',
          event_type: 'incident.triggered',
          occurred_at: '2024-01-15T13:14:15Z',
          agent: { summary: 'Ada' },
          data: {
            id: 'PABC',
            number: 1234,
            title: 'Checkout 500s',
            status: 'triggered',
            urgency: 'high',
            html_url: 'https://acme.pagerduty.com/incidents/PABC',
            service: { id: 'PSVC', summary: 'Checkout API' },
            assignees: [
              { id: 'U1', summary: 'Ada Lovelace' },
              { id: 'U2', summary: 'Alan' },
            ],
            escalation_policy: { summary: 'Primary On-Call' },
          },
        },
      },
      req()
    )

    expect(result.event_type).toBe('incident.triggered')
    expect(result.incident_id).toBe('PABC')
    expect(result.incident_number).toBe(1234)
    expect(result.urgency).toBe('high')
    expect(result.service_name).toBe('Checkout API')
    expect(result.escalation_policy).toBe('Primary On-Call')
    expect(result.assignee_names).toEqual(['Ada Lovelace', 'Alan'])
    expect(result.agent_name).toBe('Ada')
  })

  it('flattens a Vercel deployment event and reads git metadata', () => {
    const result = formatWebhookInput(
      { provider: 'vercel', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        id: 'uev_1',
        type: 'deployment.ready',
        createdAt: 1705324455000,
        payload: {
          team: { id: 'team_1' },
          user: { id: 'user_1' },
          project: { id: 'prj_1', name: 'zelaxy-web' },
          deployment: {
            id: 'dpl_1',
            name: 'zelaxy-web',
            url: 'zelaxy-web.vercel.app',
            target: 'production',
            meta: { githubCommitRef: 'main', githubCommitSha: 'abc123' },
          },
        },
      },
      req()
    )

    expect(result.event_type).toBe('deployment.ready')
    expect(result.deployment_url).toBe('zelaxy-web.vercel.app')
    expect(result.target).toBe('production')
    expect(result.project_name).toBe('zelaxy-web')
    expect(result.git_branch).toBe('main')
    expect(result.git_sha).toBe('abc123')
  })

  it('falls back across git providers for Vercel git metadata', () => {
    const result = formatWebhookInput(
      { provider: 'vercel', path: 'p', providerConfig: {} },
      { id: 'wf' },
      {
        type: 'deployment.created',
        payload: { deployment: { meta: { gitlabCommitRef: 'develop' } } },
      },
      req()
    )

    expect(result.git_branch).toBe('develop')
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
