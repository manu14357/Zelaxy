/**
 * Tests for Stagehand Agent tool config
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { agentTool } from '@/tools/stagehand/agent'

describe('Stagehand Agent Tool Config', () => {
  it('should expose the stagehand agent tool id and endpoint', () => {
    expect(agentTool.id).toBe('stagehand_agent')
    expect(agentTool.request.url).toBe('/api/tools/stagehand/agent')
    expect(agentTool.request.method).toBe('POST')
  })

  it('should include model selection params with defaults', () => {
    expect(agentTool.params.provider.default).toBe('anthropic')
    expect(agentTool.params.model.default).toBe('anthropic/claude-sonnet-4-5')
    expect(agentTool.params.mode.default).toBe('hybrid')
    expect(agentTool.params.maxSteps.default).toBe(20)
    expect(agentTool.params.useSearch.default).toBe(false)
  })

  it('should normalize bare startUrl values and pass advanced options', () => {
    const body = agentTool.request.body!({
      startUrl: 'example.com/login',
      task: 'Log in and collect account details',
      provider: 'openai',
      model: 'openai/gpt-4o',
      mode: 'dom',
      maxSteps: 12,
      useSearch: true,
      systemPrompt: 'Prefer deterministic actions.',
      excludeTools: ['extract'],
      apiKey: 'test-key',
      browserbaseApiKey: 'bb-key',
      browserbaseProjectId: 'bb-project',
      customTools: [{ name: 'my-tool' }],
      mcpServers: [{ name: 'my-mcp' }],
      outputSchema: { type: 'object' },
      variables: { username: 'x' },
    })

    expect(body.startUrl).toBe('https://example.com/login')
    expect(body.provider).toBe('openai')
    expect(body.model).toBe('openai/gpt-4o')
    expect(body.mode).toBe('dom')
    expect(body.maxSteps).toBe(12)
    expect(body.useSearch).toBe(true)
    expect(body.systemPrompt).toBe('Prefer deterministic actions.')
    expect(body.excludeTools).toEqual(['extract'])
    expect(body.browserbaseApiKey).toBe('bb-key')
    expect(body.browserbaseProjectId).toBe('bb-project')
    expect(body.customTools).toEqual([{ name: 'my-tool' }])
    expect(body.mcpServers).toEqual([{ name: 'my-mcp' }])
  })

  it('should mark transformResponse success when HTTP and agent result are successful', async () => {
    const response = new Response(
      JSON.stringify({
        agentResult: {
          success: true,
          completed: true,
          message: 'done',
          actions: [],
        },
        structuredOutput: { value: 1 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    const result = await agentTool.transformResponse!(response)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.output.agentResult.success).toBe(true)
    expect(result.output.structuredOutput).toEqual({ value: 1 })
  })

  it('should mark transformResponse as failed when agent result is unsuccessful', async () => {
    const response = new Response(
      JSON.stringify({
        agentResult: {
          success: false,
          completed: false,
          message: 'Failed to execute task: Cannot read properties of null (reading awaitActivePage)',
          actions: [],
        },
        structuredOutput: {},
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    const result = await agentTool.transformResponse!(response)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to execute task')
    expect(result.output.agentResult.success).toBe(false)
  })
})
