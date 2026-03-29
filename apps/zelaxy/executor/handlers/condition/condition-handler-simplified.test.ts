import '@/executor/__test-utils__/mock-dependencies'

import { beforeEach, describe, expect, it, type Mocked, type MockedClass, vi } from 'vitest'
import { BlockType } from '@/executor/consts'
import { ConditionBlockHandler } from '@/executor/handlers/condition/condition-handler'
import { PathTracker } from '@/executor/path/path'
import { InputResolver } from '@/executor/resolver/resolver'
import type { BlockState, ExecutionContext } from '@/executor/types'
import type { SerializedBlock, SerializedWorkflow } from '@/serializer/types'

const MockPathTracker = PathTracker as MockedClass<typeof PathTracker>
const MockInputResolver = InputResolver as MockedClass<typeof InputResolver>

describe('ConditionBlockHandler - Simplified', () => {
  let handler: ConditionBlockHandler
  let mockBlock: SerializedBlock
  let mockContext: ExecutionContext
  let mockPathTracker: Mocked<PathTracker>
  let mockResolver: Mocked<InputResolver>
  let mockWorkflow: Partial<SerializedWorkflow>
  let mockSourceBlock: SerializedBlock
  let mockTrueTargetBlock: SerializedBlock
  let mockFalseTargetBlock: SerializedBlock

  beforeEach(() => {
    // Define blocks first
    mockSourceBlock = {
      id: 'source-block-1',
      metadata: { id: 'source', name: 'Source Block' },
      position: { x: 10, y: 10 },
      config: { tool: 'source_tool', params: {} },
      inputs: {},
      outputs: {},
      enabled: true,
    }
    mockBlock = {
      id: 'cond-block-1',
      metadata: { id: BlockType.CONDITION, name: 'Test Condition' },
      position: { x: 50, y: 50 },
      config: { tool: BlockType.CONDITION, params: {} },
      inputs: { conditions: 'string' },
      outputs: {},
      enabled: true,
    }
    mockTrueTargetBlock = {
      id: 'true-target-block',
      metadata: { id: 'target', name: 'True Target Block' },
      position: { x: 100, y: 100 },
      config: { tool: 'target_tool_true', params: {} },
      inputs: {},
      outputs: {},
      enabled: true,
    }
    mockFalseTargetBlock = {
      id: 'false-target-block',
      metadata: { id: 'target', name: 'False Target Block' },
      position: { x: 100, y: 150 },
      config: { tool: 'target_tool_false', params: {} },
      inputs: {},
      outputs: {},
      enabled: true,
    }

    // Define workflow with true/false connections
    mockWorkflow = {
      blocks: [mockSourceBlock, mockBlock, mockTrueTargetBlock, mockFalseTargetBlock],
      connections: [
        { source: mockSourceBlock.id, target: mockBlock.id },
        { source: mockBlock.id, target: mockTrueTargetBlock.id, sourceHandle: 'true' },
        { source: mockBlock.id, target: mockFalseTargetBlock.id, sourceHandle: 'false' },
      ],
    }

    mockPathTracker = new MockPathTracker(mockWorkflow as SerializedWorkflow) as Mocked<PathTracker>
    mockResolver = new MockInputResolver(
      mockWorkflow as SerializedWorkflow,
      {}
    ) as Mocked<InputResolver>

    // Ensure the methods exist as mock functions on the instance
    mockResolver.resolveBlockReferences = vi.fn()
    mockResolver.resolveVariableReferences = vi.fn()
    mockResolver.resolveEnvVariables = vi.fn()

    handler = new ConditionBlockHandler(mockPathTracker, mockResolver)

    // Define mock context
    mockContext = {
      workflowId: 'test-workflow-id',
      blockStates: new Map<string, BlockState>([
        [
          mockSourceBlock.id,
          {
            output: { value: 10, text: 'hello' },
            executed: true,
            executionTime: 100,
          },
        ],
      ]),
      blockLogs: [],
      metadata: { duration: 0 },
      environmentVariables: {},
      decisions: { router: new Map(), condition: new Map() },
      loopIterations: new Map(),
      loopItems: new Map(),
      executedBlocks: new Set([mockSourceBlock.id]),
      activeExecutionPath: new Set(),
      workflow: mockWorkflow as SerializedWorkflow,
      completedLoops: new Set(),
    }

    // Reset mocks
    vi.clearAllMocks()
  })

  it('should handle condition blocks', () => {
    expect(handler.canHandle(mockBlock)).toBe(true)
    const nonCondBlock: SerializedBlock = { ...mockBlock, metadata: { id: 'other' } }
    expect(handler.canHandle(nonCondBlock)).toBe(false)
  })

  it('should execute condition and select true path when condition is true', async () => {
    const conditionValue = 'context.value > 5'
    const inputs = { conditions: conditionValue }

    const expectedOutput = {
      value: 10,
      text: 'hello',
      content: 'Evaluated: context.value > 5 = true',
      conditionResult: true,
      selectedPath: {
        blockId: mockTrueTargetBlock.id,
        blockType: 'target',
        blockTitle: 'True Target Block',
      },
      selectedConditionId: 'true',
    }

    // Mock the resolution pipeline
    mockResolver.resolveVariableReferences.mockReturnValue('context.value > 5')
    mockResolver.resolveBlockReferences.mockReturnValue('context.value > 5')
    mockResolver.resolveEnvVariables.mockReturnValue('context.value > 5')

    const result = await handler.execute(mockBlock, inputs, mockContext)

    expect(result).toEqual(expectedOutput)
    expect(mockContext.decisions.condition.get(mockBlock.id)).toBe('true')
  })

  it('should execute condition and select false path when condition is false', async () => {
    const conditionValue = 'context.value < 5'
    const inputs = { conditions: conditionValue }

    const expectedOutput = {
      value: 10,
      text: 'hello',
      content: 'Evaluated: context.value < 5 = false',
      conditionResult: false,
      selectedPath: {
        blockId: mockFalseTargetBlock.id,
        blockType: 'target',
        blockTitle: 'False Target Block',
      },
      selectedConditionId: 'false',
    }

    // Mock the resolution pipeline
    mockResolver.resolveVariableReferences.mockReturnValue('context.value < 5')
    mockResolver.resolveBlockReferences.mockReturnValue('context.value < 5')
    mockResolver.resolveEnvVariables.mockReturnValue('context.value < 5')

    const result = await handler.execute(mockBlock, inputs, mockContext)

    expect(result).toEqual(expectedOutput)
    expect(mockContext.decisions.condition.get(mockBlock.id)).toBe('false')
  })

  it('should handle empty condition as false', async () => {
    const conditionValue = ''
    const inputs = { conditions: conditionValue }

    const expectedOutput = {
      value: 10,
      text: 'hello',
      content: 'Empty condition evaluated to false',
      conditionResult: false,
      selectedPath: {
        blockId: mockFalseTargetBlock.id,
        blockType: 'target',
        blockTitle: 'False Target Block',
      },
      selectedConditionId: 'false',
    }

    const result = await handler.execute(mockBlock, inputs, mockContext)

    expect(result).toEqual(expectedOutput)
    expect(mockContext.decisions.condition.get(mockBlock.id)).toBe('false')
  })

  it('should resolve block references in conditions', async () => {
    const conditionValue = '{{source-block-1.value}} > 5'
    const inputs = { conditions: conditionValue }

    // Mock the resolution pipeline
    mockResolver.resolveVariableReferences.mockReturnValue('{{source-block-1.value}} > 5')
    mockResolver.resolveBlockReferences.mockReturnValue('10 > 5')
    mockResolver.resolveEnvVariables.mockReturnValue('10 > 5')

    await handler.execute(mockBlock, inputs, mockContext)

    expect(mockResolver.resolveVariableReferences).toHaveBeenCalledWith(
      '{{source-block-1.value}} > 5',
      mockBlock
    )
    expect(mockResolver.resolveBlockReferences).toHaveBeenCalledWith(
      '{{source-block-1.value}} > 5',
      mockContext,
      mockBlock
    )
    expect(mockResolver.resolveEnvVariables).toHaveBeenCalledWith('10 > 5', true)
  })

  it('should throw error when no true path is connected', async () => {
    const conditionValue = 'context.value > 5'
    const inputs = { conditions: conditionValue }

    // Remove true connection
    mockWorkflow.connections = [
      { source: mockSourceBlock.id, target: mockBlock.id },
      { source: mockBlock.id, target: mockFalseTargetBlock.id, sourceHandle: 'false' },
    ]

    // Mock the resolution pipeline
    mockResolver.resolveVariableReferences.mockReturnValue('context.value > 5')
    mockResolver.resolveBlockReferences.mockReturnValue('context.value > 5')
    mockResolver.resolveEnvVariables.mockReturnValue('context.value > 5')

    await expect(handler.execute(mockBlock, inputs, mockContext)).rejects.toThrow(
      'No true path connected for condition block "Test Condition". Condition evaluated to true.'
    )
  })

  it('should throw error when no false path is connected', async () => {
    const conditionValue = 'context.value < 5'
    const inputs = { conditions: conditionValue }

    // Remove false connection
    mockWorkflow.connections = [
      { source: mockSourceBlock.id, target: mockBlock.id },
      { source: mockBlock.id, target: mockTrueTargetBlock.id, sourceHandle: 'true' },
    ]

    // Mock the resolution pipeline
    mockResolver.resolveVariableReferences.mockReturnValue('context.value < 5')
    mockResolver.resolveBlockReferences.mockReturnValue('context.value < 5')
    mockResolver.resolveEnvVariables.mockReturnValue('context.value < 5')

    await expect(handler.execute(mockBlock, inputs, mockContext)).rejects.toThrow(
      'No false path connected for condition block "Test Condition". Condition evaluated to false.'
    )
  })

  it('should handle evaluation errors gracefully by returning false', async () => {
    // With null-safe evaluation, accessing undefined properties returns false instead of throwing
    const conditionValue = 'context.nonExistentProperty.doSomething()'
    const inputs = { conditions: conditionValue }

    // Mock the resolution pipeline
    mockResolver.resolveVariableReferences.mockReturnValue(
      'context.nonExistentProperty.doSomething()'
    )
    mockResolver.resolveBlockReferences.mockReturnValue('context.nonExistentProperty.doSomething()')
    mockResolver.resolveEnvVariables.mockReturnValue('context.nonExistentProperty.doSomething()')

    // Should return false instead of throwing, taking the false path
    const result = await handler.execute(mockBlock, inputs, mockContext)
    expect((result as any).conditionResult).toBe(false)
    expect((result as any).selectedConditionId).toBe('false')
  })

  it('should handle legacy JSON format for backward compatibility', async () => {
    const legacyConditions = [
      { id: 'cond1', title: 'if', value: 'context.value > 5' },
      { id: 'else1', title: 'else', value: '' },
    ]
    const inputs = { conditions: JSON.stringify(legacyConditions) }

    const expectedOutput = {
      value: 10,
      text: 'hello',
      content: 'Evaluated: context.value > 5 = true',
      conditionResult: true,
      selectedPath: {
        blockId: mockTrueTargetBlock.id,
        blockType: 'target',
        blockTitle: 'True Target Block',
      },
      selectedConditionId: 'true',
    }

    // Mock the resolution pipeline
    mockResolver.resolveVariableReferences.mockReturnValue('context.value > 5')
    mockResolver.resolveBlockReferences.mockReturnValue('context.value > 5')
    mockResolver.resolveEnvVariables.mockReturnValue('context.value > 5')

    const result = await handler.execute(mockBlock, inputs, mockContext)

    expect(result).toEqual(expectedOutput)
    expect(mockContext.decisions.condition.get(mockBlock.id)).toBe('true')
  })

  it('should block dangerous expression patterns for security', async () => {
    const dangerousConditions = ['eval("malicious")', 'Function("alert(1)")', 'require("fs")']

    for (const dangerous of dangerousConditions) {
      const inputs = { conditions: dangerous }

      // Mock the resolution pipeline to return the dangerous code
      mockResolver.resolveVariableReferences.mockReturnValue(dangerous)
      mockResolver.resolveBlockReferences.mockReturnValue(dangerous)
      mockResolver.resolveEnvVariables.mockReturnValue(dangerous)

      await expect(handler.execute(mockBlock, inputs, mockContext)).rejects.toThrow(
        /Expression contains blocked pattern/
      )
    }
  })
})
