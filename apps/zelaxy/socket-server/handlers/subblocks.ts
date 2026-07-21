import { and, eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflow, workflowBlocks } from '@/db/schema'
import type { HandlerDependencies } from '@/socket-server/handlers/workflow'
import type { AuthenticatedSocket } from '@/socket-server/middleware/auth'
import { resolveCurrentWorkflowRole } from '@/socket-server/middleware/permissions'
import { enforceRateLimit } from '@/socket-server/middleware/rate-limit'
import type { RoomManager } from '@/socket-server/rooms/manager'

const logger = createLogger('SubblocksHandlers')

/**
 * Server-side coalesce window (ms) for rapid subblock updates.
 *
 * Typing into a field fires one subblock-update per keystroke. Without coalescing each keystroke is
 * a locked read-modify-write transaction + a room broadcast. Buffering per
 * (workflowId, blockId, subblockId) and flushing the LATEST value once per window collapses a burst
 * of keystrokes into a single persist + single broadcast, while still confirming EVERY queued op.
 */
const COALESCE_INTERVAL_MS = 25

interface PendingSubblock {
  workflowId: string
  blockId: string
  subblockId: string
  /** Latest value wins — earlier buffered values are superseded, only this one is persisted. */
  value: any
  timestamp: number
  /** Latest sender, used for the broadcast payload's senderId/userId (informational). */
  senderSocketId: string
  senderUserId: string
  /**
   * EVERY socket that contributed to this buffer. The flush broadcast must `.except()` ALL of them
   * (not just the last sender) so no contributor receives an echo of its own edit.
   */
  contributors: Set<string>
  /**
   * operationId -> socketId for each queue-tracked op folded into this buffer. Each entry MUST get
   * exactly one confirm-or-fail when the buffer flushes — no orphans.
   */
  opToSocket: Map<string, string>
  timeout: NodeJS.Timeout
}

// Keyed by `${workflowId}:${blockId}:${subblockId}`.
const pendingSubblockUpdates = new Map<string, PendingSubblock>()

function coalesceKey(workflowId: string, blockId: string, subblockId: string): string {
  return `${workflowId}:${blockId}:${subblockId}`
}

/**
 * Persist the latest buffered value for one coalesce key and resolve every op folded into it.
 *
 * Invariants preserved from the original per-keystroke handler:
 *  - workflow-existence check before the write,
 *  - SELECT..FOR UPDATE row lock on the block (single JSON blob read-modify-write must be serialized
 *    or concurrent edits to different subblocks clobber each other),
 *  - broadcast excludes ALL contributing senders,
 *  - EVERY buffered operationId gets exactly one confirm-or-fail.
 */
async function flushSubblockUpdate(
  pending: PendingSubblock,
  roomManager: RoomManager
): Promise<void> {
  const { workflowId, blockId, subblockId, value, timestamp, opToSocket } = pending
  const io = roomManager.io

  const confirmAll = () => {
    opToSocket.forEach((socketId, operationId) => {
      io.to(socketId).emit('operation-confirmed', {
        operationId,
        serverTimestamp: Date.now(),
      })
    })
  }
  const failAll = (error: string, retryable: boolean) => {
    opToSocket.forEach((socketId, operationId) => {
      io.to(socketId).emit('operation-failed', {
        operationId,
        error,
        retryable,
      })
    })
  }

  try {
    // Verify the workflow still exists before attempting the write.
    const workflowExists = await db
      .select({ id: workflow.id })
      .from(workflow)
      .where(eq(workflow.id, workflowId))
      .limit(1)

    if (workflowExists.length === 0) {
      logger.warn(`Dropping coalesced subblock update: workflow ${workflowId} no longer exists`, {
        blockId,
        subblockId,
      })
      // Workflow is gone — retrying won't help.
      failAll('Workflow no longer exists', false)
      return
    }

    let updateSuccessful = false
    await db.transaction(async (tx) => {
      // Lock the block row for the transaction. subBlocks is a single JSON blob updated
      // read-modify-write; without FOR UPDATE two concurrent edits to different subblocks of the
      // same block would both read the old blob and the second write would clobber the first (lost
      // update under READ COMMITTED). The lock serializes them.
      const [block] = await tx
        .select({ subBlocks: workflowBlocks.subBlocks })
        .from(workflowBlocks)
        .where(and(eq(workflowBlocks.id, blockId), eq(workflowBlocks.workflowId, workflowId)))
        .limit(1)
        .for('update')

      if (!block) {
        // Block was deleted - a normal race in collaborative editing.
        logger.debug(
          `Ignoring coalesced subblock update for deleted block: ${workflowId}/${blockId}.${subblockId}`
        )
        return
      }

      const subBlocks = (block.subBlocks as any) || {}

      if (!subBlocks[subblockId]) {
        // Create new subblock with minimal structure.
        subBlocks[subblockId] = {
          id: subblockId,
          type: 'unknown', // Will be corrected by next collaborative update
          value,
        }
      } else {
        // Preserve existing id and type, only update value.
        subBlocks[subblockId] = {
          ...subBlocks[subblockId],
          value,
        }
      }

      await tx
        .update(workflowBlocks)
        .set({ subBlocks, updatedAt: new Date() })
        .where(and(eq(workflowBlocks.id, blockId), eq(workflowBlocks.workflowId, workflowId)))

      updateSuccessful = true
    })

    if (updateSuccessful) {
      // Broadcast to the room, excluding EVERY contributing sender (works cross-pod via the adapter).
      const excludeIds = [...pending.contributors]
      const broadcastPayload = {
        blockId,
        subblockId,
        value,
        timestamp,
        senderId: pending.senderSocketId,
        userId: pending.senderUserId,
      }

      if (excludeIds.length > 0) {
        io.to(workflowId).except(excludeIds).emit('subblock-update', broadcastPayload)
      } else {
        io.to(workflowId).emit('subblock-update', broadcastPayload)
      }

      confirmAll()
      logger.debug(`Coalesced subblock update in workflow ${workflowId}: ${blockId}.${subblockId}`)
    } else {
      // Block no longer exists — no point retrying.
      failAll('Block no longer exists', false)
    }
  } catch (error) {
    logger.error('Error flushing coalesced subblock update:', error)
    failAll(error instanceof Error ? error.message : 'Unknown error', true)
  }
}

