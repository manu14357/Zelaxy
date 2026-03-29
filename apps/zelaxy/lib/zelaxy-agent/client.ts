import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ZelaxyAgentClient')

// Base URL for the zelaxy-agent service
const ZELAXY_AGENT_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_ZELAXY_AGENT_URL || 'https://zelaxy-agent.vercel.app'

export interface ZelaxyAgentRequest {
  workflowId: string
  userId?: string
  data?: Record<string, any>
}

export interface ZelaxyAgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

class ZelaxyAgentClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = ZELAXY_AGENT_BASE_URL
  }

  /**
   * Get the API key lazily to ensure environment variables are loaded
   */
  private getApiKey(): string {
    // Only try server-side env var (never expose to client)
    let apiKey = process.env.ZELAXY_AGENT_API_KEY || ''

    // If not found, try importing env library as fallback
    if (!apiKey) {
      try {
        const { env } = require('@/lib/env')
        apiKey = env.ZELAXY_AGENT_API_KEY || ''
      } catch (e) {
        // env library not available or failed to load
      }
    }

    if (!apiKey && typeof window === 'undefined') {
      // Only warn on server-side where API key should be available
      logger.warn('ZELAXY_AGENT_API_KEY not configured')
    }

    return apiKey
  }

  /**
   * Make a request to the zelaxy-agent service
   */
  async makeRequest<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      body?: Record<string, any>
      headers?: Record<string, string>
      apiKey?: string // Allow passing API key directly
    } = {}
  ): Promise<ZelaxyAgentResponse<T>> {
    const requestId = crypto.randomUUID().slice(0, 8)
    const { method = 'POST', body, headers = {}, apiKey: providedApiKey } = options

    try {
      const url = `${this.baseUrl}${endpoint}`

      // Use provided API key or try to get it from environment
      const apiKey = providedApiKey || this.getApiKey()
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-api-key': apiKey }),
        ...headers,
      }

      logger.info(`[${requestId}] Making request to zelaxy-agent`, {
        url,
        method,
        hasApiKey: !!apiKey,
        hasBody: !!body,
      })

      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
      }

      if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body)
      }

      const response = await fetch(url, fetchOptions)
      const responseStatus = response.status

      let responseData
      try {
        const responseText = await response.text()
        responseData = responseText ? JSON.parse(responseText) : null
      } catch (parseError) {
        logger.error(`[${requestId}] Failed to parse response`, parseError)
        return {
          success: false,
          error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
          status: responseStatus,
        }
      }

      logger.info(`[${requestId}] Response received`, {
        status: responseStatus,
        success: response.ok,
        hasData: !!responseData,
      })

      return {
        success: response.ok,
        data: responseData,
        error: response.ok ? undefined : responseData?.error || `HTTP ${responseStatus}`,
        status: responseStatus,
      }
    } catch (fetchError) {
      logger.error(`[${requestId}] Request failed`, fetchError)
      return {
        success: false,
        error: `Connection failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        status: 0,
      }
    }
  }

  /**
   * Generic method for custom API calls
   */
  async call<T = any>(
    endpoint: string,
    request: ZelaxyAgentRequest,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
  ): Promise<ZelaxyAgentResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method,
      body: {
        workflowId: request.workflowId,
        userId: request.userId,
        ...request.data,
      },
    })
  }

  /**
   * Get the current configuration
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.getApiKey(),
      environment: process.env.NODE_ENV,
    }
  }

  /**
   * Check if the zelaxy-agent service is healthy
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('/health', { method: 'GET' })
      return response.success && response.data?.healthy === true
    } catch (error) {
      logger.error('Zelaxy-agent health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const zelaxyAgentClient = new ZelaxyAgentClient()

// Export types and class for advanced usage
export { ZelaxyAgentClient }
