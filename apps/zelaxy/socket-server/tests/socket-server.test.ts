import { createServer } from 'http'
import { Server } from 'socket.io'
import { io, type Socket } from 'socket.io-client'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  BatchAddBlocksSchema,
  BatchRemoveBlocksSchema,
  BatchRemoveEdgesSchema,
  BatchUpdatePositionsSchema,
  WorkflowOperationSchema,
} from '@/socket-server/validation/schemas'

describe('Socket Server Integration Tests', () => {
  let httpServer: any
  let socketServer: Server
  let clientSocket: Socket
  let serverPort: number

  beforeAll(async () => {
    // Create a test server instance
    httpServer = createServer()
    socketServer = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        serverPort = httpServer.address()?.port
        resolve()
      })
    })

    // Basic socket handlers for testing
    socketServer.on('connection', (socket) => {
      socket.on('join-workflow', ({ workflowId }) => {
        socket.join(workflowId)
        socket.emit('joined-workflow', { workflowId })
      })

      socket.on('workflow-operation', (data) => {
        socket.to(data.workflowId || 'test-workflow').emit('workflow-operation', {
          ...data,
          senderId: socket.id,
        })
      })
    })
  })

  afterAll(async () => {
    if (socketServer) {
      socketServer.close()
    }
    if (httpServer) {
      httpServer.close()
    }
  })

  beforeEach(async () => {
    // Create client socket for each test
    clientSocket = io(`http://localhost:${serverPort}`, {
      transports: ['polling', 'websocket'],
    })

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => {
        resolve()
      })
    })
  })

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close()
    }
  })

  it('should connect to socket server', () => {
    expect(clientSocket.connected).toBe(true)
  })

  it('should join workflow room', async () => {
    const workflowId = 'test-workflow-123'

    const joinedPromise = new Promise<void>((resolve) => {
      clientSocket.on('joined-workflow', (data) => {
        expect(data.workflowId).toBe(workflowId)
        resolve()
      })
    })

    clientSocket.emit('join-workflow', { workflowId })
    await joinedPromise
  })

  it('should broadcast workflow operations', async () => {
    const workflowId = 'test-workflow-456'

    // Create second client
    const client2 = io(`http://localhost:${serverPort}`)
    await new Promise<void>((resolve) => {
      client2.on('connect', resolve)
    })

    // Both clients join the same workflow
    clientSocket.emit('join-workflow', { workflowId })
    client2.emit('join-workflow', { workflowId })

    // Wait for joins to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    const operationPromise = new Promise<void>((resolve) => {
      client2.on('workflow-operation', (data) => {
        expect(data.operation).toBe('add')
        expect(data.target).toBe('block')
        expect(data.payload.id).toBe('block-123')
        resolve()
      })
    })

    // Client 1 sends operation
    clientSocket.emit('workflow-operation', {
      workflowId,
      operation: 'add',
      target: 'block',
      payload: { id: 'block-123', type: 'action', name: 'Test Block' },
      timestamp: Date.now(),
    })

    await operationPromise
    client2.close()
  })

  it('should handle multiple concurrent connections', async () => {
    const numClients = 10
    const clients: Socket[] = []
    const workflowId = 'stress-test-workflow'

    // Create multiple clients
    for (let i = 0; i < numClients; i++) {
      const client = io(`http://localhost:${serverPort}`)
      clients.push(client)

      await new Promise<void>((resolve) => {
        client.on('connect', resolve)
      })

      client.emit('join-workflow', { workflowId })
    }

    // Wait for all joins
    await new Promise((resolve) => setTimeout(resolve, 200))

    let receivedCount = 0
    const expectedCount = numClients - 1 // All except sender

    const operationPromise = new Promise<void>((resolve) => {
      clients.forEach((client, index) => {
        if (index === 0) return // Skip sender

        client.on('workflow-operation', () => {
          receivedCount++
          if (receivedCount === expectedCount) {
            resolve()
          }
        })
      })
    })

    // First client sends operation
    clients[0].emit('workflow-operation', {
      workflowId,
      operation: 'add',
      target: 'block',
      payload: { id: 'stress-block', type: 'action' },
      timestamp: Date.now(),
    })

    await operationPromise
    expect(receivedCount).toBe(expectedCount)

    // Clean up
    clients.forEach((client) => client.close())
  })

  it('should handle rapid operations without loss', async () => {
    const workflowId = 'rapid-test-workflow'
    const numOperations = 50

    const client2 = io(`http://localhost:${serverPort}`)
    await new Promise<void>((resolve) => {
      client2.on('connect', resolve)
    })

    clientSocket.emit('join-workflow', { workflowId })
    client2.emit('join-workflow', { workflowId })

    await new Promise((resolve) => setTimeout(resolve, 100))

    let receivedCount = 0
    const receivedOperations = new Set<string>()

    const operationsPromise = new Promise<void>((resolve) => {
      client2.on('workflow-operation', (data) => {
        receivedCount++
        receivedOperations.add(data.payload.id)

        if (receivedCount === numOperations) {
          resolve()
        }
      })
    })

    // Send rapid operations
    for (let i = 0; i < numOperations; i++) {
      clientSocket.emit('workflow-operation', {
        workflowId,
        operation: 'add',
        target: 'block',
        payload: { id: `rapid-block-${i}`, type: 'action' },
        timestamp: Date.now(),
      })
    }

    await operationsPromise
    expect(receivedCount).toBe(numOperations)
    expect(receivedOperations.size).toBe(numOperations)

    client2.close()
  })

  it('should broadcast a batch position update as a single operation', async () => {
    const workflowId = 'batch-positions-workflow'

    const client2 = io(`http://localhost:${serverPort}`)
    await new Promise<void>((resolve) => {
      client2.on('connect', resolve)
    })

    clientSocket.emit('join-workflow', { workflowId })
    client2.emit('join-workflow', { workflowId })
    await new Promise((resolve) => setTimeout(resolve, 100))

    const received: any[] = []
    const operationPromise = new Promise<void>((resolve) => {
      client2.on('workflow-operation', (data) => {
        received.push(data)
        resolve()
      })
    })

    // Dragging three selected blocks emits ONE op, not three.
    clientSocket.emit('workflow-operation', {
      workflowId,
      operation: 'batch-update-positions',
      target: 'blocks',
      payload: {
        updates: [
          { id: 'b1', position: { x: 10, y: 20 } },
          { id: 'b2', position: { x: 30, y: 40 } },
          { id: 'b3', position: { x: 50, y: 60 } },
        ],
      },
      timestamp: Date.now(),
    })

    await operationPromise
    expect(received).toHaveLength(1)
    expect(received[0].operation).toBe('batch-update-positions')
    expect(received[0].target).toBe('blocks')
    expect(received[0].payload.updates).toHaveLength(3)
    client2.close()
  })

  it('should broadcast batch remove operations for blocks and edges', async () => {
    const workflowId = 'batch-remove-workflow'

    const client2 = io(`http://localhost:${serverPort}`)
    await new Promise<void>((resolve) => {
      client2.on('connect', resolve)
    })

    clientSocket.emit('join-workflow', { workflowId })
    client2.emit('join-workflow', { workflowId })
    await new Promise((resolve) => setTimeout(resolve, 100))

    const byTarget = new Map<string, any>()
    const bothReceived = new Promise<void>((resolve) => {
      client2.on('workflow-operation', (data) => {
        byTarget.set(data.target, data)
        if (byTarget.has('blocks') && byTarget.has('edges')) resolve()
      })
    })

    clientSocket.emit('workflow-operation', {
      workflowId,
      operation: 'batch-remove-blocks',
      target: 'blocks',
      payload: { ids: ['b1', 'b2'] },
      timestamp: Date.now(),
    })
    clientSocket.emit('workflow-operation', {
      workflowId,
      operation: 'batch-remove-edges',
      target: 'edges',
      payload: { ids: ['e1', 'e2', 'e3'] },
      timestamp: Date.now(),
    })

    await bothReceived
    expect(byTarget.get('blocks').payload.ids).toEqual(['b1', 'b2'])
    expect(byTarget.get('edges').payload.ids).toEqual(['e1', 'e2', 'e3'])
    client2.close()
  })
})

