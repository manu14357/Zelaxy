---
name: database
description: 'Work with PostgreSQL schema, Drizzle ORM queries, migrations, and pgvector. Use for: schema/table changes, enum/index updates, tenant-scoped queries, workflow normalized tables, knowledge/image embeddings, HNSW/FTS search, and migration generation.'
---

# Database Skill - Zelaxy

## Purpose
Work with the PostgreSQL schema, Drizzle queries, migrations, and vector search infrastructure in `apps/zelaxy`.

## When to Use
- Adding or modifying tables, columns, enums, constraints, or indexes
- Writing or debugging Drizzle queries/transactions
- Creating and applying migrations with `drizzle-kit`
- Working on knowledge/image embedding pipelines (`pgvector`, HNSW, FTS)
- Fixing multi-tenant query scoping issues (user/workspace/organization)

## Stack and Source of Truth
- **Database**: PostgreSQL 17 + `pgvector`
- **ORM**: `drizzle-orm`
- **Migration tool**: `drizzle-kit`
- **Schema**: `apps/zelaxy/db/schema.ts`
- **Runtime DB client**: `apps/zelaxy/db/index.ts`
- **Migration config**: `apps/zelaxy/drizzle.config.ts`

## Connection and Environment

### Runtime connection (`db/index.ts`)
- Uses `POSTGRES_URL ?? DATABASE_URL`
- Uses `postgres` (postgres-js) with:
  - `max: 60`
  - `idle_timeout: 20`
  - `connect_timeout: 30`
  - `prepare: false`
- Exposes `db` through Drizzle and caches in dev via global singleton

### Migration connection (`drizzle.config.ts`)
- Uses `process.env.DIRECT_URL || env.DATABASE_URL`
- Schema path: `./db/schema.ts`
- Migrations output: `./db/migrations`

When debugging "works at runtime but fails in migration" issues, check `DIRECT_URL` vs `POSTGRES_URL` vs `DATABASE_URL` first.

## Schema Architecture (Current)

### Identity and auth
- `user`, `session`, `account`, `verification`
- API and auth integrations also use `api_key` and `custom_oauth_provider`

### Organizations, workspaces, permissions
- `organization`, `member`, `invitation`
- `workspace`, `workspace_invitation`, `permissions`
- `org_environment`, `platform_settings`, `audit_log`

### Workflow model
- `workflow`
- `workflow_blocks`
- `workflow_edges`
- `workflow_subflows`
- `workflow_folder`
- `workflow_execution_snapshots`
- `workflow_execution_logs`
- `workflow_schedule`, `webhook`

Important: `workflow.state` is marked deprecated in schema comments. New/updated workflow persistence must keep normalized tables (`workflow_blocks`, `workflow_edges`, `workflow_subflows`) as source of truth.

### Knowledge and vector search
- `knowledge_base`
- `document`
- `embedding`
- `knowledge_base_tag_definitions`
- `docs_embeddings` (docs site style embeddings table)

### Image search / CAD search
- `image_catalog`
- `image_document`
- `image_embedding`
- `image_catalog_tag_definitions`
- Related enums: catalog status, source, extraction mode, embedding type, processing mode

### MCP and tooling data
- `mcp_servers`
- `mcp_server_tools`
- `mcp_tool_executions`
- `custom_tools`

### Other product tables
- `chat`, `copilot_chats`, `copilot_feedback`, `workflow_checkpoints`
- `templates`, `template_stars`, `marketplace`
- `environment`, `settings`, `subscription`, `user_stats`, `user_rate_limits`, `memory`, `waitlist`

## Critical Modeling Conventions

1. IDs are not uniformly UUIDs.
- Most tables use `text` primary keys.
- Some tables use UUIDs (`mcp_*`, `copilot_*`, `workflow_checkpoints.chatId`, `docs_embeddings.chunkId`).
- Never assume `uuid` when adding FKs or writing joins.

