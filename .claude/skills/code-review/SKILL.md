---
name: code-review
description: 'Review code changes for correctness, conventions, performance, and security. Use for: PR review, code quality checks, Biome linting rules, import ordering, TypeScript conventions, anti-pattern detection.'
---

# Code Review Skill — Zelaxy

## Purpose
Review code changes in the Zelaxy monorepo for correctness, consistency with project conventions, performance, and security.

## When to Use
- Reviewing pull requests or code diffs
- Checking new block or tool implementations
- Auditing API routes for security and validation
- Verifying executor/handler changes for correctness

## Project Conventions

### TypeScript
- **Strict mode** enabled (`tsconfig.json`)
- TypeScript 5.7+ with 100% TypeScript codebase
- No `any` unless absolutely necessary — prefer `unknown` + type narrowing
- Use `as const` for literal types
- Prefer `interface` for object shapes, `type` for unions/intersections

### Imports (Biome enforced order)
```
1. Node builtins + React
2. External packages
3. @/components
4. @/lib
5. @/app
6. Other aliases
7. Relative imports
```

### Formatting (Biome)
- 2-space indentation
- 100-char line width
- Single quotes for JSX
- Semicolons required
- Trailing commas
- Bracket spacing enabled

### File Organization
- One export per file for blocks and tools
- Barrel exports via `index.ts`
- Co-locate tests next to source (`*.test.ts`)
- Handlers in dedicated `handlers/` directories

## Review Checklist

### General
- [ ] No `console.log` in production code (use structured logger)
- [ ] No hardcoded secrets, URLs, or credentials
- [ ] Error handling with proper error types
- [ ] Zod validation at API boundaries
- [ ] No unnecessary `any` types

### Blocks
- [ ] Follows `BlockConfig` interface from `blocks/types.ts`
- [ ] Registered in `blocks/registry.ts`
- [ ] Has proper `outputs` schema
- [ ] Sub-blocks use correct `SubBlockType` (31 types available)
- [ ] Wand configuration if AI-assisted fields needed
- [ ] Conditional visibility (`condition`) defined correctly

### Tools
- [ ] Implements `ToolConfig<P, R>` from `tools/types.ts`
- [ ] Registered in `tools/registry.ts`
- [ ] Parameters have correct `visibility` (`user-or-llm` | `user-only` | `llm-only` | `hidden`)
- [ ] OAuth credentials fetched from DB, not hardcoded
- [ ] `transformResponse` handles edge cases
- [ ] Timing support included (`startTime`, `endTime`, `duration`)

### Executor/Handlers
- [ ] Implements `BlockHandler` interface: `execute(block, inputs, context): Promise<BlockOutput>`
- [ ] Handles `ExecutionContext` immutably
- [ ] Input references resolved via `<block.blockName.output.field>` syntax
- [ ] Loop handlers respect `stopOnError` flag
- [ ] Parallel handlers handle both `count` and `collection` strategies
- [ ] Streaming output uses `ResponseFormatStreamProcessor` correctly

### API Routes
- [ ] Auth check via `getSession()` or middleware
- [ ] Workspace scoping (multi-tenant isolation)
- [ ] Zod schema validation on request body
- [ ] Standard response format: `{ success, data?, error?, metadata? }`
- [ ] Proper HTTP status codes (401, 403, 400, 404, 500)
- [ ] Rate limiting where appropriate

### Database
- [ ] Drizzle ORM queries use proper relations
- [ ] JSONB fields typed with Drizzle's `.$type<T>()`
- [ ] Indexes on frequently queried columns
- [ ] No raw SQL unless absolutely necessary
- [ ] Migrations tested with `bunx drizzle-kit migrate`

### UI Components
- [ ] Uses shadcn/ui (Radix) primitives
- [ ] Tailwind classes follow project theme (zelaxy-orange primary)
- [ ] Dark mode compatible (class-based)
- [ ] Inter font family
- [ ] No inline styles — use Tailwind utilities
- [ ] Accessible (keyboard navigation, ARIA labels)

### Security
- [ ] No SQL injection (Drizzle ORM parameterized by default)
- [ ] No XSS (React auto-escapes, but check `dangerouslySetInnerHTML`)
- [ ] OAuth tokens encrypted in DB (`credentialData` JSONB)
- [ ] API keys validated at middleware level
- [ ] CSRF protection via better-auth
- [ ] Input sanitization on user-provided content

## Common Anti-Patterns to Flag
1. **Mutable context** — `ExecutionContext` should be treated as immutable
2. **Missing error boundaries** — Handler failures should be caught and logged
3. **Unbounded queries** — Always paginate DB queries
4. **Missing workspace scoping** — All queries must filter by workspaceId/organizationId
5. **Synchronous heavy operations** — Use `async/await` and stream where possible
6. **Direct DOM manipulation** — Use React state, not `document.querySelector`
