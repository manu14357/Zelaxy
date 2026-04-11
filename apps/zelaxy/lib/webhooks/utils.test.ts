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

import { formatWebhookInput } from '@/lib/webhooks/utils'

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
