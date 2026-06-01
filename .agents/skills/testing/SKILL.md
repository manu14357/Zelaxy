---
name: testing
description: 'Write, review, and debug tests using Vitest. Use for: unit tests, API route tests, executor/serializer/tool tests, jsdom vs node environment selection, shared __test-utils__ patterns, and mandatory code-to-test sync with executed test runs.'
---

# Testing Skill - Zelaxy

## Purpose
Write, review, and debug automated tests in this monorepo, with primary focus on `apps/zelaxy` and secondary focus on `packages/ts-sdk`.

## Non-Negotiable Rule: Code-Test Sync

When production code changes, test work is required in the same task.

1. Update or add tests for the changed behavior.
2. Run relevant tests before completion.
3. Report exactly what commands were run and whether they passed.
4. If tests cannot be run, explain why and what remains to validate.
5. "No test changes needed" should be rare and explicitly justified.

Do not finish code changes without test updates and execution evidence unless the user explicitly waives testing.

## When to Use
- Adding or modifying code in blocks, tools, executor, API routes, stores, UI, or shared libs
- Writing new test files
- Fixing failing Vitest suites
- Improving test coverage around regressions
- Reviewing test quality and missing scenarios

## Test Infrastructure

### Primary app (`apps/zelaxy`)
- Framework: Vitest 3
- Config: `apps/zelaxy/vitest.config.ts`
- Global setup: `apps/zelaxy/vitest.setup.ts`
- Default test environment: `node`
- Globals: enabled (`describe`, `it`, `expect`, `vi` available globally)
- Include pattern: `**/*.test.{ts,tsx}`
- Core alias: `@` -> `apps/zelaxy` root

### TS SDK (`packages/ts-sdk`)
- Framework: Vitest 3
- Config: `packages/ts-sdk/vitest.config.ts`
- Environment: `node`
- Include patterns: `src/**/*.test.{ts,tsx}`, `tests/**/*.test.{ts,tsx}`

### Global test setup behavior (apps/zelaxy)
`vitest.setup.ts` sets baseline mocks and behavior:
- `global.fetch` mocked
- logger and selected Zustand stores mocked
- block registry helper mocked
- `@testing-library/jest-dom/vitest` loaded for DOM assertions
- noisy expected console warnings/errors filtered (notably Zustand persist warnings)

## Command Reference

### From repo root
```bash
bun run test
```
Runs `turbo run test` across workspace packages with test scripts.

### From `apps/zelaxy`
```bash
bun run test
bun run test:watch
bun run test:coverage
bun run test -- app/api/folders/route.test.ts
bun run test -- executor/index.test.ts
bun run test -- -t "should return 401 for unauthenticated requests"
```

### From `packages/ts-sdk`
```bash
bun run test
bun run test:watch
```

Use targeted test runs while iterating, then run broader suites when changes touch shared runtime paths.

## Environment Selection Rules

Default is `node`. Use per-file override when DOM APIs are required:

```ts
/**
 * @vitest-environment jsdom
 */
```

Guidance:
- Use `node` for API routes, executor, serializer, socket server, services, DB utilities.
- Use `jsdom` for React components, UI interactions, and DOM-dependent store behavior.

## File Placement and Naming

- Co-locate tests with source where practical: `foo.ts` -> `foo.test.ts`.
- API route tests: keep `route.test.ts` next to route file.
- Executor deep integration tests: use `apps/zelaxy/executor/tests/`.
- Reusable fixtures/mocks: keep in domain `__test-utils__` folders.
- Use behavior-driven test names (`should ...`).

## Shared Test Utilities (Use These First)

### API helpers
`apps/zelaxy/app/api/__test-utils__/utils.ts`
- `mockAuth()`
- `setupCommonApiMocks()`
- `createMockRequest()`
- `createMockDatabase()`
- `setupComprehensiveTestMocks()` (preferred for new broad API tests)
- legacy helpers still present: `createMockTransaction()`, `mockAuthSession()`

Important route-test pattern:
1. set up `vi.doMock(...)` and auth/db mocks
2. dynamically import route handler (`await import(...)`)
3. invoke `GET/POST/PUT/DELETE` and assert response

### Executor helpers
`apps/zelaxy/executor/__test-utils__/executor-mocks.ts`
- `setupAllMocks()`
- workflow factories (`createMinimalWorkflow`, loop/parallel/router variants)
- context factories (`createMockContext`)
- handler/store/core executor mock setup helpers

### Tool helpers
`apps/zelaxy/tools/__test-utils__/test-tools.ts`
- `ToolTester` for controlled tool execution tests
- `createMockFetch()`, `createErrorFetch()`
- `mockEnvironmentVariables()`
- `mockOAuthTokenRequest()`

### Serializer fixtures
`apps/zelaxy/serializer/__test-utils__/test-workflows.ts`
- reusable workflow fixtures for serializer behavior tests

## Domain-by-Domain Test Requirements

### API route changes
Minimum cases:
1. unauthenticated request
2. invalid input or missing required fields
3. permission or authorization constraints
4. success path
5. internal error handling

Also verify response shape/status contract used by that route family.

### Executor or handler changes
Minimum cases:
1. normal execution path
2. failure path
3. routing/path semantics (condition/router/parallel/loop as applicable)
4. regression case for the bug or behavior change

### Tool changes
Minimum cases:
1. parameter validation behavior
2. request shaping (URL, method, headers, body)
3. transform/post-process behavior
4. error propagation

### Block config or serializer changes
Minimum cases:
1. block-to-tool mapping behavior
2. parameter transformation behavior
3. required parameter validation behavior
4. serialization output for changed block types

### UI/store changes
Minimum cases:
1. render baseline
2. primary interaction path
3. state update effect
4. error/disabled or edge interaction path

Use `jsdom` and Testing Library where interaction is DOM-driven.

## Mocking and Isolation Guidelines

- Prefer mocking external boundaries (network, DB, provider SDKs), not pure logic.
- Clear/reset mocks between tests (`vi.clearAllMocks()`, `vi.resetAllMocks()` as needed).
- Use `vi.resetModules()` when module-level state or `vi.doMock` order matters.
- Override `global.fetch` per-suite when behavior-specific assertions are needed.
- Keep mocks minimal and aligned to real interfaces to avoid false positives.

## Test Review Checklist (Before Completion)

1. Do tests cover changed behavior and at least one failure/edge case?
2. Are tests colocated and named consistently?
3. Are correct environment annotations used (`node` vs `jsdom`)?
4. Are mock lifecycles cleaned up to avoid cross-test leakage?
5. Were relevant tests executed locally?
6. Were executed commands and results reported?

## Common Pitfalls

1. Changing implementation without updating corresponding tests.
2. Running no tests (or only unrelated tests) after behavior changes.
3. Importing route handlers before setting `vi.doMock` dependencies.
4. Forgetting environment override for DOM-dependent tests.
5. Over-mocking internal logic instead of testing real behavior boundaries.
6. Leaving flaky assertions tied to unstable timestamps or ordering.
7. Assuming one global response schema across all API route families.
8. Treating coverage command output as mandatory threshold enforcement (no strict global threshold is configured).
