import type { IncomingMessage, ServerResponse } from 'http'
import type { Server } from 'socket.io'
import { env } from '@/lib/env'
import type { RoomManager } from '@/socket-server/rooms/manager'

interface Logger {
  info: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
  debug: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
}

/**
 * These POST endpoints are a server-to-server bridge: the main Next.js app / background workers call
 * them to broadcast lifecycle + execution events into socket rooms. They are NOT meant to be
 * client-reachable — without auth, anyone who can reach the port could force-disconnect users from a
 * workflow, spoof execution logs into a workspace room, or trigger rehydration storms. Require the
 * shared INTERNAL_API_SECRET (the same secret used for the app's other internal endpoints).
 */
function isInternalRequestAuthorized(req: IncomingMessage): boolean {
  const provided = req.headers['x-internal-secret']
  return typeof provided === 'string' && provided === env.INTERNAL_API_SECRET
}

/**
 * Creates an HTTP request handler for the socket server
 * @param roomManager - RoomManager instance for managing workflow rooms and state
 * @param logger - Logger instance for logging requests and errors
 * @param io - Socket.IO server instance for broadcasting execution events
 * @returns HTTP request handler function
 */
export function createHttpHandler(roomManager: RoomManager, logger: Logger, io?: Server) {
  return (req: IncomingMessage, res: ServerResponse) => {
    // Handle CORS preflight for all /api/* routes
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      })
      res.end()
      return
    }

    // Add CORS headers to all responses
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    }

    // All POST /api/* routes are the internal server-to-server bridge — require the shared secret.
    // (GET / and /health stay public for load-balancer/Railway health checks.)
    if (
      req.method === 'POST' &&
      req.url?.startsWith('/api/') &&
      !isInternalRequestAuthorized(req)
    ) {
      logger.warn(`Rejected unauthenticated internal request to ${req.url}`, {
        origin: req.headers.origin,
      })
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    // Handle root and health check for Railway
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'zelaxy-socket-server',
          timestamp: new Date().toISOString(),
          connections: roomManager.getTotalActiveConnections(),
        })
      )
      return
    }

    // Handle workflow deletion notifications from the main API
    if (req.method === 'POST' && req.url === '/api/workflow-deleted') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const { workflowId } = JSON.parse(body)
          roomManager.handleWorkflowDeletion(workflowId)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (error) {
          logger.error('Error handling workflow deletion notification:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to process deletion notification' }))
        }
      })
      return
    }

    // Handle workflow update notifications from the main API
    if (req.method === 'POST' && req.url === '/api/workflow-updated') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const { workflowId } = JSON.parse(body)
          roomManager.handleWorkflowUpdate(workflowId)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (error) {
          logger.error('Error handling workflow update notification:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to process update notification' }))
        }
      })
      return
    }

    // Handle copilot workflow edit notifications from the main API
    if (req.method === 'POST' && req.url === '/api/copilot-workflow-edit') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const { workflowId, description } = JSON.parse(body)
          roomManager.handleCopilotWorkflowEdit(workflowId, description)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (error) {
          logger.error('Error handling copilot workflow edit notification:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to process copilot edit notification' }))
        }
      })
      return
    }

    // Handle workflow revert notifications from the main API
    if (req.method === 'POST' && req.url === '/api/workflow-reverted') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const { workflowId, timestamp } = JSON.parse(body)
          roomManager.handleWorkflowRevert(workflowId, timestamp)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (error) {
          logger.error('Error handling workflow revert notification:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to process revert notification' }))
        }
      })
      return
    }

    // ============================================================
    // Execution event endpoints — real-time log streaming
    // ============================================================

    // Notify clients that a workflow execution has started
    if (req.method === 'POST' && req.url === '/api/execution-started') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          const { workflowId, workspaceId } = data

          // Broadcast to workflow room (canvas viewers)
          if (io) {
            io.to(workflowId).emit('execution:started', data)

            // Broadcast to workspace room (logs page viewers)
            if (workspaceId) {
              io.to(`workspace:${workspaceId}`).emit('execution:started', data)
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (error) {
          logger.error('Error handling execution-started notification:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to process execution-started notification' }))
        }
      })
      return
    }

    // Notify clients that a single block has completed
    if (req.method === 'POST' && req.url === '/api/execution-block-complete') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          const { workflowId, workspaceId } = data

          if (io) {
            io.to(workflowId).emit('execution:block-complete', data)

            if (workspaceId) {
              io.to(`workspace:${workspaceId}`).emit('execution:block-complete', data)
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (error) {
          logger.error('Error handling execution-block-complete notification:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({ error: 'Failed to process execution-block-complete notification' })
          )
        }
      })
      return
    }

    // Notify clients that a workflow execution has completed
    if (req.method === 'POST' && req.url === '/api/execution-complete') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          const { workflowId, workspaceId } = data

          if (io) {
            io.to(workflowId).emit('execution:complete', data)

            if (workspaceId) {
              io.to(`workspace:${workspaceId}`).emit('execution:complete', data)
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (error) {
          logger.error('Error handling execution-complete notification:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to process execution-complete notification' }))
        }
      })
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
}
