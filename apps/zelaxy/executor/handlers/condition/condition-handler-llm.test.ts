import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BlockType } from '@/executor/consts'
import type { ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'
import { ConditionBlockHandler } from './condition-handler'

// Mock the provider request function
vi.mock('@/providers', () => ({
  executeProviderRequest: vi.fn(),
}))

vi.mock('@/providers/utils', () => ({
  getProviderFromModel: vi.fn(() => 'openai'),
  getApiKey: vi.fn(() => 'test-api-key'),
}))

const { executeProviderRequest } = await import('@/providers')
const mockExecuteProviderRequest = vi.mocked(executeProviderRequest) as any

describe('ConditionBlockHandler - LLM as Judge', () => {
  let handler: ConditionBlockHandler
  let mockPathTracker: any
  let mockResolver: any
  let mockContext: ExecutionContext
  let mockBlock: SerializedBlock

  beforeEach(() => {
    vi.clearAllMocks()

    mockPathTracker = {
      updateExecutionPaths: vi.fn(),
    }

    mockResolver = {
      resolveVariableReferences: vi.fn((value) => value),
      resolveBlockReferences: vi.fn((value) => value),
      resolveEnvVariables: vi.fn((value) => value),
    }

    handler = new ConditionBlockHandler(mockPathTracker, mockResolver)

    mockContext = {
      workflowId: 'test-workflow',
      executedBlocks: new Set(),
      blockStates: new Map(),
      activeExecutionPath: new Set(),
      decisions: {
        condition: new Map(),
        router: new Map(),
      },
      completedLoops: new Set(),
      blockLogs: [],
      loopIterations: new Map(),
      loopItems: new Map(),
      environmentVariables: {},
      workflow: {
        version: '2.0',
        id: 'test-workflow',
        blocks: [
          {
            id: 'condition-1',
            metadata: { id: BlockType.CONDITION, name: 'Test Condition' },
          },
          {
            id: 'target-true',
            metadata: { id: 'agent', name: 'True Agent' },
          },
          {
            id: 'target-false',
            metadata: { id: 'agent', name: 'False Agent' },
          },
        ],
        connections: [
          {
            source: 'condition-1',
            target: 'target-true',
            sourceHandle: 'true',
          },
          {
            source: 'condition-1',
            target: 'target-false',
            sourceHandle: 'false',
          },
        ],
        loops: {},
        parallels: {},
        variables: {},
      },
      metadata: { duration: 0 },
    } as unknown as ExecutionContext

    mockBlock = {
      id: 'condition-1',
      metadata: { id: BlockType.CONDITION, name: 'Test Condition' },
    } as SerializedBlock
  })

  describe('LLM Evaluation Mode', () => {
    it('should evaluate LLM decision as YES -> true', async () => {
      // Mock successful LLM response
      mockExecuteProviderRequest.mockResolvedValue({
        success: true,
        output: {
          content: JSON.stringify({
            decision: 'YES',
            confidence: 0.9,
            reasoning: 'The content is positive and professional',
          }),
        },
      })

      const inputs = {
        evaluationMode: 'llm',
        llmPrompt: 'Is the content positive and professional?',
        llmContext: 'This is a great piece of work!',
        llmModel: 'gpt-4o-mini',
        requireConfidence: false,
      }

      const result = await handler.execute(mockBlock, inputs, mockContext)

      expect((result as any).conditionResult).toBe(true)
      expect((result as any).selectedConditionId).toBe('true')
      expect((result as any).selectedPath.blockId).toBe('target-true')
      expect((result as any).llmJudgement).toBeDefined()
      expect((result as any).llmJudgement.decision).toBe('YES')
      expect((result as any).llmJudgement.confidence).toBe(0.9)
      expect((result as any).content).toContain('LLM Judge: YES')
    })

    it('should evaluate LLM decision as NO -> false', async () => {
      mockExecuteProviderRequest.mockResolvedValue({
        success: true,
        output: {
          content: JSON.stringify({
            decision: 'NO',
            confidence: 0.85,
            reasoning: 'The content is negative in tone',
          }),
        },
      })

      const inputs = {
        evaluationMode: 'llm',
        llmPrompt: 'Is the content positive?',
        llmContext: 'This is terrible work.',
        llmModel: 'gpt-4o-mini',
      }

      const result = await handler.execute(mockBlock, inputs, mockContext)

      expect((result as any).conditionResult).toBe(false)
      expect((result as any).selectedConditionId).toBe('false')
      expect((result as any).selectedPath.blockId).toBe('target-false')
      expect((result as any).llmJudgement.decision).toBe('NO')
    })

    it('should handle confidence requirement rejection', async () => {
      mockExecuteProviderRequest.mockResolvedValue({
        success: true,
        output: {
          content: JSON.stringify({
            decision: 'YES',
            confidence: 0.7, // Below 0.8 threshold
            reasoning: 'Somewhat positive but unclear',
          }),
        },
      })

      const inputs = {
        evaluationMode: 'llm',
        llmPrompt: 'Is the content positive?',
        llmContext: 'Maybe this is good?',
        llmModel: 'gpt-4o-mini',
        requireConfidence: true,
      }

      await expect(handler.execute(mockBlock, inputs, mockContext)).rejects.toThrow(
        'LLM decision confidence (70%) is below required threshold (80%)'
      )
    })

    it('should handle non-JSON LLM response with text fallback', async () => {
      mockExecuteProviderRequest.mockResolvedValue({
        success: true,
        output: {
          content: 'Based on my analysis, the answer is YES. The content meets the criteria.',
        },
      })

      const inputs = {
        evaluationMode: 'llm',
        llmPrompt: 'Is the content acceptable?',
        llmContext: 'Good content here',
        llmModel: 'gpt-4o-mini',
      }

      const result = await handler.execute(mockBlock, inputs, mockContext)

      expect((result as any).conditionResult).toBe(true)
      expect((result as any).llmJudgement.decision).toBe('YES')
      expect((result as any).llmJudgement.reasoning).toContain('text analysis')
    })

    it('should throw error for missing LLM prompt', async () => {
      const inputs = {
        evaluationMode: 'llm',
        llmPrompt: '', // Empty prompt
        llmContext: 'Some context',
        llmModel: 'gpt-4o-mini',
      }

      await expect(handler.execute(mockBlock, inputs, mockContext)).rejects.toThrow(
        'LLM Judge Prompt is required when using LLM evaluation mode'
      )
    })

    it('should resolve references in LLM context', async () => {
      mockResolver.resolveBlockReferences.mockReturnValue('Resolved content from agent')

      mockExecuteProviderRequest.mockResolvedValue({
        success: true,
        output: {
          content: JSON.stringify({
            decision: 'YES',
            confidence: 0.9,
            reasoning: 'Content is acceptable',
          }),
        },
      })

      const inputs = {
        evaluationMode: 'llm',
        llmPrompt: 'Is this content good?',
        llmContext: '{{agent1.content}}',
        llmModel: 'gpt-4o-mini',
      }

      await handler.execute(mockBlock, inputs, mockContext)

      expect(mockResolver.resolveBlockReferences).toHaveBeenCalledWith(
        '{{agent1.content}}',
        mockContext,
        mockBlock
      )
    })
  })

  describe('Expression Evaluation Mode (Backward Compatibility)', () => {
    it('should still work with boolean expressions', async () => {
      const inputs = {
        evaluationMode: 'expression',
        conditions: '1 === 1',
      }

      // Mock source block for expression evaluation
      mockContext.blockStates.set('source-block', {
        output: { content: 'test' },
        executed: true,
        executionTime: 100,
      })

      mockContext.workflow!.connections.unshift({
        source: 'source-block',
        target: 'condition-1',
      })

      const result = await handler.execute(mockBlock, inputs, mockContext)

      expect((result as any).conditionResult).toBe(true)
      expect((result as any).selectedConditionId).toBe('true')
      expect((result as any).content).toContain('Evaluated: 1 === 1 = true')
    })

    it('should default to expression mode for backward compatibility', async () => {
      const inputs = {
        // No evaluationMode specified
        conditions: 'true',
      }

      // Mock source block
      mockContext.blockStates.set('source-block', {
        output: { content: 'test' },
        executed: true,
        executionTime: 100,
      })

      mockContext.workflow!.connections.unshift({
        source: 'source-block',
        target: 'condition-1',
      })

      const result = await handler.execute(mockBlock, inputs, mockContext)

      expect((result as any).conditionResult).toBe(true)
      expect((result as any).llmJudgement).toBeUndefined()
    })
  })
})
