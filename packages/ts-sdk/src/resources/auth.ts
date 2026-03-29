import { BaseClient } from '../base'
import type { ApiKey, OAuthConnection, User } from '../types'

export class AuthResource extends BaseClient {
  async me(): Promise<User> {
    return this.get<User>('/api/users/me')
  }

  async profile(): Promise<User> {
    return this.get<User>('/api/auth/profile')
  }

  async updateProfile(params: { name?: string; image?: string }): Promise<User> {
    return this.patch<User>('/api/auth/update-profile', params)
  }

  async apiKeys(): Promise<ApiKey[]> {
    const result = await this.get<ApiKey[] | { data: ApiKey[] }>('/api/users/me/api-keys')
    return Array.isArray(result) ? result : result.data
  }

  async createApiKey(name: string): Promise<ApiKey> {
    return this.post<ApiKey>('/api/users/me/api-keys', { name })
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.del(`/api/users/me/api-keys/${id}`)
  }

  async oauthConnections(): Promise<OAuthConnection[]> {
    const result = await this.get<OAuthConnection[] | { data: OAuthConnection[] }>(
      '/api/auth/oauth/connections'
    )
    return Array.isArray(result) ? result : result.data
  }

  async disconnectOAuth(provider: string): Promise<void> {
    await this.post('/api/auth/oauth/disconnect', { provider })
  }

  async settings(): Promise<any> {
    return this.get('/api/users/me/settings')
  }

  async updateSettings(settings: Record<string, any>): Promise<any> {
    return this.patch('/api/users/me/settings', settings)
  }
}
