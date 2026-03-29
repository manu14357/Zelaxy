import { BaseClient } from '../base'
import type { ChatMessage, ChatOptions, ChatResponse } from '../types'

export class ChatResource extends BaseClient {
  async send(options: ChatOptions & { message: string }): Promise<ChatResponse> {
    const { message, history = [], ...rest } = options

    const messages: ChatMessage[] = [...history, { role: 'user', content: message }]

    return this.post<ChatResponse>('/api/copilot/direct-chat', {
      messages,
      ...rest,
    })
  }

  async *stream(options: ChatOptions & { message: string }): AsyncGenerator<string, void, unknown> {
    const { message, history = [], ...rest } = options

    const messages: ChatMessage[] = [...history, { role: 'user', content: message }]

    const response = await this.requestRaw('/api/copilot/direct-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        stream: true,
        ...rest,
      }),
    })

    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as any
      throw new Error(err.error || `Chat failed: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body for streaming')
    }

    const decoder = new TextDecoder()
    for await (const chunk of response.body) {
      const text = decoder.decode(chunk as Buffer, { stream: true })
      const lines = text.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') return
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              yield parsed.content
            } else if (typeof parsed === 'string') {
              yield parsed
            }
          } catch {
            // May be a plain text chunk
            if (data) yield data
          }
        }
      }
    }
  }

  async listChats(): Promise<any[]> {
    const result = await this.get<any[]>('/api/copilot/chat')
    return Array.isArray(result) ? result : []
  }
}
