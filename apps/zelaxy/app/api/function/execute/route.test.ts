import { NextRequest } from 'next/server'
/**
 * Tests for function execution API route
 *
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest } from '@/app/api/__test-utils__/utils'

const mockFreestyleExecuteScript = vi.fn()
const mockCreateContext = vi.fn()
const mockRunInContext = vi.fn()
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

describe('Function Execute API Route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    vi.doMock('vm', () => ({
      createContext: mockCreateContext,
      Script: vi.fn().mockImplementation(() => ({
        runInContext: mockRunInContext,
      })),
    }))

    vi.doMock('freestyle-sandboxes', () => ({
      FreestyleSandboxes: vi.fn().mockImplementation(() => ({
        executeScript: mockFreestyleExecuteScript,
      })),
    }))

    vi.doMock('@/lib/env', () => ({
      env: {
        FREESTYLE_API_KEY: 'test-freestyle-key',
      },
    }))

    vi.doMock('@/lib/logs/console/logger', () => ({
      createLogger: vi.fn().mockReturnValue(mockLogger),
    }))

    mockFreestyleExecuteScript.mockResolvedValue({
      result: 'freestyle success',
      logs: [],
    })

    mockRunInContext.mockResolvedValue('vm success')
    mockCreateContext.mockReturnValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Function Execution', () => {
    it('should execute simple JavaScript code successfully', async () => {
      const req = createMockRequest('POST', {
        code: 'return "Hello World"',
        timeout: 5000,
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.output).toHaveProperty('result')
      expect(data.output).toHaveProperty('executionTime')
    })

    it('should handle missing code parameter', async () => {
      const req = createMockRequest('POST', {
        timeout: 5000,
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data).toHaveProperty('error')
    })

    it('should use default timeout when not provided', async () => {
      const req = createMockRequest('POST', {
        code: 'return "test"',
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Function execution request/),
        expect.objectContaining({
          timeout: 5000, // default timeout
        })
      )
    })
  })

  describe('Template Variable Resolution', () => {
    it('should resolve environment variables with {{var_name}} syntax', async () => {
      const req = createMockRequest('POST', {
        code: 'return {{API_KEY}}',
        envVars: {
          API_KEY: 'secret-key-123',
        },
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // The code should be resolved to: return "secret-key-123"
    })

    it('should resolve tag variables with {{variable}} syntax', async () => {
      const req = createMockRequest('POST', {
        code: 'return {{email}}',
        params: {
          email: { id: '123', subject: 'Test Email' },
        },
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // The code should be resolved with the email object
    })

    it('exposes upstream block outputs on `inputs`, keyed by exact + normalized name + id', async () => {
      // Runs real isolate code that reads each key form, proving the `inputs` object is actually
      // usable rather than merely constructed.
      const { POST } = await import('@/app/api/function/execute/route')

      for (const expr of [
        "inputs['Analyze Updates'].content",
        'inputs.analyzeupdates.content',
        "inputs['blk-1'].content",
      ]) {
        const req = createMockRequest('POST', {
          code: `return ${expr}`,
          blockData: { 'blk-1': { content: 'hello' } },
          blockNameMapping: { 'Analyze Updates': 'blk-1' },
        })
        const response = await POST(req)
        const data = await response.json()
        expect(data.output.result).toBe('hello')
      }
    })

    it('should NOT treat email addresses as template variables', async () => {
      const req = createMockRequest('POST', {
        code: 'return "Email sent to user"',
        params: {
          email: {
            from: 'Waleed Latif <test@example.com>',
            to: 'User <user@example.com>',
          },
        },
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // Should not try to replace {{\1}} as a template variable
    })

    it('should only match valid variable names in double curly braces', async () => {
      const req = createMockRequest('POST', {
        code: 'return {{validVar}} + "{{validVar}}" + {{another_valid}}',
        params: {
          validVar: 'hello',
          another_valid: 'world',
        },
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // Should replace {{\1}} and {{\1}} but not {{\1}}
    })
  })

  describe('Gmail Email Data Handling', () => {
    it('should handle Gmail webhook data with email addresses containing angle brackets', async () => {
      const gmailData = {
        email: {
          id: '123',
          from: 'Waleed Latif <test@example.com>',
          to: 'User <user@example.com>',
          subject: 'Test Email',
          bodyText: 'Hello world',
        },
        rawEmail: {
          id: '123',
          payload: {
            headers: [
              { name: 'From', value: 'Waleed Latif <test@example.com>' },
              { name: 'To', value: 'User <user@example.com>' },
            ],
          },
        },
      }

      const req = createMockRequest('POST', {
        code: 'return {{email}}',
        params: gmailData,
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should properly serialize complex email objects with special characters', async () => {
      const complexEmailData = {
        email: {
          from: 'Test User <test@example.com>',
          bodyHtml: 'HTML content with "quotes" and \'apostrophes\'',
          bodyText: 'Text with\nnewlines\tand\ttabs',
        },
      }

      const req = createMockRequest('POST', {
        code: 'return {{email}}',
        params: complexEmailData,
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
    })
  })

  describe.skip('Freestyle Execution', () => {
    it('should use Freestyle when API key is available', async () => {
      const req = createMockRequest('POST', {
        code: 'return "freestyle test"',
      })

      const { POST } = await import('@/app/api/function/execute/route')
      await POST(req)

      expect(mockFreestyleExecuteScript).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Using Freestyle for code execution/)
      )
    })

    it('should handle Freestyle errors and fallback to VM', async () => {
      mockFreestyleExecuteScript.mockRejectedValueOnce(new Error('Freestyle API error'))

      const req = createMockRequest('POST', {
        code: 'return "fallback test"',
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(mockFreestyleExecuteScript).toHaveBeenCalled()
      expect(mockRunInContext).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Freestyle API call failed, falling back to VM:/),
        expect.any(Object)
      )
    })

    it('should handle Freestyle script errors', async () => {
      mockFreestyleExecuteScript.mockResolvedValueOnce({
        result: null,
        logs: [{ type: 'error', message: 'ReferenceError: undefined variable' }],
      })

      const req = createMockRequest('POST', {
        code: 'return undefinedVariable',
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('VM Execution', () => {
    it.skip('should use VM when Freestyle API key is not available', async () => {
      // Mock no Freestyle API key
      vi.doMock('@/lib/env', () => ({
        env: {
          FREESTYLE_API_KEY: undefined,
        },
      }))

      const req = createMockRequest('POST', {
        code: 'return "vm test"',
      })

      const { POST } = await import('@/app/api/function/execute/route')
      await POST(req)

      expect(mockFreestyleExecuteScript).not.toHaveBeenCalled()
      expect(mockRunInContext).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[.*\] Using VM for code execution \(no Freestyle API key available\)/
        )
      )
    })

    it('returns 500 with a useful message when user code throws', async () => {
      const req = createMockRequest('POST', {
        code: 'throw new Error("boom from user code")',
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('boom from user code')
    })

    it('captures console output before an error', async () => {
      const req = createMockRequest('POST', {
        code: 'console.log("side effect"); throw new Error("later")',
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.output.stdout).toContain('side effect')
    })
  })

  describe('Custom Tools', () => {
    it('should handle custom tool execution with direct parameter access', async () => {
      const req = createMockRequest('POST', {
        code: 'return location + " weather is sunny"',
        params: {
          location: 'San Francisco',
        },
        isCustomTool: true,
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // For custom tools, parameters should be directly accessible as variables
    })
  })

  describe('Security and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const req = new NextRequest('http://localhost:3000/api/function/execute', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(500)
    })

    it('should handle timeout parameter', async () => {
      const req = createMockRequest('POST', {
        code: 'return "test"',
        timeout: 10000,
      })

      const { POST } = await import('@/app/api/function/execute/route')
      await POST(req)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Function execution request/),
        expect.objectContaining({
          timeout: 10000,
        })
      )
    })

    it('should handle empty parameters object', async () => {
      const req = createMockRequest('POST', {
        code: 'return "no params"',
        params: {},
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
    })
  })

  describe('Enhanced Error Handling', () => {
    // These run real code through the isolate. The synthetic-stack-trace tests they replaced were
    // asserting the old vm implementation's stack parsing against fabricated stacks; the durable
    // contract is: a user-code error returns 500 with a message that names the real problem.

    it('classifies a ReferenceError and reports the missing name', async () => {
      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(
        createMockRequest('POST', { code: 'const x = 42;\nreturn undefinedVariable + x;' })
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('undefinedVariable is not defined')
      expect(data.debug?.errorType).toBe('ReferenceError')
    })

    it('classifies a TypeError from a null dereference', async () => {
      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(
        createMockRequest('POST', { code: 'const obj = null;\nreturn obj.someMethod();' })
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Cannot read properties of null')
      expect(data.debug?.errorType).toBe('TypeError')
    })

    it('reports a syntax error with a line number', async () => {
      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(
        createMockRequest('POST', {
          code: 'const obj = {\n  name: "test",\n  description: "unterminated\n}',
        })
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      // The isolate compiles the wrapped script, so the error carries a line reference
      expect(String(data.error)).toMatch(/line/i)
    })

    it('handles a plain thrown Error gracefully', async () => {
      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(
        createMockRequest('POST', { code: 'throw new Error("Generic error without stack trace")' })
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Generic error without stack trace')
      expect(data.debug).toBeDefined()
    })
  })

  describe('Utility Functions', () => {
    it('should properly escape regex special characters', async () => {
      // This tests the escapeRegExp function indirectly
      const req = createMockRequest('POST', {
        code: 'return {{special.chars+*?}}',
        envVars: {
          'special.chars+*?': 'escaped-value',
        },
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // Should handle special regex characters in variable names
    })

    it('should handle JSON serialization edge cases', async () => {
      // Test with complex but not circular data first
      const req = createMockRequest('POST', {
        code: 'return {{complexData}}',
        params: {
          complexData: {
            special: 'chars"with\'quotes',
            unicode: '🎉 Unicode content',
            nested: {
              deep: {
                value: 'test',
              },
            },
          },
        },
      })

      const { POST } = await import('@/app/api/function/execute/route')
      const response = await POST(req)

      expect(response.status).toBe(200)
    })
  })
})

describe('Function Execute API - Template Variable Edge Cases', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    vi.doMock('@/lib/logs/console/logger', () => ({
      createLogger: vi.fn().mockReturnValue(mockLogger),
    }))

    vi.doMock('@/lib/env', () => ({
      env: {
        FREESTYLE_API_KEY: 'test-freestyle-key',
      },
    }))

    vi.doMock('vm', () => ({
      createContext: mockCreateContext,
      Script: vi.fn().mockImplementation(() => ({
        runInContext: mockRunInContext,
      })),
    }))

    vi.doMock('freestyle-sandboxes', () => ({
      FreestyleSandboxes: vi.fn().mockImplementation(() => ({
        executeScript: mockFreestyleExecuteScript,
      })),
    }))

    mockFreestyleExecuteScript.mockResolvedValue({
      result: 'freestyle success',
      logs: [],
    })

    mockRunInContext.mockResolvedValue('vm success')
    mockCreateContext.mockReturnValue({})
  })

  it.skip('should handle nested template variables', async () => {
    mockFreestyleExecuteScript.mockResolvedValueOnce({
      result: 'environment-valueparam-value',
      logs: [],
    })

    const req = createMockRequest('POST', {
      code: 'return {{outer}} + {{inner}}',
      envVars: {
        outer: 'environment-value',
      },
      params: {
        inner: 'param-value',
      },
    })

    const { POST } = await import('@/app/api/function/execute/route')
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.output.result).toBe('environment-valueparam-value')
  })

  it.skip('should prioritize environment variables over params for {{}} syntax', async () => {
    mockFreestyleExecuteScript.mockResolvedValueOnce({
      result: 'env-wins',
      logs: [],
    })

    const req = createMockRequest('POST', {
      code: 'return {{conflictVar}}',
      envVars: {
        conflictVar: 'env-wins',
      },
      params: {
        conflictVar: 'param-loses',
      },
    })

    const { POST } = await import('@/app/api/function/execute/route')
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Environment variable should take precedence
    expect(data.output.result).toBe('env-wins')
  })

  it.skip('should handle missing template variables gracefully', async () => {
    mockFreestyleExecuteScript.mockResolvedValueOnce({
      result: '',
      logs: [],
    })

    const req = createMockRequest('POST', {
      code: 'return {{nonexistent}} + {{alsoNonexistent}}',
      envVars: {},
      params: {},
    })

    const { POST } = await import('@/app/api/function/execute/route')
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.output.result).toBe('')
  })
})
