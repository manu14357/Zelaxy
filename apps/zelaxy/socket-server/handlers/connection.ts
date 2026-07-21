import { createLogger } from '@/lib/logs/console/logger'
import { flushPendingSubblocksForSocket } from '@/socket-server/handlers/subblocks'
import type { HandlerDependencies } from '@/socket-server/handlers/workflow'
import type { AuthenticatedSocket } from '@/socket-server/middleware/auth'
import { cleanupRateLimiter } from '@/socket-server/middleware/rate-limit'
import type { RoomManager } from '@/socket-server/rooms/manager'

const logger = createLogger('ConnectionHandlers')

export function setupConnectionHandlers(
  socket: AuthenticatedSocket,
  deps: HandlerDependencies | RoomManager
) {
  const roomManager =
    deps instanceof Object && 'roomManager' in deps ? deps.roomManager : (deps as RoomManager)

  socket.on('error', (error) => {
    logger.error(`Socket ${socket.id} error:`, error)
  })

  socket.conn.on('error', (error) => {
    logger.error(`Socket ${socket.id} connection error:`, error)
  })

  socket.on('disconnect', (reason) => {
    // Tear down this socket's rate-limit buckets so the Map doesn't grow unbounded.
    cleanupRateLimiter(socket.id)

    // Flush any coalesced subblock edits this socket had in flight so they still persist and its
    // queued ops still get resolved, before we forget the socket. Fire-and-forget: disconnect is a
    // sync handler and the flush persists directly to the DB + broadcasts via io (independent of the
    // in-memory room being torn down below).
    void flushPendingSubblocksForSocket(socket.id, roomManager).catch((error) => {
      logger.error(`Error flushing pending subblocks for disconnected socket ${socket.id}:`, error)
    })

    const workflowId = roomManager.getWorkflowIdForSocket(socket.id)
    const session = roomManager.getUserSession(socket.id)

    if (workflowId && session) {
      roomManager.cleanupUserFromRoom(socket.id, workflowId)
      roomManager.broadcastPresenceUpdate(workflowId)
    }
  })
}
