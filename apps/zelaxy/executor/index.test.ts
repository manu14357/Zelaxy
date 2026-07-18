/**
 * @vitest-environment node
 *
 * Executor facade contract tests. The Executor validates its input and delegates every run to the
 * DAGExecutor; the DAG execution behaviour itself is covered by executor/execution/*.test.ts.
 */
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/tools', () => ({ executeTool: vi.fn() }))

import { Executor } from '@/executor'
import {
  createMinimalWorkflow,
  createWorkflowWithCondition,
  createWorkflowWithLoop,
} from '@/executor/__test-utils__/executor-mocks'
import { BlockType } from '@/executor/consts'
import type { ExecutionResult } from '@/executor/types'
import { executeTool } from '@/tools'

const mockExecuteTool = executeTool as Mock

describe('Executor facade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteTool.mockResolvedValue({ success: true, output: { result: 'ok', stdout: '' } })
  })
  afterEach(() => vi.resetAllMocks())

  describe('construction', () => {
    it('accepts the legacy positional constructor', () => {
      const executor = new Executor(createMinimalWorkflow())
      expect(executor).toBeInstanceOf(Executor)
    })

    it('accepts the options-object constructor', () => {
      const executor = new Executor({
        workflow: createMinimalWorkflow(),
        currentBlockStates: { block1: { result: 'x' } as any },
        envVarValues: { API_KEY: 'k' },
        workflowInput: { query: 'q' },
        workflowVariables: { v: 1 },
      })
      expect(executor).toBeInstanceOf(Executor)
    })

    it('exposes the run/callback surface used by callers', () => {
      const executor = new Executor(createMinimalWorkflow())
      expect(typeof executor.execute).toBe('function')
      expect(typeof executor.cancel).toBe('function')
      expect(typeof executor.continueExecution).toBe('function')
      expect(typeof executor.resumeFromPause).toBe('function')
      expect(typeof executor.setOnBlockComplete).toBe('function')
      expect(typeof executor.setOnExecutionStart).toBe('function')
      expect(typeof executor.setOnExecutionComplete).toBe('function')
    })
  })

  describe('validation on construction', () => {
    it('throws without a starter block', () => {
      const workflow = createMinimalWorkflow()
      workflow.blocks = workflow.blocks.filter((b) => b.metadata?.id !== BlockType.STARTER)
      expect(() => new Executor(workflow)).toThrow('Workflow must have an enabled starter block')
    })

    it('throws for a disabled starter block', () => {
      const workflow = createMinimalWorkflow()
      workflow.blocks.find((b) => b.metadata?.id === BlockType.STARTER)!.enabled = false
      expect(() => new Executor(workflow)).toThrow('Workflow must have an enabled starter block')
    })

    it('throws when the starter has incoming connections', () => {
      const workflow = createMinimalWorkflow()
      workflow.connections.push({ source: 'block1', target: 'starter' })
      expect(() => new Executor(workflow)).toThrow('Starter block cannot have incoming connections')
    })

    it('throws when the starter has no outgoing connections and no triggers', () => {
      const workflow = createMinimalWorkflow()
      workflow.connections = []
      expect(() => new Executor(workflow)).toThrow(
        'Starter block must have at least one outgoing connection'
      )
    })

    it('does not throw when a trigger block is present with no starter outgoing', () => {
      const workflow = createMinimalWorkflow()
      workflow.connections = []
      workflow.blocks.push({
        id: 'webhook-trigger',
        position: { x: 0, y: 0 },
        metadata: { category: 'triggers', id: 'webhook' },
        config: { tool: 'webhook', params: {} },
        inputs: {},
        outputs: {},
        enabled: true,
      })
      expect(() => new Executor(workflow)).not.toThrow()
    })

    it('throws for a connection to a non-existent block', () => {
      const workflow = createMinimalWorkflow()
      workflow.connections.push({ source: 'starter', target: 'nope' })
      expect(() => new Executor(workflow)).toThrow(
        'Connection references non-existent target block: nope'
      )
    })
  })

  describe('execution', () => {
    it('runs a minimal workflow and returns an ExecutionResult', async () => {
      const result = (await new Executor(createMinimalWorkflow()).execute('wf')) as ExecutionResult
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('output')
      expect(result).toHaveProperty('logs')
    })

    it('runs a condition workflow without error', async () => {
      const result = (await new Executor(createWorkflowWithCondition()).execute(
        'wf'
      )) as ExecutionResult
      expect(typeof result.success).toBe('boolean')
    })

    it('runs a loop workflow without error', async () => {
      const result = (await new Executor(createWorkflowWithLoop()).execute('wf')) as ExecutionResult
      expect(typeof result.success).toBe('boolean')
    })

    it('invokes onExecutionStart and onExecutionComplete', async () => {
      const onStart = vi.fn()
      const onComplete = vi.fn()
      const executor = new Executor(createMinimalWorkflow())
      executor.setOnExecutionStart(onStart)
      executor.setOnExecutionComplete(onComplete)
      await executor.execute('wf')
      expect(onStart).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('cancellation', () => {
    it('returns a cancelled result when cancelled before execution', async () => {
      const executor = new Executor(createMinimalWorkflow())
      executor.cancel()
      const result = (await executor.execute('wf')) as ExecutionResult
      expect(result.success).toBe(false)
    })
  })

  describe('debug single-step', () => {
    it('reports that continueExecution is unsupported on the DAG executor', async () => {
      const executor = new Executor(createMinimalWorkflow())
      const result = await executor.continueExecution(['block1'], { blockLogs: [] } as any)
      expect(result.success).toBe(false)
    })
  })
})
