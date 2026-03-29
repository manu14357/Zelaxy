---
name: workflow-engine
description: 'Understand, modify, debug, and extend the workflow execution engine. Use for: executor architecture, block handlers, topological sorting, input resolver, loops, parallel execution, streaming, ExecutionContext, BlockState, adding new handlers.'
---

# Workflow Engine Skill — Zelaxy

## Purpose
Understand, modify, debug, and extend the Zelaxy workflow execution engine.

## When to Use
- Modifying execution logic (topological sort, state management)
- Adding new block handler types
- Debugging execution failures
- Working with loops, parallels, or routing
- Modifying input resolution (`{{blockName.field}}` syntax)
- Working with streaming output

## Architecture

### Core Components

```
executor/
├── index.ts              # Executor class — main orchestrator
├── types.ts              # ExecutionContext, BlockState, NormalizedBlockOutput
├── consts.ts             # BlockType enum, validation helpers
├── utils.ts              # StreamingResponseFormatProcessor
├── handlers/             # 12 block type handlers
├── loops/                # for/forEach/while loop management
├── parallels/            # Parallel branch execution
├── path/                 # Execution path resolution
├── resolver/             # Input reference resolution
├── routing/              # Conditional routing logic
└── utils/                # Shared executor utilities
```

### Execution Flow

```
1. Parse workflow graph (blocks + edges)
2. Topological sort → determine execution order
3. For each block in order:
   a. Resolve inputs (substitute {{references}})
   b. Look up handler by BlockType
   c. Execute handler → BlockOutput
   d. Store output in ExecutionContext
   e. Emit streaming updates (if enabled)
4. Handle routing decisions (conditions, routers)
5. Handle loops (for/forEach/while) with iteration state
6. Handle parallel branches (count or collection strategy)
7. Return final ExecutionContext with all block states
```

### Key Types

```typescript
// Primary state container — treat as IMMUTABLE
interface ExecutionContext {
  workflowId: string
  executionId: string
  blockStates: Record<string, BlockState>
  environmentVariables: Record<string, string>
  logs: ExecutionLog[]
  // ... routing decisions, loop states, etc.
}

// Individual block execution result
interface BlockState {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  output: NormalizedBlockOutput
  error?: string
  startTime?: number
  endTime?: number
}

// Handler interface — all handlers implement this
interface BlockHandler {
  execute(
    block: WorkflowBlock,
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<BlockOutput>
}
```

### Handlers (12 types)

| Handler | BlockType | Purpose |
|---------|-----------|---------|
| `agent-handler` | `agent` | LLM execution + tools + OCR |
| `api-handler` | `api` | HTTP requests (GET/POST/PUT/DELETE/PATCH) |
| `function-handler` | `function` | JavaScript code execution |
| `condition-handler` | `condition` | Boolean branching |
| `router-handler` | `router` | Multi-path routing |
| `evaluator-handler` | `evaluator` | Expression evaluation |
| `loop-handler` | `loop` | for/forEach/while iteration |
| `parallel-handler` | `parallel` | Parallel branch distribution |
| `response-handler` | `response` | Workflow output formatting |
| `workflow-handler` | `workflow` | Sub-workflow execution |
| `knowledge-handler` | `knowledge` | RAG vector search |
| `memory-handler` | `memory` | Key-value state |

### Input Resolution

The resolver (`resolver/resolver.ts`) handles:
```
{{blockName.field}}           → Direct block output reference
{{blockName.output.nested}}   → Nested field access
{{env.VARIABLE_NAME}}         → Environment variable
{{loop.index}}                → Current loop iteration
{{loop.item}}                 → Current loop item
{{trigger.payload.field}}     → Trigger data
```

### Loop Management

```typescript
// loops/loops.ts
interface LoopConfig {
  type: 'for' | 'forEach' | 'while'
  count?: number                    // for loops
  collection?: string               // forEach — reference to array
  condition?: string                // while — boolean expression
  stopOnError: boolean
  maxIterations: number             // safety limit
}
```

### Parallel Execution

```typescript
// parallels/parallels.ts
interface ParallelConfig {
  strategy: 'count' | 'collection'
  count?: number                    // Fixed branch count
  collection?: string               // Dynamic — one branch per item
}
```

### Streaming

```typescript
// utils.ts — StreamingResponseFormatProcessor
// Selectively streams specific output fields (not entire block output)
// Used for token-by-token LLM streaming to the client
```

## How to Add a New Handler

1. Create `handlers/my-handler.ts`:
```typescript
import type { BlockHandler, BlockOutput } from '../types'

export const myHandler: BlockHandler = {
  async execute(block, inputs, context) {
    // Your logic here
    return {
      response: { /* output data */ },
    }
  }
}
```

2. Register in `handlers/index.ts`
3. Add `BlockType` entry in `consts.ts`
4. Add block definition in `blocks/blocks/`
5. Register block in `blocks/registry.ts`
6. Write tests in `handlers/my-handler.test.ts`

## Common Pitfalls
- **Mutable context**: Never mutate `ExecutionContext` directly — create new objects
- **Infinite loops**: Always check `maxIterations` in loop handlers
- **Unresolved references**: Input resolver returns raw string if reference not found — handle gracefully
- **Streaming race conditions**: Ensure stream processors handle backpressure
- **Topological cycles**: The sort will throw on circular dependencies — handle the error
