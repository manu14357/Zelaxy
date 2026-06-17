# CLAUDE.md

Guidance for working in this repository. Read this first; it encodes architecture and
conventions that are not obvious from any single file.

## What this is

**Zelaxy** is a workflow-automation platform (a visual builder + execution engine for AI
agents and integrations). Users compose workflows on a React Flow canvas out of **blocks**;
blocks resolve to **tools**; an **executor** runs the serialized graph. It is a Turborepo
monorepo managed with **bun**.

## Monorepo layout

```
apps/
  zelaxy/     # the product (Next.js 15 app + executor + blocks + tools + socket server + worker)
  core/       # shared core
  docs/       # Fumadocs documentation site
packages/
  cli/  python-sdk/  ts-sdk/
```

Almost all work happens in `apps/zelaxy`. Its internal structure:

```
app/            # Next.js App Router (UI under app/arena/**, APIs under app/api/**)
blocks/         # block definitions (blocks/blocks/*.ts) + registry.ts + types.ts
tools/          # tool integrations (one folder per provider) + registry.ts + index.ts
executor/       # the workflow execution engine (handlers, dag, resolver, routing)
serializer/     # turns the editor graph into the executable SerializedWorkflow
triggers/       # webhook/schedule/trigger implementations + registry
stores/         # Zustand stores
db/             # Drizzle schema + queries (Postgres + pgvector)
lib/            # auth, permissions, urls, logging, webhooks, schedules, env, etc.
socket-server/  # Socket.IO realtime collaboration server
worker/         # Trigger.dev background jobs
scripts/        # maintenance/verification scripts (see "Verification scripts")
```

## Tech stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript · Drizzle ORM + Postgres (pgvector)
· better-auth · Socket.IO · Trigger.dev · Zustand · TanStack Query · @xyflow/react (React Flow)
· shadcn/ui + Tailwind · Vitest · Biome (lint + format).

## Commands

Run from the repo root unless noted. Dependencies install with `bun install` (the root
`node_modules` is empty until you do — type-check/build/test will not work before installing).

| Task | Command |
|------|---------|
| Install | `bun install` |
| Dev (app) | `bun run dev` (turbo) — or `cd apps/zelaxy && bun run dev:full` for app+sockets+worker |
| Type-check | `cd apps/zelaxy && bunx tsc --noEmit` (or `bun run type-check`) |
| Lint + format (autofix) | `bunx biome check --write --unsafe .` (this is the repo's `lint` script) |
| Format only | `bunx biome format --write .` |
| Tests | `cd apps/zelaxy && bunx vitest run` (or scope: `bunx vitest run executor serializer blocks tools`) |
| Build | `cd apps/zelaxy && bun run build` (`next build --turbopack`) |
| DB push / studio / migrate | `cd apps/zelaxy && bun run db:push` / `db:studio` / `db:migrate` |

Notes:
- This is a Windows environment; the Bash tool is Git Bash. `tsc`/`vitest`/`biome` binaries
  live at the repo-root `node_modules/.bin`. From `apps/zelaxy`, invoke `../../node_modules/.bin/tsc`.
- The codebase type-checks with **0 errors** and the executor/serializer/blocks/tools/providers
  unit tests pass (~900 tests, jsdom/node — no DB needed). Keep it that way.
- Biome lint shows thousands of *formatting* diagnostics (CRLF/spacing), not bugs. Don't treat
  the count as a bug count.

## Routing model (important gotcha)

The app runs under **`/arena/...`**. The main editor is
`/arena/[workspaceId]/zelaxy/[workflowId]`; the workspace **Hub** is `/arena/[workspaceId]/hub`.

Legacy prefixes **`/workspace`, `/zelaxy`, and `/arena/{id}/w`** are redirected to `/arena/...`
by `apps/zelaxy/middleware.ts`. Because of this, **never** match `pathname` against
`^/workspace/...` — at runtime the path is always `/arena/...`. (Stale `/workspace/` regexes
from the pre-rebrand era are a known bug class; they silently never match.)

The Hub is the central navigation surface: it renders top-level features (Logs, Schedules,
Deployments, Knowledge, Memory, Templates) and Settings sections as **tabs** (see
`app/arena/[workspaceId]/hub/hub.tsx`). To add a top-level feature, add a Hub tab and a
search-modal destination (`.../search-modal/search-modal.tsx`), not a bespoke nav.

## Blocks → Tools → Executor (the core contract)

```
block def (blocks/blocks/*.ts)        # UI + which tool(s) it can call
  → blocks/registry.ts                # every block MUST be registered here (alphabetical)
  → serializer/index.ts               # picks config.tool + params for the run
  → executor handler                  # chosen by canHandle(); see registry below
  → executeTool() (tools/index.ts)    # resolves & calls the tool
  → tools/registry.ts                 # every tool MUST be registered here, keyed by its id
```

Hard rules learned the hard way:
- **A block's `tools.access` ids and every value `tools.config.tool(params)` can return MUST
  be a key in `tools/registry.ts`.** A tool file existing/exported is not enough — it must be
  added to the `tools` map. The registry **key must equal the tool's `id`** (a mismatch makes
  the operation unresolvable at runtime even though everything compiles).