/**
 * Remove one buffered key and flush it immediately (clearing its timer). Safe against a racing timer:
 * whichever removes the key from the Map first flushes; the loser no-ops.
 */
async function drainKey(key: string, roomManager: RoomManager): Promise<void> {
  const pending = pendingSubblockUpdates.get(key)
  if (!pending) return
  pendingSubblockUpdates.delete(key)
  clearTimeout(pending.timeout)
  await flushSubblockUpdate(pending, roomManager)
}

/**
 * Flush every buffer a disconnecting socket contributed to, so its in-flight edits still persist and
 * its queued ops still get resolved. Called from the disconnect handler.
 */
export async function flushPendingSubblocksForSocket(
  socketId: string,
  roomManager: RoomManager
): Promise<void> {
  const keys: string[] = []
  for (const [key, pending] of pendingSubblockUpdates) {
    if (pending.contributors.has(socketId)) keys.push(key)
  }
  for (const key of keys) {
    await drainKey(key, roomManager)
  }
}

/** Flush ALL buffered subblock updates (graceful shutdown). */
export async function flushAllPendingSubblocks(roomManager: RoomManager): Promise<void> {
  const keys = [...pendingSubblockUpdates.keys()]
  for (const key of keys) {
    await drainKey(key, roomManager)
  }
}

export function setupSubblocksHandlers(
  socket: AuthenticatedSocket,
  deps: HandlerDependencies | RoomManager
) {
  const roomManager =
    deps instanceof Object && 'roomManager' in deps ? deps.roomManager : (deps as RoomManager)
  socket.on('subblock-update', async (data) => {
    // Subblock edits are mutating ops → TIGHT bucket. Reject via operation-failed (retryable) on
    // exhaustion so the client queue backs off instead of wedging.
    if (!enforceRateLimit(socket, 'tight', data?.operationId)) {
      return
    }

    const workflowId = roomManager.getWorkflowIdForSocket(socket.id)
    const session = roomManager.getUserSession(socket.id)

    if (!workflowId || !session) {
      logger.debug(`Ignoring subblock update: socket not connected to any workflow room`, {
        socketId: socket.id,
        hasWorkflowId: !!workflowId,
        hasSession: !!session,
      })
      return
    }

    const { blockId, subblockId, value, timestamp, operationId } = data
    const room = roomManager.getWorkflowRoom(workflowId)

    if (!room) {
      logger.debug(`Ignoring subblock update: workflow room not found`, {
        socketId: socket.id,
        workflowId,
        blockId,
        subblockId,
      })
      return
    }

    // Authorize the write BEFORE enqueue. This handler bypasses the workflow-operation permission
    // gate, so read-only collaborators could otherwise edit block field values. Re-validate the
    // CURRENT role (TTL-cached) per op rather than trusting the role cached at join, so a mid-session
    // downgrade/removal takes effect. Kept inline (not moved into the flush) so a downgraded user is
    // rejected synchronously and never enters the coalesce buffer.
    const currentRole = await resolveCurrentWorkflowRole(session.userId, workflowId, session.role)
    if (!currentRole || currentRole === 'read') {
      logger.warn(`Read-only user ${session.userId} blocked from subblock update in ${workflowId}`)
      if (operationId) {
        socket.emit('operation-failed', {
          operationId,
          error: 'Read-only users cannot edit block values',
          retryable: false,
        })
      }
      socket.emit('operation-forbidden', {
        type: 'INSUFFICIENT_PERMISSIONS',
        message: 'Read-only users cannot edit block values',
        operation: 'subblock-update',
        target: 'subblock',
      })
      return
    }

    const userPresence = room.users.get(socket.id)
    if (userPresence) {
      userPresence.lastActivity = Date.now()
    }

    // Coalesce by (workflowId, blockId, subblockId): buffer the latest value, (re)arm a short timer,
    // and fold this op into the buffer. The actual persist + broadcast happens once, on flush.
    const key = coalesceKey(workflowId, blockId, subblockId)
    const existing = pendingSubblockUpdates.get(key)

    if (existing) {
      clearTimeout(existing.timeout)
      existing.value = value
      existing.timestamp = timestamp
      existing.senderSocketId = socket.id
      existing.senderUserId = session.userId
      existing.contributors.add(socket.id)
      if (operationId) existing.opToSocket.set(operationId, socket.id)
      existing.timeout = setTimeout(() => {
        void drainKey(key, roomManager)
      }, COALESCE_INTERVAL_MS)
    } else {
      const opToSocket = new Map<string, string>()
      if (operationId) opToSocket.set(operationId, socket.id)
      const timeout = setTimeout(() => {
        void drainKey(key, roomManager)
      }, COALESCE_INTERVAL_MS)
      pendingSubblockUpdates.set(key, {
        workflowId,
        blockId,
        subblockId,
        value,
        timestamp,
        senderSocketId: socket.id,
        senderUserId: session.userId,
        contributors: new Set([socket.id]),
        opToSocket,
        timeout,
      })
    }
  })
}
