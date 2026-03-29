---
name: performance
description: 'Optimize execution speed, database queries, and frontend rendering. Use for: executor streaming, pgvector HNSW tuning, React re-render optimization, Zustand selectors, bundle size, Turbopack config, N+1 query prevention.'
---

# Performance Skill — Zelaxy

## Purpose
Optimize execution speed, database queries, and frontend rendering.

## When to Use
- Optimizing workflow execution performance
- Improving database query speed
- Reducing frontend bundle size or render time
- Debugging slow operations
- Tuning pgvector similarity search

## Executor Performance

### Execution Architecture
- Topological sort ensures correct DAG execution order
- Blocks execute sequentially (unless in parallel blocks)
- Streaming via `onStream` callback for real-time output
- Cancellation support via `isCancelled` flag — check between blocks

### Streaming
```typescript
// Executor supports streaming callbacks
onStream?: (blockId: string, chunk: string) => void
onBlockComplete?: (blockId: string, result: BlockState) => void
onExecutionStart?: () => void
onExecutionComplete?: (result: ExecutionResult) => void
```

### Parallel Execution
- `ParallelManager` handles concurrent block execution
- Two strategies: `count` (fixed iterations) and `collection` (iterate over array)
- Each parallel branch runs its own execution context
- Results merged after all branches complete

### Loop Optimization
- `LoopManager` handles for/forEach/while loops
- Loop context injected per iteration (avoids full state rebuild)
- Break conditions checked per iteration

## Database Performance

### Index Strategy

**Composite indexes** for common query patterns:
```
workflow_blocks: workflow_id + parent_id, workflow_id + type
workflow_edges: workflow_id + source, workflow_id + target
workflow_folders: workspace_id + parent_id, parent_id + sort_order
workflows: user_id + workspace_id
```

### pgvector Optimization

**HNSW Index** (approximate nearest neighbor):
```sql
-- Index config
embedding_vector_hnsw_idx
  USING hnsw
  ON knowledge_chunks (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
```

**Parameters**:
| Param | Value | Effect |
|-------|-------|--------|
| `m` | 16 | Graph connectivity (higher = better recall, more memory) |
| `ef_construction` | 64 | Build quality (higher = slower build, better index) |
| dimensions | 2000 | Supports most embedding models |
| distance | cosine | Standard for text embeddings |

**Query pattern**:
```typescript
// Similarity search with Drizzle
import { cosineDistance, desc, sql } from 'drizzle-orm'

const results = await db
  .select({
    content: knowledgeChunks.content,
    similarity: sql<number>`1 - (${cosineDistance(knowledgeChunks.embedding, queryVector)})`,
  })
  .from(knowledgeChunks)
  .where(and(
    eq(knowledgeChunks.knowledgeBaseId, kbId),
    eq(knowledgeChunks.enabled, true),
  ))
  .orderBy(desc(sql`1 - (${cosineDistance(knowledgeChunks.embedding, queryVector)})`))
  .limit(10)
```

**Optimization tips**:
- Filter by `knowledgeBaseId` BEFORE similarity search (index narrows candidates)
- Use tag columns (tag1-tag7) for pre-filtering
- Keep `limit` reasonable (10-20 for RAG, not 100+)
- Full-text search via `content_tsv` tsvector for keyword matching

### Full-Text Search
```typescript
// Generated tsvector column
content_tsv: tsvector, generatedAlwaysAs: to_tsvector('english', content)

// Query with ts_rank
.where(sql`content_tsv @@ plainto_tsquery('english', ${query})`)
.orderBy(desc(sql`ts_rank(content_tsv, plainto_tsquery('english', ${query}))`))
```

### Query Best Practices
1. **Always filter by workspace/org first** — narrows the scan
2. **Use composite indexes** — query in index column order
3. **Avoid SELECT \*** — specify only needed columns
4. **Batch inserts** — use `.values([...])` for multiple rows
5. **Use `.returning()` wisely** — only when you need the result
6. **Paginate large results** — `.limit().offset()` with proper indexes

## Frontend Performance

### Next.js Optimizations
- `optimizeCss: true` (experimental) — CSS minification
- `turbopackSourceMaps: false` — faster dev builds
- `standalone` output for Docker — smaller image
- Turbopack for dev (faster HMR than Webpack)
- `transpilePackages` for tree-shaking external deps

### Bundle Size
- Sentry integration with extensive `ignoredModules` and `widenClientFileUpload`
- External packages kept server-side: `sharp`, `tesseract.js`, `pdf-parse`, `mupdf`
- React 19 with automatic batching

### React Flow (Workflow Canvas)
- Virtualized rendering — only visible nodes rendered
- Custom node types with memoization
- Edge rendering optimized with React Flow's built-in batching
- `useReactFlow()` hook for imperative operations

### Zustand State
- Stores split by domain (execution, workflows, copilot, etc.)
- Selectors for fine-grained re-renders:
  ```typescript
  // Good — only re-renders when isExecuting changes
  const isExecuting = useExecutionStore(s => s.isExecuting)

  // Bad — re-renders on any store change
  const store = useExecutionStore()
  ```
- `devtools` middleware for debugging (dev only)
- `withHistory` custom middleware for undo/redo (workflow store)
- `createSafeStorage()` for SSR-safe persistence

### Image Optimization
- Remote patterns configured for CDN sources
- Next.js Image component for lazy loading and responsive images

## Monitoring

### Sentry Integration
- Error tracking with `@sentry/nextjs`
- Disabled in development
- Configurable via `telemetry.config.ts`
- Source maps uploaded but access-blocked in production

### Real-time Callbacks
```typescript
// Execution monitoring
onExecutionStart()       // Track execution start
onBlockComplete(id, st)  // Track individual block completion
onExecutionComplete(res) // Track total execution time
```

## Common Bottlenecks
1. **Large workflow execution**: Many sequential blocks — consider parallel blocks
2. **pgvector search on large KBs**: Ensure HNSW index exists, pre-filter by tags
3. **Streaming stalls**: Check `onStream` callback isn't blocking
4. **Store re-renders**: Use selectors, not full store subscriptions
5. **Dev server slow**: Turbopack enabled by default; check no circular deps
6. **Background job timeout**: 180s max — split large file processing
