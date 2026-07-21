/**
 * Unit tests for RoomManager cross-pod bridge broadcasts.
 *
 * Regression coverage for the multi-pod bug: the lifecycle handlers used to short-circuit with
 * `if (!room) return` against the in-memory Map BEFORE calling io.to().emit(). On a multi-pod
 * deploy the room's members live on ANOTHER pod (not in this pod's Map), so the broadcast was
 * silently dropped. With the Redis adapter attached, io.to() fans out cross-pod, so the emit must
 * happen unconditionally — these tests assert exactly that with an EMPTY local room map.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoomManager } from '@/socket-server/rooms/manager'

/**
 * Minimal Socket.IO server stub. Records every `io.to(room).emit(event, payload)` call so tests can
 * assert broadcasts happen even when RoomManager has no local room entry for the target workflow.
 */
function createIoStub() {
  const emit = vi.fn()
  const to = vi.fn(() => ({ emit }))
  const io = {
    to,
    // Never used in the no-local-room path, but present for completeness.
    sockets: { sockets: new Map() },
    in: vi.fn(() => ({ fetchSockets: vi.fn().mockResolvedValue([]) })),
  }
  return { io: io as any, to, emit }
}

describe('RoomManager cross-pod bridge broadcasts', () => {
  let io: any
  let to: ReturnType<typeof vi.fn>
  let emit: ReturnType<typeof vi.fn>
  let manager: RoomManager

  beforeEach(() => {
    const stub = createIoStub()
    io = stub.io
    to = stub.to
    emit = stub.emit
    manager = new RoomManager(io)
  })

  it('handleWorkflowDeletion emits even with no local room (room on another pod)', () => {
    const workflowId = 'wf-on-other-pod'
    expect(manager.hasWorkflowRoom(workflowId)).toBe(false)

    manager.handleWorkflowDeletion(workflowId)

    expect(to).toHaveBeenCalledWith(workflowId)
    expect(emit).toHaveBeenCalledWith('workflow-deleted', expect.objectContaining({ workflowId }))
  })

  it('handleWorkflowUpdate emits even with no local room', () => {
    const workflowId = 'wf-update-other-pod'
    expect(manager.hasWorkflowRoom(workflowId)).toBe(false)

    manager.handleWorkflowUpdate(workflowId)

    expect(to).toHaveBeenCalledWith(workflowId)
    expect(emit).toHaveBeenCalledWith('workflow-updated', expect.objectContaining({ workflowId }))
  })

  it('handleWorkflowRevert emits even with no local room', () => {
    const workflowId = 'wf-revert-other-pod'
    const timestamp = 1234567890
    expect(manager.hasWorkflowRoom(workflowId)).toBe(false)

    manager.handleWorkflowRevert(workflowId, timestamp)

    expect(to).toHaveBeenCalledWith(workflowId)
    expect(emit).toHaveBeenCalledWith(
      'workflow-reverted',
      expect.objectContaining({ workflowId, timestamp })
    )
  })

  it('handleCopilotWorkflowEdit emits even with no local room', () => {
    const workflowId = 'wf-copilot-other-pod'
    expect(manager.hasWorkflowRoom(workflowId)).toBe(false)

    manager.handleCopilotWorkflowEdit(workflowId, 'edited by copilot')

    expect(to).toHaveBeenCalledWith(workflowId)
    expect(emit).toHaveBeenCalledWith(
      'copilot-workflow-edit',
      expect.objectContaining({ workflowId, description: 'edited by copilot' })
    )
  })

  it('handleWorkflowDeletion still cleans up + emits when a local room exists (single-pod path)', () => {
    const workflowId = 'wf-local'
    const socketId = 'sock-1'
    const room = manager.createWorkflowRoom(workflowId)
    room.users.set(socketId, {
      userId: 'u1',
      workflowId,
      userName: 'User One',
      socketId,
      joinedAt: Date.now(),
      lastActivity: Date.now(),
    })
    room.activeConnections = 1
    manager.setWorkflowRoom(workflowId, room)
    manager.setWorkflowForSocket(socketId, workflowId)

    manager.handleWorkflowDeletion(workflowId)

    // Emit still fires...
    expect(emit).toHaveBeenCalledWith('workflow-deleted', expect.objectContaining({ workflowId }))
    // ...and the local room is torn down (unchanged single-pod behavior).
    expect(manager.hasWorkflowRoom(workflowId)).toBe(false)
    expect(manager.getWorkflowIdForSocket(socketId)).toBeUndefined()
  })

  it('handleWorkflowUpdate updates lastModified when a local room exists', () => {
    const workflowId = 'wf-local-update'
    const room = manager.createWorkflowRoom(workflowId)
    room.lastModified = 0
    manager.setWorkflowRoom(workflowId, room)

    manager.handleWorkflowUpdate(workflowId)

    expect(manager.getWorkflowRoom(workflowId)?.lastModified).toBeGreaterThan(0)
    expect(emit).toHaveBeenCalledWith('workflow-updated', expect.objectContaining({ workflowId }))
  })
})
