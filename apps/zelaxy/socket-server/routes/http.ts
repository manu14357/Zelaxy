import { timingSafeEqual } from 'crypto'
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

/** Max internal-bridge request body. These payloads are tiny (ids + timestamps); cap to stop abuse. */
const MAX_BODY_BYTES = 256 * 1024

/** Constant-time string comparison to avoid leaking the internal secret via response timing. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
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
  const secret = env.INTERNAL_API_SECRET
  if (typeof provided !== 'string' || !secret) return false
  return safeCompare(provided, secret)
}

/**
 * Read and JSON-parse a request body with a hard size cap. Aborts the request if the body exceeds
 * MAX_BODY_BYTES. On success calls `onParsed(data)`; on any error responds 400/413 and does not call it.
 */
function readJsonBody(
  req: IncomingMessage,
  res: ServerResponse,
  logger: Logger,
  onParsed: (data: any) => void
): void {
  let size = 0
  const chunks: Buffer[] = []
  let aborted = false

  req.on('data', (chunk: Buffer) => {
    if (aborted) return
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      aborted = true
      res.writeHead(413, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Payload too large' }))
      req.destroy()
      return
    }
    chunks.push(chunk)
  })

  req.on('end', () => {
    if (aborted) return
    try {
      const raw = Buffer.concat(chunks).toString('utf8')
      onParsed(raw ? JSON.parse(raw) : {})
    } catch (error) {
      logger.error('Failed to parse internal bridge body:', error)
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    }
  })

  req.on('error', (error) => {
    if (aborted) return
    aborted = true
    logger.error('Internal bridge request stream error:', error)
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Request error' }))
  })
}

function ok(res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ success: true }))
}

function fail(res: ServerResponse, message: string): void {
  res.writeHead(500, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: message }))
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
    if (req.method === 'POST' && req.url?.startsWith('/api/') && !isInternalRequestAuthorized(req)) {
      logger.warn(`Rejected unauthenticated internal request to ${req.url}`, {
        origin: req.headers.origin,
      })
      // Drain the unread request body so keep-alive connection reuse isn't wedged.
      req.resume()
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
      readJsonBody(req, res, logger, ({ workflowId }) => {
        try {
          roomManager.handleWorkflowDeletion(workflowId)
          ok(res)
        } catch (error) {
          logger.error('Error handling workflow deletion notification:', error)
          fail(res, 'Failed to process deletion notification')
        }
      })
      return
    }

    // Handle workflow update notifications from the main API
    if (req.method === 'POST' && req.url === '/api/workflow-updated') {
      readJsonBody(req, res, logger, ({ workflowId }) => {
        try {
          roomManager.handleWorkflowUpdate(workflowId)
          ok(res)
        } catch (error) {
          logger.error('Error handling workflow update notification:', error)
          fail(res, 'Failed to process update notification')
        }
      })
      return
    }

    // Handle copilot workflow edit notifications from the main API
    if (req.method === 'POST' && req.url === '/api/copilot-workflow-edit') {
      readJsonBody(req, res, logger, ({ workflowId, description }) => {
        try {
          roomManager.handleCopilotWorkflowEdit(workflowId, description)
          ok(res)
        } catch (error) {
          logger.error('Error handling copilot workflow edit notification:', error)
          fail(res, 'Failed to process copilot edit notification')
        }
      })
      return
    }

    // Handle workflow revert notifications from the main API
    if (req.method === 'POST' && req.url === '/api/workflow-reverted') {
      readJsonBody(req, res, logger, ({ workflowId, timestamp }) => {
        try {
          roomManager.handleWorkflowRevert(workflowId, timestamp)
          ok(res)
        } catch (error) {
          logger.error('Error handling workflow revert notification:', error)
          fail(res, 'Failed to process revert notification')
        }
      })
      return
    }

    // ============================================================
    // Execution event endpoints — real-time log streaming
    // ============================================================

    // Notify clients that a workflow execution has started
    if (req.method === 'POST' && req.url === '/api/execution-started') {
      readJsonBody(req, res, logger, (data) => {
        try {
          const { workflowId, workspaceId } = data
          if (io) {
            io.to(workflowId).emit('execution:started', data)
            if (workspaceId) io.to(`workspace:${workspaceId}`).emit('execution:started', data)
          }
          ok(res)
        } catch (error) {
          logger.error('Error handling execution-started notification:', error)
          fail(res, 'Failed to process execution-started notification')
        }
      })
      return
    }

    // Notify clients that a single block has completed
    if (req.method === 'POST' && req.url === '/api/execution-block-complete') {
      readJsonBody(req, res, logger, (data) => {
        try {
          const { workflowId, workspaceId } = data
          if (io) {
            io.to(workflowId).emit('execution:block-complete', data)
            if (workspaceId) io.to(`workspace:${workspaceId}`).emit('execution:block-complete', data)
          }
          ok(res)
        } catch (error) {
          logger.error('Error handling execution-block-complete notification:', error)
          fail(res, 'Failed to process execution-block-complete notification')
        }
      })
      return
    }

    // Notify clients that a workflow execution has completed
    if (req.method === 'POST' && req.url === '/api/execution-complete') {
      readJsonBody(req, res, logger, (data) => {
        try {
          const { workflowId, workspaceId } = data
          if (io) {
            io.to(workflowId).emit('execution:complete', data)
            if (workspaceId) io.to(`workspace:${workspaceId}`).emit('execution:complete', data)
          }
          ok(res)
        } catch (error) {
          logger.error('Error handling execution-complete notification:', error)
          fail(res, 'Failed to process execution-complete notification')
        }
      })
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
}
