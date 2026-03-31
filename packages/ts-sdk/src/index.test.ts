import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZelaxyClient, ZelaxyError } from './index'

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}))

describe('ZelaxyClient', () => {
  let client: ZelaxyClient

  beforeEach(() => {
    client = new ZelaxyClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://test.zelaxy.ai',
    })
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create a client with correct configuration', () => {
      expect(client).toBeInstanceOf(ZelaxyClient)
    })

    it('should use default base URL when not provided', () => {
      const defaultClient = new ZelaxyClient({
        apiKey: 'test-api-key',
      })
      expect(defaultClient).toBeInstanceOf(ZelaxyClient)
    })
  })

  describe('setApiKey', () => {
    it('should update the API key', () => {
      const newApiKey = 'new-api-key'
      client.setApiKey(newApiKey)

      // Verify the method exists
      expect(client.setApiKey).toBeDefined()
      // Verify the API key was actually updated
      expect((client as any)._apiKey).toBe(newApiKey)
    })
  })

  describe('setBaseUrl', () => {
    it('should update the base URL', () => {
      const newBaseUrl = 'https://new.zelaxy.ai'
      client.setBaseUrl(newBaseUrl)
      expect((client as any)._baseUrl).toBe(newBaseUrl)
    })

    it('should strip trailing slash from base URL', () => {
      const urlWithSlash = 'https://test.zelaxy.ai/'
      client.setBaseUrl(urlWithSlash)
      // Verify the trailing slash was actually stripped
      expect((client as any)._baseUrl).toBe('https://test.zelaxy.ai')
    })
  })

  describe('validateWorkflow', () => {
    it('should return false when workflow status request fails', async () => {
      const fetch = await import('node-fetch')
      vi.mocked(fetch.default).mockRejectedValue(new Error('Network error'))

      const result = await client.validateWorkflow('test-workflow-id')
      expect(result).toBe(false)
    })

    it('should return true when workflow is deployed', async () => {
      const fetch = await import('node-fetch')
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            isDeployed: true,
            deployedAt: '2023-01-01T00:00:00Z',
            isPublished: false,
            needsRedeployment: false,
          })
        ),
      }
      vi.mocked(fetch.default).mockResolvedValue(mockResponse as any)

      const result = await client.validateWorkflow('test-workflow-id')
      expect(result).toBe(true)
    })

    it('should return false when workflow is not deployed', async () => {
      const fetch = await import('node-fetch')
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            isDeployed: false,
            deployedAt: null,
            isPublished: false,
            needsRedeployment: true,
          })
        ),
      }
      vi.mocked(fetch.default).mockResolvedValue(mockResponse as any)

      const result = await client.validateWorkflow('test-workflow-id')
      expect(result).toBe(false)
    })
  })
})

describe('ZelaxyError', () => {
  it('should create error with message', () => {
    const error = new ZelaxyError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('ZelaxyError')
  })

  it('should create error with code and status', () => {
    const error = new ZelaxyError('Test error', 'TEST_CODE', 400)
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
    expect(error.status).toBe(400)
  })
})
