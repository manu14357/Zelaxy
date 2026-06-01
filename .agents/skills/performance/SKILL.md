---
name: performance
description: 'Optimize execution speed, database queries, and frontend rendering. Use for: executor layer/stream performance, pgvector HNSW tuning, knowledge/image search strategy, React Flow render optimization, Zustand selector patterns, Next.js bundle tuning, and mandatory performance regression testing.'
---

# Performance Skill - Zelaxy

## Purpose
Optimize runtime speed and scalability in this repository with measurable, test-backed changes.

## Non-Negotiable Rule: Performance Changes Require Tests

When performance-related code changes are made:

1. Update or add tests that cover changed behavior.
2. Run relevant tests before completion.
3. Report exact test commands and results.
4. If tests cannot run, explain why and what remains unverified.

Performance edits without regression-test validation are incomplete unless explicitly waived.

## When to Use
- Reducing workflow execution latency
- Improving query speed and vector search recall/latency balance
- Fixing canvas/UI render bottlenecks
- Reducing server/client bundle overhead
- Preventing regressions after optimizations

## Architecture Map (High-Impact Files)

- Executor runtime: `apps/zelaxy/executor/index.ts`
- Streaming response processing: `apps/zelaxy/executor/utils.ts`
- Executor contracts: `apps/zelaxy/executor/types.ts`
- Knowledge search strategy: `apps/zelaxy/app/api/knowledge/search/utils.ts`
- Knowledge search route orchestration: `apps/zelaxy/app/api/knowledge/search/route.ts`
- Workflow normalized DB IO: `apps/zelaxy/lib/workflows/db-helpers.ts`
- DB connection pool config: `apps/zelaxy/db/index.ts`
- Vector schema/indexes: `apps/zelaxy/db/schema.ts`
- Canvas render path: `apps/zelaxy/app/arena/[workspaceId]/zelaxy/[workflowId]/workflow.tsx`
- Diff/render caching store: `apps/zelaxy/stores/workflow-diff/store.ts`
- Build/bundle config: `apps/zelaxy/next.config.ts`

## Optimization Workflow (Required)

1. Measure baseline first (latency, DB time, render cost, memory).
2. Identify concrete hotspot file and code path.
3. Apply smallest viable optimization.
4. Add or update tests for changed behavior.
5. Run targeted tests (and broader suites if shared runtime changed).
6. Verify no correctness regressions, then report measurable impact.

## Executor Performance (Current Behavior)

### Execution Architecture

- Blocks are scheduled by dependency layers and each layer executes concurrently.
- `executeLayer` uses `Promise.allSettled(...)`, so one block failing does not instantly cancel successful siblings.
- Flow-control semantics (`loop`, `parallel`, routing blocks) are handled by dedicated managers/handlers.
- Cancellation is checked during execution (`isCancelled`), with structured failure return.

Important correction:
- Execution is not globally "one block at a time". Layers run in parallel when dependencies allow.

### Streaming Path

- Streaming is modeled as `StreamingExecution` (`stream` + full execution metadata).
- Executor tees stream output into two channels:
  - client stream for UI callbacks
  - executor stream for persisted/structured result assembly
- `StreamingResponseFormatProcessor` can transform streamed JSON into selected response fields.

Performance guidance:

1. Keep `onStream` callbacks non-blocking.
2. Avoid heavy synchronous parsing in stream callbacks.
3. Preserve structured-output parsing fallback behavior when stream JSON is partial.
4. Test empty/partial/chunked stream cases when touching stream logic.

## Database Performance

### Connection Pooling

From `apps/zelaxy/db/index.ts`:

- postgres-js pool max: `60`
- `prepare: false`
- `idle_timeout: 20`
- `connect_timeout: 30`

Treat pool changes as system-level tuning. Validate impact on app plus socket-server capacity before modifying.

### Workflow Persistence Patterns

`apps/zelaxy/lib/workflows/db-helpers.ts` already applies performance-friendly patterns:

- Parallel reads via `Promise.all` for blocks/edges/subflows.
- Transactional write path with batched inserts per entity type.
- Single workflow-scoped delete+insert cycle during state save.

Keep workflow DB operations scoped by workflow id and wrapped in a transaction when mutating normalized tables.

### Vector and Search Index Strategy


#### Embedding tables with HNSW

In `apps/zelaxy/db/schema.ts`:

