/**
 * Config tests for the Amazon SQS block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { SqsBlock } from '@/blocks/blocks/sqs'

describe('Amazon SQS Block Config', () => {
  it('has the correct block type', () => {
    expect(SqsBlock.type).toBe('sqs')
  })

  it("is in the 'tools' category", () => {
    expect(SqsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(SqsBlock.tools.access.length).toBeGreaterThan(0)
    expect(SqsBlock.tools.access).toContain('sqs_send_message')
    expect(SqsBlock.tools.access).toContain('sqs_receive_message')
    expect(SqsBlock.tools.access).toContain('sqs_list_queues')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of SqsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(SqsBlock.name).toBeTruthy()
    expect(SqsBlock.description).toBeTruthy()
  })
})
