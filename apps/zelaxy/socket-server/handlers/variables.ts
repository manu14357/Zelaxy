import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflow } from '@/db/schema'
import type { HandlerDependencies } from '@/socket-server/handlers/workflow'
import type { AuthenticatedSocket } from '@/socket-server/middleware/auth'
import { resolveCurrentWorkflowRole } from '@/socket-server/middleware/permissions'
import { enforceRateLimit } from '@/socket-server/middleware/rate-limit'
import type { RoomManager } from '@/socket-server/rooms/manager'

const logger = createLogger('VariablesHandlers')

export function setupVariablesHandlers(
  socket: AuthenticatedSocket,
  deps: HandlerDependencies | RoomManager
) {
  const roomManager =
    deps instanceof Object && 'roomManager' in deps ? deps.roomManager : (deps as RoomManager)

  socket.on('variable-update', async (data) => {
    // Variable edits are mutating ops → TIGHT bucket. Reject via operation-failed (retryable) on
    // exhaustion so the client queue backs off instead of wedging.
    if (!enforceRateLimit(socket, 'tight', data?.operationId)) {
      return
    }

    const workflowId = roomManager.getWorkflowIdForSocket(socket.id)
    const session = roomManager.getUserSession(socket.id)

    if (!workflowId || !session) {
      logger.debug(`Ignoring variable update: socket not connected to any workflow room`, {
        socketId: socket.id,
        hasWorkflowId: !!workflowId,
        hasSession: !!session,
      })
      return
    }

    const { variableId, field, value, timestamp, operationId } = data
    const room = roomManager.getWorkflowRoom(workflowId)

    if (!room) {
      logger.debug(`Ignoring variable update: workflow room not found`, {
        socketId: socket.id,
        workflowId,
        variableId,
        field,
      })
      return
    }

    // Authorize the write. This handler bypasses the workflow-operation permission gate, so read-only
    // collaborators could otherwise edit variable values. Re-validate the CURRENT role (TTL-cached)
    // rather than trusting the role cached at join, so a mid-session downgrade/removal takes effect.
    const currentRole = await resolveCurrentWorkflowRole(session.userId, workflowId, session.role)
    if (!currentRole || currentRole === 'read') {
      logger.warn(`Read-only user ${session.userId} blocked from variable update in ${workflowId}`)
      if (operationId) {
        socket.emit('operation-failed', {
          operationId,
          error: 'Read-only users cannot edit variables',
          retryable: false,
        })
      }
      socket.emit('operation-forbidden', {
        type: 'INSUFFICIENT_PERMISSIONS',
        message: 'Read-only users cannot edit variables',
        operation: 'variable-update',
        target: 'variable',
      })
      return
    }

    try {
      const userPresence = room.users.get(socket.id)
      if (userPresence) {
        userPresence.lastActivity = Date.now()
      }

      const workflowExists = await db
        .select({ id: workflow.id })
        .from(workflow)
        .where(eq(workflow.id, workflowId))
        .limit(1)

      if (workflowExists.length === 0) {
        logger.warn(`Ignoring variable update: workflow ${workflowId} no longer exists`, {
          socketId: socket.id,
          variableId,
          field,
        })
        roomManager.cleanupUserFromRoom(socket.id, workflowId)
        return
      }

      let updateSuccessful = false
      await db.transaction(async (tx) => {
        // Lock the workflow row for the transaction. All variables live in one JSON blob updated
        // read-modify-write, so without FOR UPDATE concurrent edits to different variables would race
        // and the second write would clobber the first (lost update under READ COMMITTED).
        const [workflowRecord] = await tx
          .select({ variables: workflow.variables })
          .from(workflow)
          .where(eq(workflow.id, workflowId))
          .limit(1)
          .for('update')

        if (!workflowRecord) {
          logger.debug(
            `Ignoring variable update for deleted workflow: ${workflowId}/${variableId}.${field}`
          )
          return
        }

        const variables = (workflowRecord.variables as any) || {}

        if (!variables[variableId]) {
          logger.debug(
            `Ignoring variable update for deleted variable: ${workflowId}/${variableId}.${field}`
          )
          return
        }

        variables[variableId] = {
          ...variables[variableId],
          [field]: value,
        }

        await tx
          .update(workflow)
          .set({
            variables: variables,
            updatedAt: new Date(),
          })
          .where(eq(workflow.id, workflowId))

        updateSuccessful = true
      })

      if (updateSuccessful) {
        socket.to(workflowId).emit('variable-update', {
          variableId,
          field,
          value,
          timestamp,
          senderId: socket.id,
          userId: session.userId,
        })

        if (operationId) {
          socket.emit('operation-confirmed', {
            operationId,
            serverTimestamp: Date.now(),
          })
        }

        logger.debug(`Variable update in workflow ${workflowId}: ${variableId}.${field}`)
      } else if (operationId) {
        socket.emit('operation-failed', {
          operationId,
          error: 'Variable no longer exists',
          retryable: false,
        })
      }
    } catch (error) {
      logger.error('Error handling variable update:', error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (operationId) {
        socket.emit('operation-failed', {
          operationId,
          error: errorMessage,
          retryable: true,
        })
      }

      socket.emit('operation-error', {
        type: 'VARIABLE_UPDATE_FAILED',
        message: `Failed to update variable ${variableId}.${field}: ${errorMessage}`,
        operation: 'variable-update',
        target: 'variable',
      })
    }
  })
}
