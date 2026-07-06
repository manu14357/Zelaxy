import { createLogger } from '@/lib/logs/console/logger'
import type { AuthenticatedSocket } from '@/socket-server/middleware/auth'
import { verifyWorkspaceMembership } from '@/socket-server/middleware/permissions'

const logger = createLogger('WorkspaceHandlers')

/**
 * Sets up workspace room handlers for execution events.
 * Workspace rooms allow clients (e.g., the logs page) to receive
 * real-time execution events for all workflows in a workspace.
 */
export function setupWorkspaceHandlers(socket: AuthenticatedSocket) {
  socket.on('join-workspace', async ({ workspaceId }: { workspaceId: string }) => {
    if (!socket.userId) {
      logger.warn(`Join workspace rejected: Socket ${socket.id} not authenticated`)
      socket.emit('join-workspace-error', { error: 'Authentication required' })
      return
    }

    if (!workspaceId) {
      logger.warn(`Join workspace rejected: No workspaceId provided`)
      socket.emit('join-workspace-error', { error: 'workspaceId is required' })
      return
    }

    // Enforce workspace membership before joining. Without this, any authenticated user could
    // subscribe to another workspace's room and receive its real-time execution events (which carry
    // block outputs) — a cross-tenant data leak. Mirrors the access check in join-workflow.
    try {
      const role = await verifyWorkspaceMembership(socket.userId, workspaceId)
      if (!role) {
        logger.warn(
          `Join workspace rejected: user ${socket.userId} is not a member of workspace ${workspaceId}`
        )
        socket.emit('join-workspace-error', { error: 'Access denied to workspace' })
        return
      }
    } catch (error) {
      logger.error(`Error verifying workspace membership for ${socket.userId}:`, error)
      socket.emit('join-workspace-error', { error: 'Failed to verify workspace access' })
      return
    }

    const roomName = `workspace:${workspaceId}`

    // Leave any previous workspace room (simple prefix check)
    for (const room of socket.rooms) {
      if (room.startsWith('workspace:') && room !== roomName) {
        socket.leave(room)
        logger.info(`Socket ${socket.id} left workspace room ${room}`)
      }
    }

    socket.join(roomName)
    logger.info(`User ${socket.userId} (${socket.userName}) joined workspace room ${roomName}`)
  })

  socket.on('leave-workspace', () => {
    for (const room of socket.rooms) {
      if (room.startsWith('workspace:')) {
        socket.leave(room)
        logger.info(`User ${socket.userId} (${socket.userName}) left workspace room ${room}`)
      }
    }
  })
}
