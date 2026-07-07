/**
 * Functional tests for the Credential block handler.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BlockType } from '@/executor/consts'
import { CredentialBlockHandler } from '@/executor/handlers/credential/credential-handler'
import type { ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const findFirst = vi.fn()
const findMany = vi.fn()

vi.mock('@/db', () => ({
  db: {
    query: { account: { findFirst: (...a: any[]) => findFirst(...a), findMany: () => findMany() } },
  },
}))
vi.mock('@/db/schema', () => ({
  account: { id: 'id', userId: 'userId', providerId: 'providerId', accountId: 'accountId' },
}))

describe('CredentialBlockHandler', () => {
  const handler = new CredentialBlockHandler()
  const block = { id: 'cred-1', metadata: { id: BlockType.CREDENTIAL } } as SerializedBlock
  const ctx = { userId: 'user-1' } as ExecutionContext

  beforeEach(() => vi.clearAllMocks())

  it('handles only credential blocks', () => {
    expect(handler.canHandle(block)).toBe(true)
    expect(handler.canHandle({ metadata: { id: 'other' } } as SerializedBlock)).toBe(false)
  })

  it('requires a userId', async () => {
    await expect(
      handler.execute(block, { operation: 'select' }, {} as ExecutionContext)
    ).rejects.toThrow(/userId/)
  })

  it('select: throws when no credential is chosen', async () => {
    await expect(
      handler.execute(block, { operation: 'select', credentialId: '  ' }, ctx)
    ).rejects.toThrow(/No credential selected/)
  })

  it('select: throws when the credential is not found', async () => {
    findFirst.mockResolvedValue(undefined)
    await expect(
      handler.execute(block, { operation: 'select', credentialId: 'c1' }, ctx)
    ).rejects.toThrow(/not found/)
  })

  it('select: returns the resolved credential', async () => {
    findFirst.mockResolvedValue({ id: 'c1', providerId: 'google', accountId: 'me@example.com' })
    const result = await handler.execute(block, { operation: 'select', credentialId: 'c1' }, ctx)
    expect(result).toEqual({
      credentialId: 'c1',
      displayName: 'me@example.com',
      providerId: 'google',
    })
  })

  it('list: returns every credential with a count', async () => {
    findMany.mockResolvedValue([
      { id: 'c1', providerId: 'google', accountId: 'a' },
      { id: 'c2', providerId: 'slack', accountId: 'b' },
    ])
    const result = await handler.execute(block, { operation: 'list' }, ctx)
    expect(result.count).toBe(2)
    expect(result.credentials[0]).toEqual({
      credentialId: 'c1',
      displayName: 'a',
      providerId: 'google',
    })
  })

  it('list: applies the providerFilter', async () => {
    findMany.mockResolvedValue([
      { id: 'c1', providerId: 'google', accountId: 'a' },
      { id: 'c2', providerId: 'slack', accountId: 'b' },
    ])
    const result = await handler.execute(
      block,
      { operation: 'list', providerFilter: ['slack'] },
      ctx
    )
    expect(result.count).toBe(1)
    expect(result.credentials[0].providerId).toBe('slack')
  })

  it('defaults to the select operation when none is given', async () => {
    findFirst.mockResolvedValue({ id: 'c9', providerId: 'notion', accountId: 'n' })
    const result = await handler.execute(block, { credentialId: 'c9' }, ctx)
    expect(result.credentialId).toBe('c9')
  })
})