describe('Batch operation validation schemas', () => {
  const ts = 1_700_000_000_000

  it('validates a batch-update-positions op', () => {
    const op = {
      operation: 'batch-update-positions',
      target: 'blocks',
      payload: { updates: [{ id: 'b1', position: { x: 1, y: 2 } }] },
      timestamp: ts,
      operationId: 'op-1',
    }
    expect(BatchUpdatePositionsSchema.safeParse(op).success).toBe(true)
    expect(WorkflowOperationSchema.safeParse(op).success).toBe(true)
  })

  it('rejects a batch-update-positions op with a malformed position', () => {
    const op = {
      operation: 'batch-update-positions',
      target: 'blocks',
      payload: { updates: [{ id: 'b1', position: { x: 'nope', y: 2 } }] },
      timestamp: ts,
    }
    expect(BatchUpdatePositionsSchema.safeParse(op).success).toBe(false)
  })

  it('validates a batch-add-blocks op with optional edges/loops/parallels', () => {
    const op = {
      operation: 'batch-add-blocks',
      target: 'blocks',
      payload: {
        blocks: [{ id: 'b1', type: 'function', name: 'Fn', position: { x: 0, y: 0 } }],
        edges: [{ id: 'e1', source: 'b0', target: 'b1' }],
        loops: {},
        parallels: {},
        subBlockValues: { b1: { code: 'return 1' } },
      },
      timestamp: ts,
    }
    expect(BatchAddBlocksSchema.safeParse(op).success).toBe(true)
    expect(WorkflowOperationSchema.safeParse(op).success).toBe(true)
  })

  it('validates batch-remove-blocks and batch-remove-edges ops', () => {
    const removeBlocks = {
      operation: 'batch-remove-blocks',
      target: 'blocks',
      payload: { ids: ['b1', 'b2'] },
      timestamp: ts,
    }
    const removeEdges = {
      operation: 'batch-remove-edges',
      target: 'edges',
      payload: { ids: ['e1'] },
      timestamp: ts,
    }
    expect(BatchRemoveBlocksSchema.safeParse(removeBlocks).success).toBe(true)
    expect(BatchRemoveEdgesSchema.safeParse(removeEdges).success).toBe(true)
    expect(WorkflowOperationSchema.safeParse(removeBlocks).success).toBe(true)
    expect(WorkflowOperationSchema.safeParse(removeEdges).success).toBe(true)
  })

  it('rejects a batch op whose target does not match its operation', () => {
    const op = {
      operation: 'batch-remove-edges',
      target: 'blocks',
      payload: { ids: ['e1'] },
      timestamp: ts,
    }
    expect(WorkflowOperationSchema.safeParse(op).success).toBe(false)
  })
})
