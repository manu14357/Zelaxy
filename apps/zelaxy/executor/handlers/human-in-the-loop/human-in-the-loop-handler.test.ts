/**
 * Functional tests for the Human in the Loop block handler.
 *
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BlockType } from '@/executor/consts'
import { HumanInTheLoopBlockHandler } from '@/executor/handlers/human-in-the-loop/human-in-the-loop-handler'
import type { ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

describe('HumanInTheLoopBlockHandler', () => {
  const handler = new HumanInTheLoopBlockHandler()
  const block = {
    id: 'hitl-1',
    metadata: { id: BlockType.HUMAN_IN_THE_LOOP, name: 'Approve Step' },
  } as SerializedBlock

  const baseCtx = {
    workflowId: 'wf-1',
    executionId: 'exec-1',
  } as ExecutionContext

  const prevUrl = process.env.NEXT_PUBLIC_APP_URL
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
  })
  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = prevUrl
  })

  it('handles only human-in-the-loop blocks', () => {
    expect(handler.canHandle(block)).toBe(true)
    expect(handler.canHandle({ metadata: { id: 'other' } } as SerializedBlock)).toBe(false)
  })

  it('pauses execution with a waiting status and a context id', async () => {
    const result = await handler.execute(
      block,
      { title: 'Review', message: 'Please approve' },
      baseCtx
    )
    expect(result.status).toBe('waiting')
    expect(result.contextId).toContain('hitl-hitl-1-exec-1')
    expect(result.title).toBe('Review')
    expect(result.message).toBe('Please approve')
    expect(result._pauseMetadata.pauseKind).toBe('human-in-the-loop')
    expect(result._pauseMetadata.blockId).toBe('hitl-1')
  })

  it('generates approve + reject resume links tied to the context id', async () => {
    const result = await handler.execute(block, {}, baseCtx)
    expect(result.resumeLinks).toHaveLength(2)
    expect(result.resumeLinks[0]).toContain('/api/resume/exec-1')
    expect(result.resumeLinks[0]).toContain(`contextId=${result.contextId}`)
    expect(result.resumeLinks[0]).toContain('approved=true')
    expect(result.resumeLinks[1]).toContain('approved=false')
  })

  it('falls back the title to the block name, then a default', async () => {
    const named = await handler.execute(block, {}, baseCtx)
    expect(named.title).toBe('Approve Step')

    const unnamed = await handler.execute(
      { id: 'hitl-2', metadata: { id: BlockType.HUMAN_IN_THE_LOOP } } as SerializedBlock,
      {},
      baseCtx
    )
    expect(unnamed.title).toBe('Human Review Required')
  })

  it('uses description as the message when message is absent', async () => {
    const result = await handler.execute(block, { description: 'from description' }, baseCtx)
    expect(result.message).toBe('from description')
  })

  it('omits resume links when there is no base url', async () => {
    process.env.NEXT_PUBLIC_APP_URL = ''
    const result = await handler.execute(block, {}, baseCtx)
    expect(result.resumeLinks).toBeUndefined()
  })
})
