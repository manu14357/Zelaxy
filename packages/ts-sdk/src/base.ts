import fetch, { type RequestInit, type Response } from 'node-fetch'
import { ZelaxyError } from './types'

export interface ClientConfig {
  apiKey: string
  baseUrl: string
}

export class BaseClient {
  protected apiKey: string
  protected baseUrl: string

  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
  }

  protected async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      ...((options.headers as Record<string, string>) || {}),
    }

    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any
      throw new ZelaxyError(
        errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorData.code,
        response.status
      )
    }

    const text = await response.text()
    if (!text) return undefined as T
    try {
      return JSON.parse(text) as T
    } catch {
      return text as T
    }
  }

  protected async requestRaw(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      ...((options.headers as Record<string, string>) || {}),
    }

    return fetch(url, { ...options, headers })
  }

  protected async get<T = any>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  protected async post<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  protected async patch<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  protected async del<T = any>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}
