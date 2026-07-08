/**
 * Config tests for the DynamoDB block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DynamoDBBlock } from '@/blocks/blocks/dynamodb'

describe('DynamoDB Block Config', () => {
  it('has the correct block type', () => {
    expect(DynamoDBBlock.type).toBe('dynamodb')
  })

  it("is in the 'tools' category", () => {
    expect(DynamoDBBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DynamoDBBlock.tools.access.length).toBeGreaterThan(0)
    expect(DynamoDBBlock.tools.access).toContain('dynamodb_get_item')
    expect(DynamoDBBlock.tools.access).toContain('dynamodb_put_item')
    expect(DynamoDBBlock.tools.access).toContain('dynamodb_query')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DynamoDBBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DynamoDBBlock.name).toBeTruthy()
    expect(DynamoDBBlock.description).toBeTruthy()
  })
})
