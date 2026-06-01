---
name: real-time-and-state
description: 'Work with Socket.IO collaboration and Zustand state in Zelaxy. Use for: socket token auth, workflow/workspace rooms, operation queue retries, presence/cursor sync, workflow rehydration, history middleware, and SSR-safe persisted stores.'
---

# Real-time and State Skill - Zelaxy

## Purpose
Build, extend, and debug collaborative editing and execution streaming with Socket.IO plus Zustand across `apps/zelaxy`.

## When to Use
- Adding or changing socket handlers, event payloads, or room behavior
- Building canvas collaboration features (blocks, edges, subblocks, variables)
- Fixing reconnect, auth, presence, or stale-state synchronization issues
- Modifying the operation queue, acknowledgement flow, or retry behavior
- Creating or refactoring Zustand stores and cross-store coordination

## Read These Files First
- `apps/zelaxy/socket-server/index.ts` - Socket server bootstrap and middleware wiring
- `apps/zelaxy/socket-server/config/socket.ts` - Socket.IO transport/CORS/cookie config
- `apps/zelaxy/socket-server/middleware/auth.ts` - Better Auth one-time token verification
- `apps/zelaxy/socket-server/middleware/permissions.ts` - workflow/workspace permission checks
- `apps/zelaxy/socket-server/handlers/*.ts` - all real-time event handlers
- `apps/zelaxy/socket-server/rooms/manager.ts` - workflow room state and presence source of truth
- `apps/zelaxy/socket-server/database/operations.ts` - normalized table persistence for operations
- `apps/zelaxy/socket-server/routes/http.ts` - server-to-server notification endpoints
- `apps/zelaxy/contexts/socket-context.tsx` - client Socket.IO lifecycle + emit/listen API
- `apps/zelaxy/hooks/use-collaborative-workflow.ts` - local-first collaborative workflow behavior
- `apps/zelaxy/stores/operation-queue/store.ts` - sequential queue, retry, timeout, debounce
- `apps/zelaxy/stores/workflows/workflow/store.ts` - workflow graph state + history hooks
- `apps/zelaxy/stores/workflows/middleware.ts` - undo/redo with subblock snapshots
- `apps/zelaxy/stores/workflows/registry/store.ts` - workflow loading and workspace transition reset
- `apps/zelaxy/stores/workflows/subblock/store.ts` - per-workflow subblock value layer
- `apps/zelaxy/stores/safe-storage.ts` - SSR-safe persist storage fallback

## Runtime Architecture

### Socket Server
`apps/zelaxy/socket-server` runs as a dedicated process.

- Port: `PORT || SOCKET_PORT || 3002`
- Host: `0.0.0.0` by default
- Transports: `websocket` with `polling` fallback
- Auth: Better Auth one-time token from `socket.handshake.auth.token`
- CORS origins: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VERCEL_URL`, `http://localhost:3000`, plus `ALLOWED_ORIGINS`

### Room Model
- Workflow room: collaborative canvas state and presence
- Workspace room: execution log streaming across workflows (`workspace:<workspaceId>`)
- One socket can only be in one workflow room at a time
- Presence list is authoritative via `presence-update` from `RoomManager`

### Client Model
- `SocketProvider` creates a single client session socket
- One-time socket token is regenerated for every connection and reconnection attempt
- Workflow join is URL-driven (`workflowId` route param) and auto-rejoined after reconnect
- Workspace join is explicit for logs/execution listeners

## End-to-End Operation Flow

```text
UI action
  -> useCollaborativeWorkflow local update
  -> add operation to operation queue
  -> SocketContext emits operation with operationId
  -> server validates + authorizes + persists/broadcasts
  -> server emits operation-confirmed or operation-failed
  -> queue confirmOperation/failOperation updates reliability state
```

### Important server behavior
- Position updates (`update-position` on `block`) are broadcast first, then persisted async for low latency.
- Most other operations are persisted first, then broadcast.
- Client `operationId` is used only for ack/fail semantics and queue reliability.

## Event Contract Map

### Primary collaboration events
- Client -> server: `join-workflow`, `leave-workflow`, `request-sync`
- Client -> server: `workflow-operation`, `subblock-update`, `variable-update`
- Client -> server: `cursor-update`, `selection-update`
- Client <- server: `workflow-state`, `workflow-operation`, `subblock-update`, `variable-update`
- Client <- server: `operation-confirmed`, `operation-failed`, `operation-error`, `operation-forbidden`
- Client <- server: `presence-update`, `cursor-update`, `selection-update`

### External workflow lifecycle events (HTTP -> socket broadcast)
- `workflow-deleted`
- `workflow-reverted`
- `workflow-updated`
- `copilot-workflow-edit`

### Execution streaming events
- `execution:started`
- `execution:block-complete`
- `execution:complete`

## Server Handler Responsibilities

### `handlers/workflow.ts`
- Handles `join-workflow`, access checks, room switch, presence updates, initial `workflow-state`
- Handles `request-sync` for explicit state refresh
- Handles `leave-workflow`

### `handlers/operations.ts`
- Validates payload via `WorkflowOperationSchema`
- Checks permissions using `verifyOperationPermission`
- Persists/broadcasts operations and emits ack/fail
- Uses retryable flags for queue behavior on failures

