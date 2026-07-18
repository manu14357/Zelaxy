/**
 * Streaming handling on the DAG path: when a handler returns a StreamingExecution, the block
 * executor forwards the display stream to ctx.onStream and drains the executor copy to reconstruct
 * the block's content for downstream blocks.
 *
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/executor/utils', () => ({
  streamingResponseFormatProcessor: { processStream: (s: ReadableStream) => s },
}))

import type { DAGNode } from '@/executor/dag/builder'
import { BlockExecutor } from '@/executor/execution/block-executor'
import type { BlockHandler, ExecutionContext, StreamingExecution } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

function textStream(chunks: string[]): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      for (const c of chunks) controller.enqueue(enc.encode(c))
      controller.close()
    },
  })
}

const agentBlock = {
  id: 'agent',
  position: { x: 0, y: 0 },
  metadata: { id: 'agent', name: 'Agent' },
  config: { tool: 'agent', params: {} },
  inputs: {},
  outputs: {},
  enabled: true,
} as SerializedBlock

function streamingHandler(): BlockHandler {
  return {
    canHandle: (b) => b.metadata?.id === 'agent',
    execute: async (): Promise<StreamingExecution> => ({
      stream: textStream(['Hello, ', 'streamed ', 'world']),
      execution: {
        success: true,
        output: { content: '', model: 'test' },
        logs: [],
        blockId: 'agent',
      } as any,
    }),
  }
}

function ctx(onStream?: any): ExecutionContext {
  return {
    workflowId: 'wf',
    blockStates: new Map(),
    blockLogs: [],
    metadata: { duration: 0 },
    environmentVariables: {},
    decisions: { router: new Map(), condition: new Map() },
    loopIterations: new Map(),
    loopItems: new Map(),
    completedLoops: new Set(),
    executedBlocks: new Set(),
    activeExecutionPath: new Set(),
    selectedOutputIds: [],
    onStream,
  } as unknown as ExecutionContext
}

const node = { id: 'agent', block: agentBlock, metadata: {} } as unknown as DAGNode
const resolver = { resolveInputs: () => ({}) } as any

describe('DAG block executor — streaming', () => {
  it('drains the stream into content when there is no client listener', async () => {
    const exec = new BlockExecutor([streamingHandler()], resolver)
    const output = await exec.execute(ctx(), node, agentBlock)
    expect(output.content).toBe('Hello, streamed world')
  })

  it('forwards to onStream and still reconstructs content', async () => {
    const onStream = vi.fn(async () => '')
    const exec = new BlockExecutor([streamingHandler()], resolver)
    const output = await exec.execute(ctx(onStream), node, agentBlock)
    expect(onStream).toHaveBeenCalledTimes(1)
    expect(output.content).toBe('Hello, streamed world')
  })
})
