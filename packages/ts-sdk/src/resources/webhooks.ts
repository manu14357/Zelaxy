import { BaseClient } from '../base'
import type { Webhook, WebhookCreateParams } from '../types'

export class WebhooksResource extends BaseClient {
  async list(): Promise<Webhook[]> {
    const result = await this.get<Webhook[] | { data: Webhook[] }>('/api/webhooks')
    return Array.isArray(result) ? result : result.data
  }

  async get_(id: string): Promise<Webhook> {
    return this.get<Webhook>(`/api/webhooks/${id}`)
  }

  async create(params: WebhookCreateParams): Promise<Webhook> {
    return this.post<Webhook>('/api/webhooks', params)
  }

  async update(id: string, params: Partial<WebhookCreateParams>): Promise<Webhook> {
    return this.patch<Webhook>(`/api/webhooks/${id}`, params)
  }

  async delete_(id: string): Promise<void> {
    await this.del(`/api/webhooks/${id}`)
  }

  async test(id: string): Promise<any> {
    return this.post(`/api/webhooks/test`, { webhookId: id })
  }
}