### `handlers/subblocks.ts` and `handlers/variables.ts`
- Persist subblock/variable updates in transactions
- Skip or fail gracefully when workflow/block/variable no longer exists
- Emit `operation-confirmed` or `operation-failed` when `operationId` is present

### `handlers/presence.ts`
- Updates cursor/selection in room presence state
- Broadcasts deltas to other sockets in the room

### `handlers/workspace.ts`
- Joins/leaves workspace-prefixed rooms for execution log streaming

## Client Socket Context Patterns

### `contexts/socket-context.tsx`
- Fetches one-time token from `/api/auth/socket-token`
- Uses `auth: (cb) => ...` to regenerate token for each connection attempt
- Maintains `isConnected`, `isConnecting`, `currentWorkflowId`, `currentWorkspaceId`, `presenceUsers`
- Throttles high-frequency emits:
  - block position updates batched at ~33ms
  - cursor emits throttled at ~33ms
- Handles rehydration flows:
  - `workflow-state` updates workflow + subblock stores
  - `workflow-updated` triggers `request-sync`
  - `copilot-workflow-edit` fetches fresh workflow from API and rehydrates stores

## Collaborative Hook Rules

### `hooks/use-collaborative-workflow.ts`
- Uses local-first updates for responsive UI
- Registers emitters into operation queue with `registerEmitFunctions`
- Uses `isApplyingRemoteChange` guard to prevent feedback loops
- Applies out-of-order protection for block position updates using server/client timestamps
- Skips socket emissions in diff mode (`useWorkflowDiffStore().isShowingDiff`)
- Handles queue acknowledgement through `onOperationConfirmed` and `onOperationFailed`

## Zustand State Architecture

### Core stores for collaboration
- `workflow/store.ts`: canonical in-memory graph (`blocks`, `edges`, `loops`, `parallels`) plus deployment flags
- `workflows/middleware.ts`: undo/redo history with subblock snapshot capture
- `workflows/registry/store.ts`: workflow metadata loading, active workflow, workspace transition reset guards
- `workflows/subblock/store.ts`: value layer keyed by workflow -> block -> subblock
- `panel/variables/store.ts`: workflow variable map and reference update logic
- `operation-queue/store.ts`: FIFO processing, timeout, retries, debounced updates, offline failover

### Queue semantics (`operation-queue/store.ts`)
- Sequential FIFO processing (single in-flight operation)
- Debounce windows:
  - subblock updates: 25ms keyed by `blockId-subblockId`
  - variable updates: 25ms keyed by `variableId-field`
- Timeout: 5s per in-flight operation
- Retry policy: exponential backoff (`2s`, `4s`, `8s`), max 3 retries
- On terminal failure: `triggerOfflineMode()` clears queue and sets `hasOperationError`
- Supports targeted cancellation for block/variable scoped operations

### Workflow history semantics
- History present/past/future snapshots include subblock values
- Undo/redo restores both graph state and subblock store values
- Sync control methods are intentionally no-ops in socket-first architecture

### SSR-safe persistence
- Use `createSafeStorage()` in persisted stores
- Falls back to no-op storage when `window.localStorage` is unavailable
- Prevents server-side `storage.setItem` crashes in non-browser runtimes

## Implementation Rules

### When adding or changing collaboration operations
1. Update validation schema in `socket-server/validation/schemas.ts` if payload shape changes.
2. Update server persistence logic in `socket-server/database/operations.ts`.
3. Update relevant handlers in `socket-server/handlers`.
4. Update client emit and listener logic in `contexts/socket-context.tsx`.
5. Update queue routing logic in `stores/operation-queue/store.ts` if target/type changed.
6. Update collaborative hook logic in `hooks/use-collaborative-workflow.ts`.

### When adding or changing stores
1. Keep one clear domain per store.
2. Prefer selectors over full-store subscriptions in React components.
3. Use `OtherStore.getState()` for non-reactive cross-store reads to avoid circular render coupling.
4. Add explicit reset logic when switching workspace/user context.

## Mandatory Sync for User-Facing Changes

Any user-visible collaboration or state behavior change must include sync updates in the same task unless explicitly waived by the user:

1. Update affected tests (queue behavior, handler behavior, workflow synchronization).
2. Update documentation when event names, payloads, permissions, or UX behavior change.
3. Update changelog/release notes when real-time behavior changes materially.

## Debug Checklist
1. Confirm token generation endpoint works: `/api/auth/socket-token`.
2. Confirm socket auth middleware accepts token and attaches user context.
3. Confirm correct room membership (`join-workflow` or `join-workspace`).
4. Check for `operation-failed` vs `operation-forbidden` vs `operation-error` event type.
5. Validate queue state: pending/processing counts, timeout/retry activity.
6. Verify workflow sync path (`request-sync`, `workflow-state`, `copilot-workflow-edit`).
7. Check permission role behavior (`admin`, `write`, `read`) for target operation.

## Common Pitfalls
1. Emitting events without `currentWorkflowId` causes silent no-op on client.
2. Forgetting `operationId` breaks queue acknowledgement and retry handling.
3. Skipping schema updates when payloads change causes Zod validation failures.
4. Updating workflow graph without subblock synchronization causes stale field values.
5. Treating `user-joined/user-left` as primary presence source instead of `presence-update`.
6. Using persisted storage directly in server contexts instead of `createSafeStorage()`.
