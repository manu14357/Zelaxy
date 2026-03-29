---
name: database
description: 'Work with PostgreSQL database schema, Drizzle ORM queries, migrations, and pgvector. Use for: schema changes, SQL queries, vector embeddings, HNSW indexes, knowledge base tables, multi-tenant data isolation, migration generation.'
---

# Database & Schema Skill — Zelaxy

## Purpose
Work with the PostgreSQL database schema, Drizzle ORM queries, migrations, and pgvector.

## When to Use
- Adding or modifying database tables
- Writing Drizzle ORM queries
- Creating or debugging migrations
- Working with pgvector embeddings
- Optimizing database performance

## Stack
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM v1+
- **Vector**: pgvector extension
- **Migration tool**: `drizzle-kit`
- **Schema**: `apps/zelaxy/db/schema.ts`
- **DB client**: `apps/zelaxy/db/index.ts`
- **Config**: `apps/zelaxy/drizzle.config.ts`

## Schema Overview

### Core Tables

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `user` | User accounts | → sessions, accounts, organizations |
| `session` | Auth sessions (better-auth) | → user, activeOrganization |
| `account` | OAuth provider accounts | → user |
| `organization` | Multi-tenant containers | → owner (user), workspaces |
| `workspace` | Workflow containers | → organization, workflows |
| `workflow` | Workflow documents | → workspace, blocks, edges |
| `workflowBlocks` | Canvas block data | → workflow, parentId (self-ref) |
| `workflowEdges` | Block connections | → workflow, source/target blocks |
| `workflowSubflows` | Loop/parallel metadata | → workflow |
| `workflowExecutionSnapshots` | Execution state snapshots | → workflow |
| `workflowExecutionLogs` | Execution history | → workflow |
| `knowledgeBase` | RAG document collections | → workspace |
| `knowledgeDocuments` | Individual documents | → knowledgeBase |
| `knowledgeChunks` | Text chunks + embeddings | → knowledgeDocument |
| `credential` | Encrypted OAuth tokens | → user, workspace |
| `schedule` | Cron job definitions | → workflow |
| `webhook` | Webhook endpoints | → workflow |

### Key Columns

```typescript
// workflow table
workflow: {
  id: uuid().primaryKey(),
  name: text().notNull(),
  state: jsonb().$type<WorkflowState>(),       // Full canvas state
  deployedState: jsonb(),                        // Published version
  variables: jsonb().$type<WorkflowVariable[]>(),
  isPublished: boolean().default(false),
  workspaceId: uuid().references(() => workspace.id),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
}

// knowledgeChunks — pgvector
knowledgeChunks: {
  id: uuid().primaryKey(),
  content: text().notNull(),
  embedding: vector({ dimensions: 1536 }),       // pgvector column
  tokenCount: integer(),
  metadata: jsonb(),
  documentId: uuid().references(() => knowledgeDocuments.id),
}
```

### Indexes

```typescript
// Composite indexes for common query patterns
index('workflow_workspace_idx').on(workflow.workspaceId)
index('blocks_workflow_idx').on(workflowBlocks.workflowId, workflowBlocks.type)
index('blocks_parent_idx').on(workflowBlocks.parentId, workflowBlocks.sortOrder)
index('chunks_document_idx').on(knowledgeChunks.documentId)

// pgvector HNSW index for similarity search
index('chunks_embedding_idx').using('hnsw', knowledgeChunks.embedding.op('vector_cosine_ops'))
```

## Drizzle ORM Patterns

### Basic Queries

```typescript
import { db } from '@/db'
import { workflow, workflowBlocks } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// Select
const workflows = await db
  .select()
  .from(workflow)
  .where(and(
    eq(workflow.workspaceId, workspaceId),
    eq(workflow.isPublished, true)
  ))
  .orderBy(desc(workflow.updatedAt))
  .limit(20)

// Insert
const [newWorkflow] = await db
  .insert(workflow)
  .values({ name, workspaceId, state: initialState })
  .returning()

// Update
await db
  .update(workflow)
  .set({ name: newName, updatedAt: new Date() })
  .where(eq(workflow.id, workflowId))

// Delete
await db
  .delete(workflowBlocks)
  .where(eq(workflowBlocks.workflowId, workflowId))
```

### Joins

```typescript
const result = await db
  .select({
    workflow: workflow,
    blockCount: sql<number>`count(${workflowBlocks.id})`,
  })
  .from(workflow)
  .leftJoin(workflowBlocks, eq(workflow.id, workflowBlocks.workflowId))
  .where(eq(workflow.workspaceId, workspaceId))
  .groupBy(workflow.id)
```

### pgvector Similarity Search

```typescript
import { sql } from 'drizzle-orm'
import { cosineDistance, gt } from 'drizzle-orm/pg-core'

const similarChunks = await db
  .select({
    id: knowledgeChunks.id,
    content: knowledgeChunks.content,
    similarity: sql<number>`1 - (${cosineDistance(knowledgeChunks.embedding, queryEmbedding)})`,
  })
  .from(knowledgeChunks)
  .where(
    gt(sql`1 - (${cosineDistance(knowledgeChunks.embedding, queryEmbedding)})`, 0.7)
  )
  .orderBy(sql`${cosineDistance(knowledgeChunks.embedding, queryEmbedding)}`)
  .limit(10)
```

### JSONB Queries

```typescript
// Query JSONB fields
const results = await db
  .select()
  .from(workflow)
  .where(sql`${workflow.state}->>'version' = '2'`)

// Update JSONB field
await db
  .update(workflow)
  .set({
    variables: sql`${workflow.variables} || ${JSON.stringify([newVar])}::jsonb`
  })
  .where(eq(workflow.id, workflowId))
```

## Migrations

### Commands
```bash
cd apps/zelaxy

# Generate migration from schema changes
bunx drizzle-kit generate

# Apply migrations
bunx drizzle-kit migrate

# Open visual DB explorer
bunx drizzle-kit studio

# Drop and recreate (CAUTION — destroys data)
bunx drizzle-kit push
```

### Migration Best Practices
- Always generate migration after schema changes
- Review generated SQL before applying
- Test migrations on a staging database first
- Never modify existing migration files
- Use `DEFAULT` values for new required columns on existing tables
- Add `NOT NULL` constraints in a separate migration after backfilling

## Multi-Tenant Isolation

**CRITICAL**: All queries MUST include workspace or organization scoping.

```typescript
// CORRECT — scoped
const workflows = await db
  .select()
  .from(workflow)
  .where(and(
    eq(workflow.workspaceId, workspaceId),  // Always scope!
    eq(workflow.isPublished, true)
  ))

// WRONG — no scoping, leaks data across tenants
const workflows = await db
  .select()
  .from(workflow)
  .where(eq(workflow.isPublished, true))  // Missing workspaceId!
```

## Common Issues
1. **Missing pgvector extension**: Run `CREATE EXTENSION IF NOT EXISTS vector;` before migrations
2. **JSONB type safety**: Use `.$type<T>()` on jsonb columns for TypeScript types
3. **N+1 queries**: Use joins or batch queries, not loops
4. **Large result sets**: Always `limit()` and paginate
5. **Transaction safety**: Use `db.transaction()` for multi-table mutations
