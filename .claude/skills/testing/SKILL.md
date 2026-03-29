---
name: testing
description: 'Write, review, and debug tests using Vitest. Use for: unit tests, handler tests, executor tests, block tests, global mocks, test patterns, coverage requirements, vi.fn() mocking, test file conventions.'
---

# Testing Skill — Zelaxy

## Purpose
Write, review, and debug tests for the Zelaxy monorepo using Vitest.

## When to Use
- Writing unit tests for blocks, tools, handlers, or utilities
- Writing integration tests for the executor
- Debugging failing tests
- Adding test coverage to existing code
- Reviewing test quality

## Test Infrastructure

### Config
- **Framework**: Vitest
- **Config**: `apps/zelaxy/vitest.config.ts`
- **Setup**: `apps/zelaxy/vitest.setup.ts`
- **Environment**: Node.js
- **Globals**: `true` (no need to import `describe`, `it`, `expect`)
- **Path alias**: `@/` → project root

### Commands
```bash
bun run test              # Run all tests
bun run test -- --watch   # Watch mode
bun run test -- --ui      # Vitest UI
bun run test -- --coverage # Coverage report
```

### Global Mocks (vitest.setup.ts)
These are automatically mocked in every test:

```typescript
// fetch → returns { ok: true, json: () => {} }
global.fetch = vi.fn()

// Logger → spy functions (info, warn, error, debug)
vi.mock('@/lib/logger')

// Block registry → minimal mock BlockConfig
vi.mock('@/blocks')

// Console → suppressed for expected errors
console.error = vi.fn()
console.warn = vi.fn()
```

## Test Patterns

### Unit Test (utility function)
```typescript
// utils.test.ts
import { resolveOutputType } from './utils'

describe('resolveOutputType', () => {
  it('resolves primitive types', () => {
    expect(resolveOutputType('string')).toBe('string')
  })

  it('handles nested objects', () => {
    const result = resolveOutputType({ name: 'string', age: 'number' })
    expect(result).toEqual({ name: 'string', age: 'number' })
  })
})
```

### Handler Test
```typescript
// handlers/api-handler.test.ts
import { apiHandler } from './api-handler'
import type { ExecutionContext } from '../types'

describe('apiHandler', () => {
  const mockContext: ExecutionContext = {
    workflowId: 'wf-1',
    executionId: 'exec-1',
    blockStates: {},
    environmentVariables: {},
    // ... minimal required fields
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes GET request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
      headers: new Headers(),
    } as Response)

    const result = await apiHandler.execute(
      { id: 'b1', type: 'api', config: { method: 'GET', url: 'https://api.example.com' } },
      {},
      mockContext
    )

    expect(result.response.data).toEqual({ data: 'test' })
    expect(result.response.status).toBe(200)
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    await expect(
      apiHandler.execute(
        { id: 'b1', type: 'api', config: { method: 'GET', url: 'https://fail.com' } },
        {},
        mockContext
      )
    ).rejects.toThrow('Network error')
  })
})
```

### Executor Integration Test
```typescript
// executor/index.test.ts
import { Executor } from './index'

describe('Executor', () => {
  it('executes blocks in topological order', async () => {
    const executor = new Executor({
      blocks: [
        { id: 'a', type: 'function', dependencies: [] },
        { id: 'b', type: 'function', dependencies: ['a'] },
      ],
      edges: [{ source: 'a', target: 'b' }],
    })

    const result = await executor.execute()
    expect(result.blockStates['a'].status).toBe('completed')
    expect(result.blockStates['b'].status).toBe('completed')
  })
})
```

### Block Definition Test
```typescript
// blocks/blocks/my-block.test.ts
import { myBlockConfig } from './my-block'

describe('myBlockConfig', () => {
  it('has required fields', () => {
    expect(myBlockConfig.type).toBeDefined()
    expect(myBlockConfig.toolbar).toBeDefined()
    expect(myBlockConfig.outputs).toBeDefined()
  })

  it('has valid sub-block types', () => {
    for (const row of myBlockConfig.subBlocks) {
      for (const subBlock of row) {
        expect(subBlock.type).toBeDefined()
        expect(subBlock.id).toBeDefined()
      }
    }
  })
})
```

## Test Organization

### File placement
- Co-locate: `executor/index.ts` → `executor/index.test.ts`
- Test utilities: `executor/__test-utils__/`
- Integration tests: `executor/tests/`

### Naming
- `describe` → module or function name
- `it` → behavior description starting with verb
- Test file → `<source-file>.test.ts`

## Mocking Guidelines

### Mock external services (always)
```typescript
vi.mock('@/services/mcp', () => ({
  MCPService: { callTool: vi.fn() }
}))
```

### Mock database (for handler tests)
```typescript
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  }
}))
```

### Mock OAuth credentials
```typescript
vi.mock('@/lib/oauth/oauth', () => ({
  getCredentials: vi.fn().mockResolvedValue({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
  })
}))
```

### Do NOT mock
- Pure utility functions
- Type definitions
- Configuration constants

## Coverage Expectations
- **Executor**: High coverage — critical path
- **Handlers**: Each handler should have happy path + error cases
- **Blocks**: Config validation tests
- **Tools**: Request/response transformation tests
- **API routes**: Auth, validation, response format
- **UI**: Component rendering + interaction (if using Testing Library)

## Common Test Issues
1. **Async leaks**: Always `await` async operations, use `vi.waitFor()` for eventual assertions
2. **Mock pollution**: Use `beforeEach(() => vi.clearAllMocks())`
3. **Path aliases**: Ensure `@/` alias works (configured in vitest.config.ts)
4. **Drizzle mocks**: Mock the query builder chain, not individual methods
5. **Streaming tests**: Use `ReadableStream` mocks for SSE/streaming tests
