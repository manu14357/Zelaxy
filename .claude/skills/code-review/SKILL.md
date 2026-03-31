---
name: code-review
description: 'Review code changes for correctness, conventions, performance, security, and test coverage. Use for: PR review, regression-risk analysis, Biome/TypeScript convention checks, API auth and validation review, block/tool contract audits, and severity-ordered findings.'
---

# Code Review Skill - Zelaxy

## Purpose
Perform repository-accurate code reviews that prioritize bugs, regressions, security risks, and missing tests over style-only comments.

## Non-Negotiable Review Output Format

When asked to "review":

1. List findings first, ordered by severity (`critical`, `high`, `medium`, `low`).
2. Include exact file and line references for each finding.
3. Explain impact and concrete fix suggestion.
4. Add open questions/assumptions after findings.
5. Add summary last.

If no issues are found, explicitly say so and call out residual risks/testing gaps.

## Non-Negotiable Rule: Code-Test Sync

If a change modifies behavior:

1. Confirm tests were updated or justify why unchanged.
2. Run relevant tests.
3. Report exact test commands and outcomes.
4. Treat missing test coverage as a review finding.

## When to Use
- PR/diff reviews
- Auditing API routes for auth, validation, and tenant isolation
- Reviewing block/tool additions or executor changes
- Validating correctness after performance/security refactors

## Review Workflow (Required)

1. Inspect diff and identify touched domains (`api`, `executor`, `blocks`, `tools`, `stores`, `db`, `ui`).
2. Validate against hard contracts (types/interfaces/registry patterns).
3. Run static checks and targeted tests for touched areas.
4. Report severity-ordered findings with file/line evidence.
5. Call out missing tests, docs drift, and rollout risk.

## Repo-Enforced Conventions

### Biome and formatting

From `biome.json`:

- Indentation: 2 spaces
- Line width: 100
- Quote style: single quotes (including JSX)
- Semicolons: `asNeeded` (do not enforce "always")
- Import organize groups:
  1. `:NODE:`, `react`, `react/**`
  2. `:PACKAGE:`
  3. `@/components/**`
  4. `@/lib/**`
  5. `@/app/**`
  6. `:ALIAS:`
  7. `:RELATIVE:`

Rule nuance reviewers must respect:

- `noExplicitAny` is disabled.
- `noUnusedVariables` and `noUnusedFunctionParameters` are disabled.
- Some strict style rules are enabled (`useAsConstAssertion`, `noInferrableTypes`, etc.).

### TypeScript strictness

- `apps/zelaxy/tsconfig.json`: `strict: true`
- `packages/ts-sdk/tsconfig.json`: `strict: true`

Reviewer focus should be runtime correctness and contract safety, not forcing style rules that the repo does not enforce.

## Domain-Specific Review Checks

### API routes (`apps/zelaxy/app/api/**`)

1. Auth model matches route intent:
	- user routes usually `getSession()`
	- internal/system routes may use `x-api-key` (`env.INTERNAL_API_SECRET`)
2. Request validation uses Zod parse/safeParse before DB/tool calls.
3. Tenant boundaries enforced (`userId`, `workspaceId`, `organizationId` where required).
4. Error handling does not leak secrets/tokens.
5. Response shape stays consistent with local module pattern.
	- Some routes use `createErrorResponse`/`createSuccessResponse`
	- Others return `NextResponse.json({ success: ... })`
	- Do not force a single response wrapper repo-wide.

### Blocks (`apps/zelaxy/blocks/**`)

1. New/changed blocks satisfy `BlockConfig` and `SubBlockConfig` contracts.
2. Block type is present in `blocks/registry.ts`.
3. Inputs/outputs/subblocks remain consistent with handler expectations.
4. Docs parity check for block additions/renames:
	- `apps/docs/content/docs/blocks/*.mdx`
5. Watch for slug/type drift (underscore vs hyphen mapping in docs slugs).

### Tools (`apps/zelaxy/tools/**`)

1. Tool definitions satisfy `ToolConfig`/`ToolResponse` expectations.
2. Tool is registered in `tools/registry.ts`.
3. Parameter visibility (`user-or-llm` | `user-only` | `llm-only` | `hidden`) is deliberate.
4. OAuth/credential paths use secure token retrieval flows (no hardcoded secrets).
5. Transform/post-process logic handles failure paths and preserves typed output shape.

### Executor (`apps/zelaxy/executor/**`)

1. Preserve layer-based execution semantics (parallel per dependency layer).
2. Preserve streaming contracts (`StreamingExecution`, stream processing behavior).
3. Validate loop/parallel edge-case handling (`stopOnError`, iteration state, branch failures).
4. Check for shared context mutation that can cause cross-branch regressions.
5. Require regression tests for execution-path changes.

### Database and queries (`apps/zelaxy/db/**`, `apps/zelaxy/lib/**`)

1. Ensure tenant/user scope is present on data reads/writes when required.
2. Avoid performance regressions (unbounded queries, missing filters).
3. Raw SQL is acceptable when justified (for example vector/hybrid search paths) but must be parameter-safe and tested.
4. Schema/migration changes require matching application usage updates.

### UI and state (`apps/zelaxy/app/**`, `apps/zelaxy/components/**`, `apps/zelaxy/stores/**`)

1. Verify no hydration hazards in SSR paths.
2. Check selector breadth in Zustand usage to avoid avoidable rerenders.
3. Confirm accessibility regressions are not introduced in interactive components.
4. Respect existing typography/theme conventions per surface (Inter and Geist are both used in repo contexts).

## Commands for Review Validation

Prefer non-destructive checks first:

```bash
# repo root
bun run check
bun run type-check
bun run test
```

Targeted examples:

```bash
cd apps/zelaxy
bun run test -- app/api/chat/route.test.ts
bun run test -- executor/utils.test.ts

cd packages/ts-sdk
bun run test
```

## High-Value Findings to Prioritize

1. Authorization bypass or missing tenant scoping.
2. Missing/incorrect validation before side effects.
3. Behavior changes without test updates.
4. Executor control-flow regressions (loop/parallel/stream).
5. Registry drift (block/tool implemented but not wired).
6. Docs drift for block/tool surface changes.
7. Performance regressions on hot paths.
8. Error handling that hides failures or leaks sensitive details.

## Common False Positives to Avoid

1. "No console usage ever" as an absolute rule. Repo contains intentional console usage in some runtime paths and scripts.
2. "No any allowed" as a hard blocker. `noExplicitAny` is disabled; judge by risk, boundaries, and unsafe propagation.
3. "Every API must return identical wrapper shape." Follow local module conventions.
4. "Inter-only typography." The repo uses both Inter and Geist depending on surface.

## Completion Checklist

- Findings are severity-ordered and evidence-backed.
- File/line references are included for each finding.
- Test coverage gaps are called out explicitly.
- Executed commands and outcomes are reported.
- Residual risks/open questions are documented.