- `embedding.embedding` dimension: `2000`
- `docs_embeddings.embedding` dimension: `1536`
- `image_embedding.embedding` dimension: `2000`
- HNSW indexes use `vector_cosine_ops` with:
  - `m: 16`
  - `ef_construction: 64`

These tables also pair vector indexes with:

- enabled-state filters
- tag indexes (`tag1`..`tag7`)
- GIN full-text indexes (`content_tsv` variants)

### Knowledge Search Strategy (Current)

`apps/zelaxy/app/api/knowledge/search/utils.ts` uses adaptive strategy:

- `getQueryStrategy(...)` selects single-query vs per-KB parallel mode.
- Tag-only search path.
- Vector-only search path.
- Tag+vector path that filters by tags first, then vector-searches reduced candidate IDs.

Key performance characteristics:

1. Candidate reduction before expensive vector ranking where possible.
2. Query thresholding via distance cutoff.
3. Per-KB parallel fan-out only when KB count/topK heuristics justify it.

### Image Search Strategy

Image search path (`lib/image-search/searcher.ts`) includes:

- raw SQL vector ranking with constrained candidate limits (`topK * 3` then dedupe)
- hybrid search combining keyword and visual ranking using reciprocal-rank fusion
- concurrent keyword+visual retrieval via `Promise.all`

Indexing path (`lib/image-search/indexer.ts`) includes batched concurrent processing with `Promise.allSettled`.

## Frontend and State Performance

### Canvas Rendering Path

`workflow.tsx` already uses extensive memoization:

- `React.memo` wrappers for large components
- heavy `useMemo` usage for derived node/edge data
- `useCallback` for event handlers
- stable `nodeTypes`/`edgeTypes` module-level declarations

React Flow configuration includes tuned interaction parameters (`fitView`, zoom bounds, drag behaviors, selective edit handlers).

Important correction:
- Do not assume `onlyRenderVisibleElements` is enabled; it is not currently set in the main workflow canvas.

### Zustand Selector Patterns

Prefer narrow selectors plus equality optimization where relevant.

Verified examples:

- `use-block-connections.ts` uses `zustand/shallow` to reduce unnecessary rerenders.
- `workflow-diff/store.ts` adds explicit performance controls:
  - singleton diff engine
  - debounced batched updates
  - cached selector/hash state reuse

Avoid full-store subscriptions in high-frequency UI surfaces.

## Build and Bundle Performance

From `apps/zelaxy/next.config.ts`:

- Turbopack configured with explicit root and extensions.
- `experimental.optimizeCss: true`.
- `experimental.turbopackSourceMaps: false`.
- `serverExternalPackages` excludes heavy server-only dependencies from client bundles.
- `transpilePackages` is explicitly curated.
- Sentry config enables bundle-size optimization flags.

From `turbo.json`:

- test task depends on upstream builds (`"dependsOn": ["^build"]`).

Treat build-performance changes as cross-workspace impacts; validate both app runtime and CI pipelines.

## Performance Test Expectations

For performance-related code changes, add or update tests near changed domain:

- Executor stream/layer logic: `apps/zelaxy/executor/*.test.ts`
- Knowledge search strategy: `apps/zelaxy/app/api/knowledge/search/*.test.ts`
- Workflow DB helper behavior: `apps/zelaxy/lib/workflows/*.test.ts`
- UI/store behavior: colocated component/store tests with `jsdom` when needed

Run targeted tests first, then broader suite if shared pathways changed.

Suggested commands:

- `cd apps/zelaxy; bun run test -- executor/utils.test.ts`
- `cd apps/zelaxy; bun run test -- app/api/knowledge/search/route.test.ts`
- `cd apps/zelaxy; bun run test -- lib/workflows/db-helpers.test.ts`
- `cd apps/zelaxy; bun run test` (when touching shared/runtime-critical code)

## Common Pitfalls

1. Treating executor as fully sequential and missing layer-level parallel effects.
2. Doing expensive synchronous work inside stream callbacks.
3. Running vector search without prefilters (`knowledgeBaseId`, `enabled`, tags).
4. Enlarging topK or candidate windows without recall/latency measurement.
5. Over-subscribing Zustand stores in canvas-heavy components.
6. Assuming canvas viewport virtualization is already enabled when it is not.
7. Changing DB pool/index settings without end-to-end validation.
8. Shipping optimization refactors without regression tests and executed test evidence.
