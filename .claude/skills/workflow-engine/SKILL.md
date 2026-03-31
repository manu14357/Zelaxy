---
name: workflow-engine
description: 'Understand, modify, debug, and extend the workflow execution engine. Use for: executor architecture, block handlers, dependency-layer scheduling, input resolver syntax, loops/parallels/routing flow, streaming execution, ExecutionContext contracts, and adding handlers safely with tests.'
---

# Workflow Engine Skill - Zelaxy

## Purpose
Modify and extend the executor safely using repository-accurate runtime behavior, not generic workflow assumptions.

## Non-Negotiable Rule: Engine Changes Require Tests

When execution behavior changes:

1. Update or add tests for changed behavior paths.
2. Run targeted executor tests before completion.
3. Report exact commands and outcomes.
4. If tests cannot run, explain why and what remains unverified.

## When to Use
- Changing execution ordering, dependency checks, or path activation
- Adding or modifying block handlers
- Debugging loop, parallel, routing, or trigger execution issues
- Modifying input reference resolution
- Updating streaming execution behavior
- Extending workflow-within-workflow execution

## Architecture Map (High-Impact Files)

- Executor orchestrator: `apps/zelaxy/executor/index.ts`
- Core types/contracts: `apps/zelaxy/executor/types.ts`
- Block type constants: `apps/zelaxy/executor/consts.ts`
- Handler exports: `apps/zelaxy/executor/handlers/index.ts`
- Loop coordinator: `apps/zelaxy/executor/loops/loops.ts`
- Parallel coordinator: `apps/zelaxy/executor/parallels/parallels.ts`
- Path activation logic: `apps/zelaxy/executor/path/path.ts`
- Routing strategy: `apps/zelaxy/executor/routing/routing.ts`
- Input/reference resolver: `apps/zelaxy/executor/resolver/resolver.ts`
- Streaming response field extraction: `apps/zelaxy/executor/utils.ts`
- Serialized workflow contracts: `apps/zelaxy/serializer/types.ts`

## Runtime Model (Current Behavior)

### 1) Dependency-layer scheduling

- Execution is not driven by a single precomputed topological array.
- `getNextExecutionLayer(...)` discovers ready blocks each iteration using:
  - `activeExecutionPath`
  - `executedBlocks`
  - `checkDependencies(...)` with connection-handle semantics
- Routing and flow-control decisions update eligibility dynamically during execution.

### 2) Layer execution semantics

- `executeLayer(...)` runs block executions concurrently via `Promise.allSettled(...)`.
- Partial failures can coexist with successful siblings in the same layer.
- If all blocks in a layer fail, execution throws the first error.

### 3) Handler dispatch order and fallback

The executor registers handlers in fixed order:

1. TriggerBlockHandler
2. AgentBlockHandler
3. RouterBlockHandler
4. ConditionBlockHandler
5. EvaluatorBlockHandler
6. FunctionBlockHandler
7. ApiBlockHandler
8. LoopBlockHandler
9. ParallelBlockHandler
10. ResponseBlockHandler
11. WorkflowBlockHandler
12. GenericBlockHandler

Critical detail:

- `GenericBlockHandler` is catch-all (`canHandle` returns true) and must remain last.
- Many block types are executed through the generic tool path, not dedicated handlers.

### 4) Execution context contracts

From `ExecutionContext`:

- `blockStates: Map<string, BlockState>`
- `executedBlocks: Set<string>`
- `activeExecutionPath: Set<string>`
- `decisions.router` and `decisions.condition`
- `loopIterations`, `loopItems`, `loopExecutions`
- `parallelExecutions`, `parallelBlockMapping`

Important nuance:

- `completedLoops` is used for both loop and parallel completion markers.

### 5) Routing and path activation

- `PathTracker` applies routing decisions from router/condition outputs.
- Connection handles are behavior-critical:
  - `source` (default forward)
  - `error` (error path)
  - `loop-start-source`, `loop-end-source`
  - `parallel-start-source`, `parallel-end-source`
- `Routing` strategy controls selective downstream activation behavior for routing vs flow-control blocks.

### 6) Loop runtime behavior

- Loop setup is emitted by `LoopBlockHandler`.
- Iteration reset/aggregation and end-path activation are managed by `LoopManager`.
- forEach loops evaluate collection expressions and track current item/index.
- Settings include max iteration safety, stop-on-error, and optional parallel execution flagging.

