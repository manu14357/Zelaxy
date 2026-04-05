import '@/executor/__test-utils__/mock-dependencies'

import { beforeEach, describe, expect, it, type Mocked, type MockedClass, vi } from 'vitest'
import { BlockType } from '@/executor/consts'
import { SwitchBlockHandler } from '@/executor/handlers/switch/switch-handler'
import { PathTracker } from '@/executor/path/path'
import { InputResolver } from '@/executor/resolver/resolver'
import type { BlockState, ExecutionContext } from '@/executor/types'
import type { SerializedBlock, SerializedWorkflow } from '@/serializer/types'

const MockPathTracker = PathTracker as MockedClass<typeof PathTracker>
const MockInputResolver = InputResolver as MockedClass<typeof InputResolver>

describe('SwitchBlockHandler', () => {
  let handler: SwitchBlockHandler
  let mockBlock: SerializedBlock
  let mockContext: ExecutionContext
  let mockPathTracker: Mocked<PathTracker>
  let mockResolver: Mocked<InputResolver>
  let mockWorkflow: Partial<SerializedWorkflow>
  let mockTargetA: SerializedBlock
  let mockTargetB: SerializedBlock
  let mockTargetDefault: SerializedBlock

  const makeCases = (cases: Array<{ id: string; title: string; value: string }>) =>
    JSON.stringify(cases)

  beforeEach(() => {
    mockBlock = {
      id: 'switch-block-1',
      metadata: { id: BlockType.SWITCH, name: 'Test Switch' },
      position: { x: 50, y: 50 },
      config: { tool: BlockType.SWITCH, params: {} },
      inputs: { value: 'string', cases: 'string' },
      outputs: {},
      enabled: true,
    }
    mockTargetA = {
      id: 'target-a',
      metadata: { id: 'agent', name: 'Target A' },
      position: { x: 200, y: 50 },
      config: { tool: 'agent', params: {} },
      inputs: {},
      outputs: {},
      enabled: true,
    }
    mockTargetB = {
      id: 'target-b',
      metadata: { id: 'agent', name: 'Target B' },
      position: { x: 200, y: 150 },
      config: { tool: 'agent', params: {} },
      inputs: {},
      outputs: {},
      enabled: true,
    }
    mockTargetDefault = {
      id: 'target-default',
      metadata: { id: 'agent', name: 'Target Default' },
      position: { x: 200, y: 250 },
      config: { tool: 'agent', params: {} },
      inputs: {},
      outputs: {},
      enabled: true,
    }

    mockWorkflow = {
      blocks: [mockBlock, mockTargetA, mockTargetB, mockTargetDefault],
      connections: [
        { source: mockBlock.id, target: mockTargetA.id, sourceHandle: 'case-case1' },
        { source: mockBlock.id, target: mockTargetB.id, sourceHandle: 'case-case2' },
        {
          source: mockBlock.id,
          target: mockTargetDefault.id,
          sourceHandle: 'case-default',
        },
      ],
    }

    mockPathTracker = new MockPathTracker(mockWorkflow as SerializedWorkflow) as Mocked<PathTracker>

    mockResolver = new MockInputResolver(
      mockWorkflow as SerializedWorkflow,
      {}
    ) as Mocked<InputResolver>

    // Ensure the resolver methods exist as mock functions that return the input unchanged by default
    mockResolver.resolveVariableReferences = vi.fn((val: string) => val)
    mockResolver.resolveBlockReferences = vi.fn((val: string, _ctx: any, _block: any) => val)
    mockResolver.resolveEnvVariables = vi.fn((val: string) => val)

    handler = new SwitchBlockHandler(mockPathTracker, mockResolver)

    mockContext = {
      workflowId: 'test-workflow',
      blockStates: new Map<string, BlockState>(),
      blockLogs: [],
      metadata: { duration: 0 },
      environmentVariables: {},
      decisions: { router: new Map(), condition: new Map() },
      loopIterations: new Map(),
      loopItems: new Map(),
      executedBlocks: new Set(),
      activeExecutionPath: new Set(),
      workflow: mockWorkflow as SerializedWorkflow,
      completedLoops: new Set(),
    }

    vi.clearAllMocks()
  })

  describe('canHandle', () => {
    it('should handle switch blocks', () => {
      expect(handler.canHandle(mockBlock)).toBe(true)
    })

    it('should not handle non-switch blocks', () => {
      const otherBlock: SerializedBlock = {
        ...mockBlock,
        metadata: { id: 'condition' },
      }
      expect(handler.canHandle(otherBlock)).toBe(false)
    })
  })

  describe('execute', () => {
    it('should match exact value to case and route correctly', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'approve' },
        { id: 'case2', title: 'Case 2', value: 'reject' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 'approve', cases }, mockContext)

      expect(result).toMatchObject({
        matchedValue: 'approve',
        selectedCaseId: 'case1',
        inputValue: 'approve',
        matchMode: 'exact',
        selectedPath: {
          blockId: 'target-a',
          blockType: 'agent',
          blockTitle: 'Target A',
        },
        selectedConditionId: 'case1',
      })
      expect(mockContext.decisions.condition.get(mockBlock.id)).toBe('case1')
    })

    it('should match second case', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'approve' },
        { id: 'case2', title: 'Case 2', value: 'reject' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 'reject', cases }, mockContext)

      expect(result).toMatchObject({
        matchedValue: 'reject',
        selectedCaseId: 'case2',
        selectedPath: { blockId: 'target-b' },
      })
      expect(mockContext.decisions.condition.get(mockBlock.id)).toBe('case2')
    })

    it('should fall back to default when no case matches', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'approve' },
        { id: 'case2', title: 'Case 2', value: 'reject' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'unknown-value', cases },
        mockContext
      )

      expect(result).toMatchObject({
        matchedValue: '',
        selectedCaseId: 'default',
        inputValue: 'unknown-value',
        selectedPath: { blockId: 'target-default' },
        selectedConditionId: 'default',
      })
      expect(mockContext.decisions.condition.get(mockBlock.id)).toBe('default')
    })

    it('should trim whitespace for matching', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '  approve  ' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: '  approve  ', cases }, mockContext)

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('should handle array input for cases', async () => {
      const casesArray = [
        { id: 'case1', title: 'Case 1', value: 'yes' },
        { id: 'default', title: 'default', value: '' },
      ]

      const result = await handler.execute(
        mockBlock,
        { value: 'yes', cases: casesArray },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
        matchedValue: 'yes',
      })
    })

    it('should throw on invalid cases JSON', async () => {
      await expect(
        handler.execute(mockBlock, { value: 'test', cases: 'not-json' }, mockContext)
      ).rejects.toThrow('Invalid switch cases configuration')
    })

    it('should throw when cases array is empty', async () => {
      await expect(
        handler.execute(mockBlock, { value: 'test', cases: '[]' }, mockContext)
      ).rejects.toThrow('Switch block requires at least one case')
    })

    it('should throw when no case matches and default has no connection', async () => {
      // Remove default connection
      mockWorkflow.connections = [
        { source: mockBlock.id, target: mockTargetA.id, sourceHandle: 'case-case1' },
      ]

      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'approve' },
        { id: 'default', title: 'default', value: '' },
      ])

      await expect(
        handler.execute(mockBlock, { value: 'nomatch', cases }, mockContext)
      ).rejects.toThrow(/no connection found/)
    })

    it('should convert non-string value input to string', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '42' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 42, cases }, mockContext)

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
        matchedValue: '42',
        inputValue: '42',
      })
    })

    it('should handle null/undefined value gracefully', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'something' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: null, cases }, mockContext)

      // null → '' → no match → default
      expect(result).toMatchObject({
        selectedCaseId: 'default',
      })
    })

    it('should match case-sensitively', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'Approve' },
        { id: 'default', title: 'default', value: '' },
      ])

      // 'approve' !== 'Approve' (case-sensitive), so should fall to default
      const result = await handler.execute(mockBlock, { value: 'approve', cases }, mockContext)

      expect(result).toMatchObject({
        selectedCaseId: 'default',
      })
    })

    it('should include matchMode in output', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'hello' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'hello', cases, matchMode: 'exact' },
        mockContext
      )

      expect(result).toMatchObject({
        matchMode: 'exact',
      })
    })

    it('should default matchMode to exact when not provided', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'hello' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 'hello', cases }, mockContext)

      expect(result).toMatchObject({
        matchMode: 'exact',
      })
    })
  })

  describe('match modes', () => {
    it('contains: should match substring (case-insensitive)', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'world' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'Hello World', cases, matchMode: 'contains' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('contains: should fall to default when substring not found', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'xyz' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'Hello World', cases, matchMode: 'contains' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'default',
      })
    })

    it('startsWith: should match prefix (case-insensitive)', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'order' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'Order-12345', cases, matchMode: 'startsWith' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('endsWith: should match suffix (case-insensitive)', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '.pdf' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'document.PDF', cases, matchMode: 'endsWith' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('regex: should match pattern (case-insensitive)', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '^[a-z]+-\\d+$' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'abc-123', cases, matchMode: 'regex' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('regex: should fall to default on invalid regex', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '[invalid(' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'anything', cases, matchMode: 'regex' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'default',
      })
    })

    it('numeric: should match with > operator', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '> 50' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: '75', cases, matchMode: 'numeric' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('numeric: should not match when condition is false', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '> 100' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: '75', cases, matchMode: 'numeric' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'default',
      })
    })

    it('numeric: should match with >= operator', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '>= 90' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: '90', cases, matchMode: 'numeric' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('numeric: should match with != operator', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '!= 0' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: '5', cases, matchMode: 'numeric' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('numeric: should match exact number without operator', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '42' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: '42', cases, matchMode: 'numeric' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
    })

    it('numeric: should fall to default for non-numeric input', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '> 50' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(
        mockBlock,
        { value: 'not-a-number', cases, matchMode: 'numeric' },
        mockContext
      )

      expect(result).toMatchObject({
        selectedCaseId: 'default',
      })
    })
  })

  describe('variable resolution', () => {
    it('should resolve {{}} references in case values', async () => {
      mockResolver.resolveVariableReferences = vi.fn((val: string) =>
        val.replace('{{starter.category}}', 'approve')
      )

      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: '{{starter.category}}' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 'approve', cases }, mockContext)

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
      })
      expect(mockResolver.resolveVariableReferences).toHaveBeenCalledWith(
        '{{starter.category}}',
        mockBlock
      )
    })

    it('should not resolve references for default case', async () => {
      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'no-match' },
        { id: 'default', title: 'default', value: '' },
      ])

      await handler.execute(mockBlock, { value: 'anything', cases }, mockContext)

      // Default case has empty value, should not trigger resolution
      expect(mockResolver.resolveVariableReferences).not.toHaveBeenCalled()
    })
  })

  describe('connection fallback', () => {
    it('should fall through to default when matched case has no connection', async () => {
      // case2 matches but has no connection — only case1 and default are connected
      mockWorkflow.connections = [
        { source: mockBlock.id, target: mockTargetA.id, sourceHandle: 'case-case1' },
        { source: mockBlock.id, target: mockTargetDefault.id, sourceHandle: 'case-default' },
      ]

      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'approve' },
        { id: 'case2', title: 'Case 2', value: 'reject' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 'reject', cases }, mockContext)

      // Should fall through to default since case2's connection is missing
      expect(result).toMatchObject({
        selectedCaseId: 'default',
        selectedPath: { blockId: 'target-default' },
      })
    })

    it('should use legacy "source" handle connection as fallback', async () => {
      // Edge was auto-connected with sourceHandle='source' (before the fix)
      mockWorkflow.connections = [
        { source: mockBlock.id, target: mockTargetA.id, sourceHandle: 'source' },
      ]

      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'approve' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 'approve', cases }, mockContext)

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
        selectedPath: { blockId: 'target-a' },
      })
    })

    it('should use connection without sourceHandle as fallback', async () => {
      // Edge has no sourceHandle (undefined)
      mockWorkflow.connections = [{ source: mockBlock.id, target: mockTargetA.id }]

      const cases = makeCases([
        { id: 'case1', title: 'Case 1', value: 'test' },
        { id: 'default', title: 'default', value: '' },
      ])

      const result = await handler.execute(mockBlock, { value: 'test', cases }, mockContext)

      expect(result).toMatchObject({
        selectedCaseId: 'case1',
        selectedPath: { blockId: 'target-a' },
      })
    })
  })
})