- Run `node scripts/verify-blocks.mjs` to cross-check this for all blocks (see below).
- Most integration blocks need **no** handler — they flow through `GenericBlockHandler`. Only
  add a handler for non-standard runtime semantics.

### Executor handlers — single source of truth

Handlers are registered in **`executor/handlers/registry.ts`** via `createBlockHandlers(deps)`.
The `Executor` constructor (`executor/index.ts`) calls this function — do **not** maintain a
separate inline list (a duplicated, drifting list previously dropped 5 handlers silently).
`GenericBlockHandler` is the catch-all and **must stay last**.

Current handlers: trigger, function, api, condition, router, switch, response,
human-in-the-loop, agent, zelaxy-arena, variables, workflow, wait, evaluator, translate,
credential, loop, parallel, generic.

### LLM blocks are special

`agent`, `evaluator`, `router`, and `translate` list provider ids like `openai_chat`/
`anthropic_chat` in `tools.access` and their `config.tool` returns a **provider id** (e.g.
`openai`), not a registry tool. These are executed by their dedicated handlers via
`executeProviderRequest` (`providers/`), **not** the tool registry — so those `*_chat` ids are
intentionally absent from `tools/registry.ts`. Don't "fix" them.

## API conventions

API routes live under `app/api/**`. They use `getSession()` for auth and
`getUserEntityPermissions(userId, 'workspace', workspaceId)` (returns `'read'|'write'|'admin'|null`)
for workspace authorization. Several list endpoints are **per-workflow**; workspace-wide views
take a `?workspaceId=` query param and must check workspace permission before returning rows.

## Verification scripts

`apps/zelaxy/scripts/`:
- `verify-blocks.mjs [N] [offset]` — cross-checks every block's `tools.access` ids against the
  registered tool ids. Expected residual hits: the LLM blocks' provider `*_chat` ids (benign).
- `verify-blocks-structure.mjs [N] [offset]` — flags orphan `condition.field` references and
  empty `outputs`. Trigger/note blocks legitimately have empty outputs.

## Conventions

- File references in chat use clickable markdown links, not backticks.
- Match surrounding style; Biome enforces formatting (single quotes, no semicolons in TS where
  configured, sorted imports). Run the autofix before finishing a change.
- Registries (`blocks/registry.ts`, `tools/registry.ts`) are kept alphabetical.
- When you change execution behavior, **add/adjust tests and run them** (`vitest run executor ...`).
- Skills in `.claude/skills/` are the detailed playbooks per area — consult the relevant one
  (`blocks-and-tools`, `workflow-engine`, `api-and-auth`, `database`, `ui-components`, etc.).