### 7) Parallel runtime behavior

- Parallel setup is emitted by `ParallelBlockHandler`.
- Execution fan-out uses virtual block IDs per iteration:
  - `<blockId>_parallel_<parallelId>_iteration_<n>`
- Completion and aggregation are coordinated by `ParallelManager` and handler logic.
- Supports count and collection modes with settings such as max concurrency, stop-on-error, wait-for-all, and timeout.

### 8) Input reference syntax (resolver)

Resolver syntax is `{{...}}` based:

- `{{variable.name}}`
- `{{start.input}}`, `{{start.conversationId}}`
- `{{loop.currentItem}}`, `{{loop.index}}`, `{{loop.items}}`
- `{{parallel.currentItem}}`, `{{parallel.index}}`, `{{parallel.items}}`
- `{{blockIdOrName.path}}`
- `{{ENV_VAR}}` in supported env-var contexts

Do not document old placeholder formats such as `<block...>` for this engine.

### 9) Streaming behavior

- Agent handler can return `StreamingExecution`.
- Executor tees the stream into:
  - client stream path
  - executor persistence/assembly path
- `streamingResponseFormatProcessor` can project selected response-format fields from streamed JSON.

### 10) Nested workflow execution

- `WorkflowBlockHandler` loads child workflow via API and executes inline with a nested executor.
- Guards include maximum nesting depth and cyclic dependency protection.
- Child output is mapped back into parent block output shape.

## Extension Workflow

### A) Add or modify a specialized handler

1. Implement handler class in `apps/zelaxy/executor/handlers/<type>/<type>-handler.ts`.
2. Export from `apps/zelaxy/executor/handlers/index.ts`.
3. Register in executor handler list in `apps/zelaxy/executor/index.ts` before generic fallback.
4. Ensure `canHandle(...)` is specific and deterministic.
5. Add or update tests for success, failure, and path-control behavior.

### B) Add a tool-backed block without a specialized handler

1. Add or update block config and registry wiring in blocks.
2. Ensure tool config and tool registry wiring are correct.
3. Keep generic handler path unless custom control-flow/runtime behavior is needed.
4. Add tests for transformed params and output/error mapping.

## Review Checklist for Engine PRs

1. Scheduling correctness: any regression in `getNextExecutionLayer` or dependency checks?
2. Path semantics: are source-handle rules preserved (`error`, loop/parallel start/end)?
3. Routing consistency: router/condition decisions activate only intended paths?
4. Parallel mapping: virtual block IDs, iteration context, and result aggregation preserved?
5. Resolver correctness: `{{...}}` references, accessibility checks, env-var handling preserved?
6. Streaming safety: does stream tee + structured extraction still work under chunking/invalid JSON?
7. Error handling: does error-path activation behave for eligible blocks?
8. Child workflow safety: cycle-depth guards and output mapping preserved?

## Test Expectations

Run in `apps/zelaxy`:

- `bun run test -- executor/index.test.ts`
- `bun run test -- executor/utils.test.ts`
- `bun run test -- executor/tests/router-parallel-execution.test.ts`
- `bun run test -- executor/tests/parallel-activation-regression.test.ts`
- `bun run test -- executor/tests/multi-input-routing.test.ts`

Run broader suite when core execution contracts changed:

- `bun run test`

## Common Pitfalls to Flag

1. Assuming engine is strictly sequential and ignoring layer-level concurrency.
2. Treating `GenericBlockHandler` as optional or moving it earlier in dispatch order.
3. Documenting/using outdated reference syntax instead of `{{...}}`.
4. Breaking source-handle semantics for loop/parallel start-end routing.
5. Forgetting virtual parallel block IDs in execution state and logs.
6. Breaking resolver accessibility checks between disconnected blocks.
7. Returning handler output that does not preserve expected normalized shape.
8. Changing streaming flow without chunked/invalid JSON regression tests.

## Completion Checklist

- Changed code paths are covered by updated tests.
- Targeted executor tests were executed and reported.
- Routing and flow-control handles were explicitly validated.
- Resolver syntax and accessibility behavior were regression-checked.
- Streaming behavior was validated for partial/chunked inputs when touched.