2. Multi-tenant scoping is mandatory.
- Scope queries by `userId`, `workspaceId`, or `organizationId` as appropriate.
- Permission checks often involve `permissions` plus workspace/org membership.

3. Soft delete exists on selected domains.
- Example: `knowledge_base.deletedAt`, `document.deletedAt`, `image_catalog.deletedAt`, `image_document.deletedAt`.
- Query paths must filter soft-deleted rows when expected.

4. Vector + FTS dual search is built in.
- `embedding` and `image_embedding` include vector columns + generated `tsvector` columns + HNSW and GIN indexes.

5. Tag filtering is first-class.
- Knowledge/image document and embedding tables use `tag1`..`tag7` columns and tag-definition tables.

## Drizzle Query Patterns

### Tenant-scoped reads
```typescript
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { knowledgeBase } from '@/db/schema'

const items = await db
  .select()
  .from(knowledgeBase)
  .where(
    and(
      eq(knowledgeBase.userId, userId),
      eq(knowledgeBase.workspaceId, workspaceId),
      isNull(knowledgeBase.deletedAt)
    )
  )
```

### Vector search (current pattern)
```typescript
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { embedding } from '@/db/schema'

const rows = await db
  .select({
    id: embedding.id,
    content: embedding.content,
    distance: sql<number>`${embedding.embedding} <=> ${queryVector}::vector`.as('distance'),
  })
  .from(embedding)
  .where(
    and(
      eq(embedding.knowledgeBaseId, knowledgeBaseId),
      sql`${embedding.embedding} <=> ${queryVector}::vector < ${distanceThreshold}`
    )
  )
  .orderBy(sql`${embedding.embedding} <=> ${queryVector}::vector`)
  .limit(topK)
```

### Transaction pattern
```typescript
await db.transaction(async (tx) => {
  await tx.delete(workflowBlocks).where(eq(workflowBlocks.workflowId, workflowId))
  await tx.delete(workflowEdges).where(eq(workflowEdges.workflowId, workflowId))
  await tx.insert(workflowBlocks).values(blockRows)
  await tx.insert(workflowEdges).values(edgeRows)
})
```

Use transactions for multi-table mutations that must commit atomically.

## Migrations

### Common commands (from `apps/zelaxy`)
```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
bunx drizzle-kit studio
bunx drizzle-kit push
```

### Script aliases (in `apps/zelaxy/package.json`)
```bash
bun run db:migrate
bun run db:studio
bun run db:push
```

`db:push` is useful for rapid local prototyping but is riskier for controlled production migration workflows.

## Change Workflow Checklist

1. Update `db/schema.ts`.
2. Add/adjust indexes and constraints for real query patterns.
3. Generate a migration (`drizzle-kit generate`).
4. Review SQL in `db/migrations/*.sql` carefully.
5. Apply migration locally (`drizzle-kit migrate`).
6. Update affected queries/services/tests.
7. Validate tenant scoping and soft-delete behavior.

## Performance Guidance

- Prefer composite indexes that match actual `where + orderBy` combinations.
- For vector retrieval, prefilter by tenant/domain (`knowledgeBaseId`, `catalogId`, `enabled`) before ordering by `<=>`.
- Add GIN indexes for JSONB/FTS usage when introducing new heavy filters.
- Keep embedding dimensions aligned with model expectations (`1536` and `2000` are both in use).

## Common Issues

1. **Wrong ID type assumptions**: joining UUID/text IDs incorrectly.
2. **Using deprecated workflow state path**: writing only to `workflow.state` without normalized workflow tables.
3. **Missing tenant filters**: unscoped reads leak cross-workspace/org data.
4. **Missing soft-delete filters**: deleted knowledge/image records appear in results.
5. **Credential table confusion**: OAuth integrations use `account` and `custom_oauth_provider` (not a `credential` table in schema).
6. **Migration env mismatch**: `DIRECT_URL` and runtime DB URLs pointing to different databases.
7. **Vector infra gaps**: pgvector/HNSW assumptions without extension/index readiness.
