---
name: real-time-and-state
description: 'Work with Socket.io real-time features and Zustand state management. Use for: socket server handlers, room-based collaboration, presence tracking, cursor sync, Zustand store creation, cross-store communication, SSR-safe storage.'
---

# Real-time & State Management Skill — Zelaxy

## Purpose
Work with Socket.io real-time features and Zustand state management.

## When to Use
- Adding real-time collaboration features
- Creating or modifying Zustand stores
- Working with presence/cursor tracking
- Debugging socket connection issues
- Managing execution state

## Socket.io Architecture

### Server Setup
```
Location: apps/zelaxy/socket-server/
Port: SOCKET_PORT || 3002 (separate from Next.js)
Host: 0.0.0.0
Transports: websocket (primary), polling (fallback)
Ping: timeout 60s, interval 25s
Max buffer: 1MB
```

### Directory Structure
```
socket-server/
├── index.ts              # Server entry point
├── config/socket.ts      # Socket.IO creation + CORS
├── database/             # DB persistence layer
├── handlers/             # Event handlers
│   ├── connection.ts     # Connect/disconnect
│   ├── operations.ts     # Workflow operations
│   ├── presence.ts       # User presence
│   ├── subblocks.ts      # Sub-block updates
│   ├── variables.ts      # Variable updates
│   ├── workflow.ts       # Workflow events
│   └── workspace.ts      # Workspace events
├── middleware/
│   ├── auth.ts           # Auth via Better Auth one-time token
│   └── permissions.ts    # Access control
├── rooms/manager.ts      # Room management
├── routes/               # HTTP endpoints
└── validation/           # Input validation
```

### Authentication
```typescript
// Middleware: socket-server/middleware/auth.ts
// Uses Better Auth one-time token validation
// Token from: socket.handshake.auth.token
// Stores on socket: userId, userName, userEmail, activeOrganizationId
// Rejects connections without valid token
```

### CORS Configuration
```typescript
// Allowed origins:
// - NEXT_PUBLIC_APP_URL
// - NEXT_PUBLIC_VERCEL_URL
// - localhost:3000
// - ALLOWED_ORIGINS (comma-separated)
// Credentials: true
```

### Room-Based Collaboration
- Users join workflow/workspace rooms
- Operations broadcast to room members
- Presence tracked per room
- Conflict resolution via operation confirmation/failure events

## Socket Context (Client)

```typescript
// contexts/socket-context.tsx
// Provides: socket, isConnected, isConnecting, presenceUsers

// Room operations
joinWorkflow(workflowId)
leaveWorkflow(workflowId)
joinWorkspace(workspaceId)
leaveWorkspace(workspaceId)

// Collaborative editing
emitWorkflowOperation(operation)    // Block/edge changes
emitSubblockUpdate(update)          // Sub-block value changes
emitVariableUpdate(update)          // Variable changes

// Presence
emitCursorUpdate(position)          // Mouse position
emitSelectionUpdate(selection)      // Selected blocks/edges

// Execution events (listen)
onExecutionStarted(callback)
onExecutionBlockComplete(callback)
onExecutionComplete(callback)

// Conflict resolution (listen)
onOperationConfirmed(callback)
onOperationFailed(callback)
```

### PresenceUser Type
```typescript
type PresenceUser = {
  userId: string
  userName: string
  cursor?: { x: number; y: number }
  selectedBlockId?: string
  selectedEdgeId?: string
}
```

## Zustand Store Architecture

### Store Domains
```
stores/
├── execution/          # Workflow execution state
├── workflows/          # Workflow data + registry + subblock + yaml
├── copilot/            # AI copilot state
├── custom-tools/       # Custom tool definitions
├── custom-ui/          # Embedded UI state
├── knowledge/          # Knowledge base state
├── llm-selection/      # LLM provider selection
├── logs/               # Execution logs
├── ollama/             # Local Ollama state
├── bottom-panel/       # Bottom panel UI state
├── operation-queue/    # Socket operation queue
├── organization/       # Organization state
├── panel/              # Side panel state
├── settings/           # User settings
├── sidebar/            # Sidebar state
├── subscription/       # Billing/subscription
├── user/               # User profile
├── workflow-diff/      # Workflow diff/compare
├── folders/            # Folder organization
├── constants.ts        # Shared constants
├── safe-storage.ts     # SSR-safe storage wrapper
└── index.ts            # Re-exports
```

### Store Pattern

```typescript
// Standard store creation
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface MyState {
  items: Item[]
  isLoading: boolean
}

interface MyActions {
  setItems: (items: Item[]) => void
  fetchItems: () => Promise<void>
  reset: () => void
}

export const useMyStore = create<MyState & MyActions>()(
  devtools(
    (set, get) => ({
      // State
      items: [],
      isLoading: false,

      // Actions
      setItems: (items) => set({ items }),

      fetchItems: async () => {
        if (get().isLoading) return  // Dedup guard
        set({ isLoading: true })
        try {
          const res = await fetch('/api/my-items')
          const data = await res.json()
          set({ items: data.data, isLoading: false })
        } catch {
          set({ isLoading: false })
        }
      },

      reset: () => set({ items: [], isLoading: false }),
    }),
    { name: 'my-store' }
  )
)
```

### Workflow Store (Advanced)
```typescript
// Uses custom middleware stack:
// devtools + withHistory (undo/redo)

// State includes:
// blocks, edges, loops, parallels, lastSaved, isDeployed, deployedAt

// SyncControl interface for save/sync
// (originally HTTP, now socket-based — methods are no-ops)

// Deployment tracking per workflow via deploymentStatuses
```

### Execution Store
```typescript
// Key state:
activeBlockIds: Set<string>   // Currently executing blocks
pendingBlocks: string[]       // Blocks waiting to execute
isExecuting: boolean
isDebugging: boolean
executor: Executor | null
debugContext: DebugContext | null

// Auto-pans canvas to active blocks during execution
```

### SSR-Safe Storage
```typescript
// stores/safe-storage.ts
import { createSafeStorage } from './safe-storage'

// Wraps createJSONStorage with SSR fallback
// No-op StateStorage for server-side (Trigger.dev, Node.js)
// Use when persisting store to localStorage
```

### Cross-Store Communication

```typescript
// Read another store's state (not reactive)
import { useOtherStore } from '@/stores/other'

const doSomething = () => {
  const otherValue = useOtherStore.getState().someValue
  // Use otherValue...
}

// Subscribe reactively in a component
const value = useOtherStore(s => s.someValue)
```

### Selector Best Practices

```typescript
// GOOD — Fine-grained selector, minimal re-renders
const isExecuting = useExecutionStore(s => s.isExecuting)
const blockCount = useWorkflowStore(s => s.blocks.length)

// GOOD — Derived selector
const activeBlock = useExecutionStore(s =>
  s.activeBlockIds.size > 0 ? [...s.activeBlockIds][0] : null
)

// BAD — Full store subscription, re-renders on every change
const { isExecuting, activeBlockIds, pendingBlocks } = useExecutionStore()
```

## Common Issues
1. **Socket not connecting**: Check `SOCKET_PORT`, CORS origins, auth token
2. **Presence not updating**: Verify room join and cursor emit events
3. **Store not updating UI**: Use selectors, not destructured store
4. **SSR hydration mismatch**: Use `createSafeStorage()` for persisted stores
5. **Circular store deps**: Use `getState()` for cross-store reads, not hooks
6. **Operation queue overflow**: Check socket connection health, reconnect logic
