import { and, eq, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { Server } from 'socket.io'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import * as schema from '@/db/schema'
import { workflowBlocks, workflowEdges } from '@/db/schema'

// Create dedicated database connection for room manager
const connectionString = env.POSTGRES_URL ?? env.DATABASE_URL
const db = drizzle(
  postgres(connectionString, {
    prepare: false,
    idle_timeout: 15,
    connect_timeout: 20,
    max: 5,
    onnotice: () => {},
  }),
  { schema }
)

const logger = createLogger('RoomManager')

export interface UserPresence {
  userId: string
  workflowId: string
  userName: string
  socketId: string
  joinedAt: number
  lastActivity: number
  cursor?: { x: number; y: number }
  selection?: { type: 'block' | 'edge' | 'none'; id?: string }
}

export interface WorkflowRoom {
  workflowId: string
  users: Map<string, UserPresence> // socketId -> UserPresence
  lastModified: number
  activeConnections: number
}

export class RoomManager {
  private workflowRooms = new Map<string, WorkflowRoom>()
  private socketToWorkflow = new Map<string, string>()
  // role is the caller's access level in the joined workflow (admin | write | read), cached at join
  // time so per-operation handlers can authorize writes without re-querying the database each event.
  private userSessions = new Map<string, { userId: string; userName: string; role?: string }>()
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  createWorkflowRoom(workflowId: string): WorkflowRoom {
    return {
      workflowId,
      users: new Map(),
      lastModified: Date.now(),
      activeConnections: 0,
    }
  }

  cleanupUserFromRoom(socketId: string, workflowId: string) {
    const room = this.workflowRooms.get(workflowId)
    if (room) {
      room.users.delete(socketId)
      room.activeConnections = Math.max(0, room.activeConnections - 1)

      if (room.activeConnections === 0) {
        this.workflowRooms.delete(workflowId)
        logger.info(`Cleaned up empty workflow room: ${workflowId}`)
      }
    }

    this.socketToWorkflow.delete(socketId)
    this.userSessions.delete(socketId)
  }

  handleWorkflowDeletion(workflowId: string) {
    logger.info(`Handling workflow deletion notification for ${workflowId}`)

    // Broadcast to the room unconditionally. With the Redis adapter attached, io.to() fans out to
    // every pod, so a deletion for a room whose members live on ANOTHER instance still reaches them.
    // Gating this on the in-memory Map (which only tracks THIS pod's members) would silently drop
    // the event on a multi-pod deploy.
    this.io.to(workflowId).emit('workflow-deleted', {
      workflowId,
      message: 'This workflow has been deleted',
      timestamp: Date.now(),
    })

    // Local cleanup only concerns sockets connected to THIS pod. If there's no local room, there's
    // nothing on this instance to disconnect/clean up — the emit above already reached other pods.
    const room = this.workflowRooms.get(workflowId)
    if (!room) {
      logger.debug(
        `No local room for deleted workflow ${workflowId}; broadcast fanned out via adapter`
      )
      return
    }

    const socketsToDisconnect: string[] = []
    room.users.forEach((_presence, socketId) => {
      socketsToDisconnect.push(socketId)
    })

    socketsToDisconnect.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId)
      if (socket) {
        socket.leave(workflowId)
        logger.debug(`Disconnected socket ${socketId} from deleted workflow ${workflowId}`)
      }
      this.cleanupUserFromRoom(socketId, workflowId)
    })

    this.workflowRooms.delete(workflowId)
    logger.info(
      `Cleaned up workflow room ${workflowId} after deletion (${socketsToDisconnect.length} users disconnected)`
    )
  }

  handleWorkflowRevert(workflowId: string, timestamp: number) {
    logger.info(`Handling workflow revert notification for ${workflowId}`)

    // Emit unconditionally so members on other pods (reachable via the Redis adapter) are notified.
    this.io.to(workflowId).emit('workflow-reverted', {
      workflowId,
      message: 'Workflow has been reverted to deployed state',
      timestamp,
    })

    // Local bookkeeping only applies to a room tracked on THIS instance.
    const room = this.workflowRooms.get(workflowId)
    if (!room) {
      logger.debug(
        `No local room for reverted workflow ${workflowId}; broadcast fanned out via adapter`
      )
      return
    }

    room.lastModified = timestamp

    logger.info(`Notified ${room.users.size} local users about workflow revert: ${workflowId}`)
  }

  handleWorkflowUpdate(workflowId: string) {
    logger.info(`Handling workflow update notification for ${workflowId}`)

    const timestamp = Date.now()

    // Notify all clients in the workflow room that the workflow has been updated so they refresh
    // their local state. Emit unconditionally — the Redis adapter fans io.to() out to members on
    // other pods; gating on the in-memory Map would drop the event for a cross-pod room.
    this.io.to(workflowId).emit('workflow-updated', {
      workflowId,
      message: 'Workflow has been updated externally',
      timestamp,
    })

    // Local bookkeeping only applies to a room tracked on THIS instance.
    const room = this.workflowRooms.get(workflowId)
    if (!room) {
      logger.debug(
        `No local room for updated workflow ${workflowId}; broadcast fanned out via adapter`
      )
      return
    }

    room.lastModified = timestamp

    logger.info(`Notified ${room.users.size} local users about workflow update: ${workflowId}`)
  }

  handleCopilotWorkflowEdit(workflowId: string, description?: string) {
    logger.info(`Handling copilot workflow edit notification for ${workflowId}`)

    const timestamp = Date.now()

    // Emit the rehydrate-from-database event unconditionally. The Redis adapter fans io.to() out to
    // members on other pods; gating on the in-memory Map would drop the event for a cross-pod room.
    this.io.to(workflowId).emit('copilot-workflow-edit', {
      workflowId,
      description,
      message: 'Copilot has edited the workflow - rehydrating from database',
      timestamp,
    })

    // Local bookkeeping only applies to a room tracked on THIS instance.
    const room = this.workflowRooms.get(workflowId)
    if (!room) {
      logger.debug(
        `No local room for copilot workflow edit ${workflowId}; broadcast fanned out via adapter`
      )
      return
    }

    room.lastModified = timestamp

    logger.info(
      `Notified ${room.users.size} local users about copilot workflow edit: ${workflowId}`
    )
  }

  async validateWorkflowConsistency(
    workflowId: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const issues: string[] = []

      const orphanedEdges = await db
        .select({
          id: workflowEdges.id,
          sourceBlockId: workflowEdges.sourceBlockId,
          targetBlockId: workflowEdges.targetBlockId,
        })
        .from(workflowEdges)
        .leftJoin(workflowBlocks, eq(workflowEdges.sourceBlockId, workflowBlocks.id))
        .where(and(eq(workflowEdges.workflowId, workflowId), isNull(workflowBlocks.id)))

      if (orphanedEdges.length > 0) {
        issues.push(`Found ${orphanedEdges.length} orphaned edges with missing source blocks`)
      }

      return { valid: issues.length === 0, issues }
    } catch (error) {
      logger.error('Error validating workflow consistency:', error)
      return { valid: false, issues: ['Consistency check failed'] }
    }
  }

  getWorkflowRooms(): ReadonlyMap<string, WorkflowRoom> {
    return this.workflowRooms
  }

  getSocketToWorkflow(): ReadonlyMap<string, string> {
    return this.socketToWorkflow
  }

  getUserSessions(): ReadonlyMap<string, { userId: string; userName: string; role?: string }> {
    return this.userSessions
  }

  hasWorkflowRoom(workflowId: string): boolean {
    return this.workflowRooms.has(workflowId)
  }

  getWorkflowRoom(workflowId: string): WorkflowRoom | undefined {
    return this.workflowRooms.get(workflowId)
  }

  setWorkflowRoom(workflowId: string, room: WorkflowRoom): void {
    this.workflowRooms.set(workflowId, room)
  }

  getWorkflowIdForSocket(socketId: string): string | undefined {
    return this.socketToWorkflow.get(socketId)
  }

  setWorkflowForSocket(socketId: string, workflowId: string): void {
    this.socketToWorkflow.set(socketId, workflowId)
  }

  getUserSession(
    socketId: string
  ): { userId: string; userName: string; role?: string } | undefined {
    return this.userSessions.get(socketId)
  }

  setUserSession(
    socketId: string,
    session: { userId: string; userName: string; role?: string }
  ): void {
    this.userSessions.set(socketId, session)
  }

  getTotalActiveConnections(): number {
    return Array.from(this.workflowRooms.values()).reduce(
      (total, room) => total + room.activeConnections,
      0
    )
  }

  /**
   * Broadcast the authoritative presence roster to a workflow room.
   *
   * The roster is aggregated from `io.in(workflowId).fetchSockets()` reading each socket's
   * `data.presence`. `fetchSockets()` traverses every instance when the Redis adapter is attached,
   * so collaborators on other pods are included; with the in-memory adapter it returns local
   * sockets, which is equivalent to the old Map-based behavior. Falls back to the in-memory Map if
   * the cross-instance fetch fails. Kept sync-returning (fires the async work internally) so callers
   * don't need to change and never leave a floating promise.
   */
  broadcastPresenceUpdate(workflowId: string): void {
    void this.emitPresenceRoster(workflowId)
  }

  private emitFromLocalMap(workflowId: string): void {
    const room = this.workflowRooms.get(workflowId)
    if (room) this.io.to(workflowId).emit('presence-update', Array.from(room.users.values()))
  }

  private async emitPresenceRoster(workflowId: string): Promise<void> {
    try {
      const sockets = await this.io.in(workflowId).fetchSockets()
      const roster = sockets
        .map((s) => (s.data as { presence?: UserPresence } | undefined)?.presence)
        .filter((p): p is UserPresence => Boolean(p))

      if (roster.length > 0) {
        this.io.to(workflowId).emit('presence-update', roster)
        return
      }
      // No presence data resolved (e.g. sockets mid-join) — fall back to the local map.
      this.emitFromLocalMap(workflowId)
    } catch (error) {
      logger.error('Failed to broadcast presence roster, falling back to local map:', error)
      this.emitFromLocalMap(workflowId)
    }
  }

  /**
   * Reconcile the in-memory presence map against sockets actually connected to THIS instance,
   * dropping "ghost" entries whose socket has gone away without a clean disconnect (which would
   * otherwise linger forever and inflate presence + the /health connection count). Each presence
   * entry is owned by the pod its socket connected to, so a local `io.sockets` check is authoritative
   * for this pod's entries. Runs periodically from the bootstrap reaper.
   */
  reapGhostPresence(): void {
    for (const [workflowId, room] of this.workflowRooms) {
      let changed = false
      for (const socketId of [...room.users.keys()]) {
        if (!this.io.sockets.sockets.has(socketId)) {
          room.users.delete(socketId)
          room.activeConnections = Math.max(0, room.activeConnections - 1)
          this.socketToWorkflow.delete(socketId)
          this.userSessions.delete(socketId)
          changed = true
          logger.debug(`Reaped ghost presence ${socketId} from workflow ${workflowId}`)
        }
      }
      if (room.users.size === 0) {
        this.workflowRooms.delete(workflowId)
        continue
      }
      if (changed) this.broadcastPresenceUpdate(workflowId)
    }
  }

  /**
   * Get the number of unique users in a workflow room
   * (not the number of socket connections)
   */
  getUniqueUserCount(workflowId: string): number {
    const room = this.workflowRooms.get(workflowId)
    if (!room) return 0

    const uniqueUsers = new Set<string>()
    room.users.forEach((presence) => {
      uniqueUsers.add(presence.userId)
    })

    return uniqueUsers.size
  }
}
