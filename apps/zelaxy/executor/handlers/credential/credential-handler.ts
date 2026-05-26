import { and, eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { account } from '@/db/schema'
import { BlockType } from '@/executor/consts'
import type { BlockHandler, ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('CredentialBlockHandler')

export class CredentialBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.CREDENTIAL
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, unknown>,
    ctx: ExecutionContext
  ): Promise<any> {
    if (!ctx.userId) throw new Error('userId is required for credential resolution')

    const operation = typeof inputs.operation === 'string' ? inputs.operation : 'select'

    if (operation === 'list') return this.listCredentials(ctx.userId, inputs)
    return this.selectCredential(ctx.userId, inputs)
  }

  private async selectCredential(userId: string, inputs: Record<string, unknown>): Promise<any> {
    const credentialId = typeof inputs.credentialId === 'string' ? inputs.credentialId.trim() : ''
    if (!credentialId) throw new Error('No credential selected')

    const record = await db.query.account.findFirst({
      where: and(eq(account.id, credentialId), eq(account.userId, userId)),
      columns: { id: true, providerId: true, accountId: true },
    })

    if (!record) throw new Error(`Credential not found: ${credentialId}`)

    logger.info('Credential block resolved', { credentialId: record.id })
    return {
      credentialId: record.id,
      displayName: record.accountId,
      providerId: record.providerId,
    }
  }

  private async listCredentials(userId: string, inputs: Record<string, unknown>): Promise<any> {
    const providerFilter = Array.isArray(inputs.providerFilter)
      ? (inputs.providerFilter as string[]).filter(Boolean)
      : []

    const query = db.query.account.findMany({
      where: eq(account.userId, userId),
      columns: { id: true, providerId: true, accountId: true },
    })

    const records = await query

    const filtered =
      providerFilter.length > 0
        ? records.filter((r) => providerFilter.includes(r.providerId))
        : records

    const credentials = filtered.map((r) => ({
      credentialId: r.id,
      displayName: r.accountId,
      providerId: r.providerId,
    }))

    logger.info('Credential block listed credentials', { count: credentials.length })
    return { credentials, count: credentials.length }
  }
}
